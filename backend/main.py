from __future__ import annotations

import os
import logging
from typing import Any, Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from extraction import extract_document
from schemas import FieldSpec, SchemaField, get_schema

app = FastAPI(title="JSON Genie", version="1.0.0")
logger = logging.getLogger(__name__)
allowed_origins = [origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ExtractRequest(BaseModel):
    text: str = Field(min_length=1, max_length=50000)
    schema_name: Literal["invoice", "job_posting", "email", "custom"]
    custom_fields: list[FieldSpec] | None = None


class ResultField(BaseModel):
    name: str
    type: str
    required: bool
    value: Any
    status: Literal["validated", "missing", "mismatch"]
    confidence: float | None = None


class ExtractResponse(BaseModel):
    schema_name: str
    result: dict[str, Any]
    fields: list[ResultField]
    matched_count: int
    missing_count: int
    mismatch_count: int


def extraction_error_message(error: Exception) -> str:
    """Turn common provider failures into a useful, safe instruction for the user."""
    detail = str(error).lower()
    if "gemini_api_key is not configured" in detail:
        return "Gemini API key is missing. Set GEMINI_API_KEY in the terminal running the backend, then restart it."
    if any(marker in detail for marker in ("401", "403", "permission_denied", "api key")):
        return "Gemini rejected the API key. Create or verify a Gemini API key, then restart the backend."
    if any(marker in detail for marker in ("429", "resource_exhausted", "quota")):
        return "Gemini's free-tier limit was reached. Try again later, or use a key with available quota."
    if any(marker in detail for marker in ("404", "not_found", "model not found")):
        return "The configured Gemini model is unavailable. Set GEMINI_MODEL=gemini-3.5-flash and restart the backend."
    return "Extraction failed — Gemini didn't return valid structured output. Try again, or simplify the input."


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/")
def service_info() -> dict[str, str]:
    """Provide a friendly response when the deployed service URL is opened directly."""
    return {"service": "JSON Genie API", "status": "ok", "health": "/health", "docs": "/docs"}


@app.post("/extract", response_model=ExtractResponse)
async def extract(request: ExtractRequest) -> ExtractResponse:
    try:
        model, specs = get_schema(request.schema_name, request.custom_fields)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    try:
        result, statuses, confidences = await extract_document(request.text, model, specs)
    except Exception as error:
        logger.exception("Gemini extraction failed")
        raise HTTPException(
            status_code=502,
            detail=extraction_error_message(error),
        ) from error

    fields = [
        ResultField(**spec.model_dump(), value=result[spec.name], status=statuses[spec.name], confidence=confidences.get(spec.name))
        for spec in specs
    ]
    counts = {status: list(statuses.values()).count(status) for status in ("validated", "missing", "mismatch")}
    return ExtractResponse(
        schema_name=request.schema_name,
        result=result,
        fields=fields,
        matched_count=counts["validated"],
        missing_count=counts["missing"],
        mismatch_count=counts["mismatch"],
    )


class ApplyOverridesRequest(BaseModel):
    schema_name: Literal["invoice", "job_posting", "email", "custom"]
    overrides: dict[str, Any]
    base_result: dict[str, Any] | None = None
    custom_fields: list[FieldSpec] | None = None


@app.post("/apply_overrides", response_model=ExtractResponse)
async def apply_overrides(request: ApplyOverridesRequest) -> ExtractResponse:
    try:
        model, specs = get_schema(request.schema_name, request.custom_fields)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    names = {spec.name for spec in specs}
    base = request.base_result or {}
    raw = {name: base.get(name) for name in names}
    # apply only known fields from overrides
    for k, v in request.overrides.items():
        if k in raw:
            raw[k] = v

    result, statuses, confidences = normalize_model_response(raw, model, specs)

    fields = [ResultField(**spec.model_dump(), value=result[spec.name], status=statuses[spec.name], confidence=confidences.get(spec.name)) for spec in specs]
    counts = {status: list(statuses.values()).count(status) for status in ("validated", "missing", "mismatch")}
    return ExtractResponse(
        schema_name=request.schema_name,
        result=result,
        fields=fields,
        matched_count=counts["validated"],
        missing_count=counts["missing"],
        mismatch_count=counts["mismatch"],
    )
