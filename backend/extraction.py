"""Gemini structured-output extraction and trusted Pydantic validation."""

from __future__ import annotations

import asyncio
import json
import os
from datetime import date
from typing import Any

from google import genai
from pydantic import BaseModel, ValidationError

from schemas import SchemaField, tool_schema


SYSTEM_PROMPT = """You extract source documents into the supplied JSON schema. Use only facts stated in the document.
When a value is absent, ambiguous, or cannot be confidently determined, return null. Do not invent values.
Return only the structured response requested by the schema. Keep original wording where practical."""


def _call_gemini(text: str, model: type[BaseModel]) -> dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured.")
    client = genai.Client(api_key=api_key)
    interaction = client.interactions.create(
        model=os.getenv("GEMINI_MODEL", "gemini-3.5-flash"),
        input=f"{SYSTEM_PROMPT}\n\nDocument to inspect:\n{text}",
        response_format={
            "type": "text",
            "mime_type": "application/json",
            "schema": tool_schema(model),
        },
    )
    if not interaction.output_text:
        raise RuntimeError("Gemini did not return structured extraction output.")
    try:
        parsed = json.loads(interaction.output_text)
    except json.JSONDecodeError as error:
        raise RuntimeError("Gemini returned malformed structured output.") from error
    if not isinstance(parsed, dict):
        raise RuntimeError("Gemini returned a non-object structured response.")
    return parsed


def normalize_model_response(raw: dict[str, Any], model: type[BaseModel], specs: list[SchemaField]) -> tuple[dict[str, Any], dict[str, str]]:
    """Validate response. Invalid values become null and are explicitly marked as mismatches."""
    names = {spec.name for spec in specs}
    statuses = {name: "missing" if raw.get(name) is None else "validated" for name in names}
    candidate = {name: raw.get(name) for name in names}
    # Gemini returns JSON strings for dates; Pydantic strict mode expects a Python date object.
    # Convert only valid ISO dates before validation so malformed dates remain visible mismatches.
    for spec in specs:
        if spec.type == "date" and isinstance(candidate[spec.name], str):
            try:
                candidate[spec.name] = date.fromisoformat(candidate[spec.name])
            except ValueError:
                candidate[spec.name] = None
                statuses[spec.name] = "mismatch"
    try:
        trusted = model.model_validate(candidate, strict=True)
    except ValidationError as error:
        invalid_names = {str(item["loc"][0]) for item in error.errors() if item.get("loc")}
        for name in invalid_names:
            if name in candidate:
                candidate[name] = None
                statuses[name] = "mismatch"
        # Candidate now contains only model-compatible values or explicit nulls.
        trusted = model.model_validate(candidate, strict=True)
    return trusted.model_dump(mode="json"), statuses


async def extract_document(text: str, model: type[BaseModel], specs: list[SchemaField]) -> tuple[dict[str, Any], dict[str, str]]:
    raw = await asyncio.to_thread(_call_gemini, text, model)
    return normalize_model_response(raw, model, specs)
