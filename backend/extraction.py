"""Gemini structured-output extraction and trusted Pydantic validation."""

from __future__ import annotations

import asyncio
import json
import os
import re
import time
from datetime import date, datetime
from typing import Any

from types import SimpleNamespace
try:
    from google import genai
except Exception:
    # Allow tests to monkeypatch extraction.genai when the package isn't installed.
    # Provide a minimal Client attribute so tests can monkeypatch it with monkeypatch.setattr.
    genai = SimpleNamespace(Client=lambda api_key: None)
from pydantic import BaseModel, ValidationError

from schemas import SchemaField, tool_schema


SYSTEM_PROMPT = """You extract information from arbitrary raw text into the supplied JSON schema.
The input may be conversational, badly formatted, incomplete, noisy, or contain no labels at all.
Read the meaning of the full text rather than expecting a template, headings, or line breaks.
Use only facts stated in the text. When a value is absent, ambiguous, or cannot be confidently determined, return null.
Do not invent values. Return only the structured response requested by the schema and keep original wording where practical."""


def _parse_json_object(output: str) -> dict[str, Any]:
    """Accept JSON returned directly, in a markdown fence, or with brief surrounding prose.

    Be tolerant of common provider formatting issues: fenced code blocks, single quotes, trailing
    commas, and Python-style literals (None/True/False). Attempt to repair before failing so
    downstream validation can mark mismatches rather than hard-failing.
    """
    cleaned = output.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned
        cleaned = cleaned.rsplit("```", 1)[0].strip()
    # strip BOM if present
    cleaned = cleaned.lstrip("\ufeff")

    # First pass: try strict JSON
    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        # Repair common issues and try again
        repaired = cleaned
        # Replace Python-style literals with JSON ones
        repaired = re.sub(r"\bNone\b", "null", repaired)
        repaired = re.sub(r"\bTrue\b", "true", repaired)
        repaired = re.sub(r"\bFalse\b", "false", repaired)
        # Remove trailing commas before } or ]
        repaired = re.sub(r",\s*(?=[}\]])", "", repaired)
        # Heuristic: convert simple single-quoted keys/values to double quotes
        repaired = re.sub(r"(?<!\\)'([A-Za-z0-9_ \-/:,.@]+?)'", r'"\1"', repaired)

        start, end = repaired.find("{"), repaired.rfind("}")
        if start < 0 or end <= start:
            raise RuntimeError("Gemini returned malformed structured output.")
        try:
            parsed = json.loads(repaired[start:end + 1])
        except json.JSONDecodeError as error:
            # Fallback: try the original slice if repairs broke something
            try:
                parsed = json.loads(cleaned[start:end + 1])
            except json.JSONDecodeError:
                raise RuntimeError("Gemini returned malformed structured output.") from error
    if not isinstance(parsed, dict):
        raise RuntimeError("Gemini returned a non-object structured response.")
    return parsed


def _call_gemini(text: str, model: type[BaseModel]) -> dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured.")
    retries = int(os.getenv("GEMINI_RETRIES", "2"))
    backoff = float(os.getenv("GEMINI_BACKOFF", "1.0"))
    last_error: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
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
            output = getattr(interaction, "output_text", None)
            if not output:
                raise RuntimeError("Gemini did not return structured extraction output.")
            return _parse_json_object(output)
        except Exception as error:
            last_error = error
            # simple exponential backoff between attempts
            if attempt < retries:
                time.sleep(backoff * (2 ** (attempt - 1)))
                continue
            # on final failure, surface the provider's message for user-friendly diagnostics
            raise


def normalize_model_response(raw: dict[str, Any], model: type[BaseModel], specs: list[SchemaField]) -> tuple[dict[str, Any], dict[str, str]]:
    """Validate response. Invalid values become null and are explicitly marked as mismatches."""
    names = {spec.name for spec in specs}
    statuses = {name: "missing" if raw.get(name) is None else "validated" for name in names}
    candidate = {name: raw.get(name) for name in names}
    # Normalize common loose types returned by providers into the strict Python types pydantic expects.
    # - Accept numeric strings and common formatted numbers for 'number'.
    # - Accept several human-friendly date formats for 'date'.
    # - Turn comma/newline/semicolon-separated strings into list[string].
    date_formats = ("%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%b %d, %Y", "%d %b %Y", "%B %d, %Y", "%d %B %Y")
    for spec in specs:
        val = candidate.get(spec.name)
        # attempt number normalization from strings like "1,234" or "1349.5"
        if spec.type == "number" and isinstance(val, str):
            try:
                sanitized = val.replace(",", "")
                candidate[spec.name] = int(sanitized) if sanitized.isdigit() else float(sanitized)
            except Exception:
                m = re.search(r"[-+]?[0-9]{1,3}(?:[0-9,]*)(?:\.[0-9]+)?", val)
                if m:
                    s = m.group(0).replace(",", "")
                    try:
                        candidate[spec.name] = int(s) if "." not in s else float(s)
                    except Exception:
                        candidate[spec.name] = None
                        statuses[spec.name] = "mismatch"
                else:
                    candidate[spec.name] = None
                    statuses[spec.name] = "mismatch"
        # attempt date normalization from several common formats
        if spec.type == "date" and isinstance(val, str):
            parsed_date = None
            try:
                parsed_date = date.fromisoformat(val)
            except Exception:
                for fmt in date_formats:
                    try:
                        parsed_date = datetime.strptime(val, fmt).date()
                        break
                    except Exception:
                        continue
            if parsed_date is None:
                candidate[spec.name] = None
                statuses[spec.name] = "mismatch"
            else:
                candidate[spec.name] = parsed_date
        # turn simple delimited strings into list[string]
        if spec.type == "list[string]" and isinstance(val, str):
            parts = [p.strip() for p in re.split(r"[,;\n]+", val) if p.strip()]
            candidate[spec.name] = parts if parts else None
            if candidate[spec.name] is None:
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
