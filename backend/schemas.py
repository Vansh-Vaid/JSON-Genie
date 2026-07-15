"""Schema definitions and runtime schema compiler for JSON Genie."""

from __future__ import annotations

import re
from datetime import date
from typing import Annotated, Any, Optional

from pydantic import BaseModel, ConfigDict, Field, StrictBool, StrictFloat, StrictInt, StrictStr, create_model

StrictNumber = StrictInt | StrictFloat
DateValue = Annotated[date, Field(strict=False)]


class FieldSpec(BaseModel):
    name: str = Field(pattern=r"^[A-Za-z_][A-Za-z0-9_]*$")
    type: str = Field(pattern=r"^(string|number|boolean|date|list\[string\])$")
    required: bool = True


class SchemaField(BaseModel):
    name: str
    type: str
    required: bool


# Fields are nullable by design: an unavailable value is a truthful result, not an error.
class Invoice(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    vendor_name: Optional[StrictStr] = None
    invoice_number: Optional[StrictStr] = None
    total_amount: Optional[StrictNumber] = None
    due_date: Optional[StrictStr] = None
    line_items: Optional[list[StrictStr]] = None


class JobPosting(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    title: Optional[StrictStr] = None
    company: Optional[StrictStr] = None
    location: Optional[StrictStr] = None
    salary_range: Optional[StrictStr] = None
    required_skills: Optional[list[StrictStr]] = None


class Email(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    sender: Optional[StrictStr] = None
    subject: Optional[StrictStr] = None
    intent: Optional[StrictStr] = None
    action_items: Optional[list[StrictStr]] = None


PRESETS: dict[str, tuple[type[BaseModel], list[SchemaField]]] = {
    "invoice": (
        Invoice,
        [
            SchemaField(name="vendor_name", type="string", required=True),
            SchemaField(name="invoice_number", type="string", required=True),
            SchemaField(name="total_amount", type="number", required=True),
            SchemaField(name="due_date", type="string", required=False),
            SchemaField(name="line_items", type="list[string]", required=True),
        ],
    ),
    "job_posting": (
        JobPosting,
        [
            SchemaField(name="title", type="string", required=True),
            SchemaField(name="company", type="string", required=True),
            SchemaField(name="location", type="string", required=True),
            SchemaField(name="salary_range", type="string", required=False),
            SchemaField(name="required_skills", type="list[string]", required=True),
        ],
    ),
    "email": (
        Email,
        [
            SchemaField(name="sender", type="string", required=True),
            SchemaField(name="subject", type="string", required=True),
            SchemaField(name="intent", type="string", required=True),
            SchemaField(name="action_items", type="list[string]", required=False),
        ],
    ),
}

TYPE_MAP: dict[str, Any] = {
    "string": StrictStr,
    # JSON has one numeric family; accept both JSON integers and decimals but never strings/bools.
    "number": StrictNumber,
    "boolean": StrictBool,
    # ISO date strings are the natural JSON representation and Pydantic validates their calendar value.
    "date": DateValue,
    "list[string]": list[StrictStr],
}


def get_schema(schema_name: str, custom_fields: list[FieldSpec] | None = None) -> tuple[type[BaseModel], list[SchemaField]]:
    if schema_name == "custom":
        return build_custom_schema(custom_fields or [])
    try:
        return PRESETS[schema_name]
    except KeyError as error:
        raise ValueError("Choose one of: invoice, job_posting, email, or custom.") from error


def build_custom_schema(fields: list[FieldSpec]) -> tuple[type[BaseModel], list[SchemaField]]:
    if not fields:
        raise ValueError("Add at least one field to a custom schema.")
    names = [field.name for field in fields]
    if len(set(names)) != len(names):
        raise ValueError("Custom schema field names must be unique.")
    if any(not re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", name) for name in names):
        raise ValueError("Use letters, numbers, and underscores for field names.")

    model_fields: dict[str, tuple[Any, Any]] = {}
    for field in fields:
        annotation = Optional[TYPE_MAP[field.type]]
        model_fields[field.name] = (annotation, Field(default=None, json_schema_extra={"required": field.required}))

    model = create_model(
        "CustomExtraction",
        __config__=ConfigDict(extra="forbid", strict=True),
        **model_fields,
    )
    return model, [SchemaField(name=f.name, type=f.type, required=f.required) for f in fields]


def tool_schema(model: type[BaseModel]) -> dict[str, Any]:
    """Return a schema that permits explicit null values."""
    return model.model_json_schema()
