from types import SimpleNamespace

import extraction
from main import extraction_error_message
from schemas import FieldSpec, build_custom_schema, get_schema
from extraction import normalize_model_response


def test_invoice_sample_validates():
    model, specs = get_schema("invoice")
    result, statuses = normalize_model_response(
        {"vendor_name": "Northstar Office", "invoice_number": "INV-2048", "total_amount": 1349.5,
         "due_date": "2026-08-01", "line_items": ["Ergonomic chairs", "Delivery"]}, model, specs
    )
    assert result["total_amount"] == 1349.5
    assert set(statuses.values()) == {"validated"}


def test_sparse_job_post_marks_missing():
    model, specs = get_schema("job_posting")
    result, statuses = normalize_model_response(
        {"title": "Data Analyst", "company": "Acme", "location": None, "salary_range": None, "required_skills": None}, model, specs
    )
    assert result["location"] is None
    assert statuses["location"] == "missing"


def test_email_sample_and_custom_schema_runtime_compilation():
    model, specs = get_schema("email")
    result, _ = normalize_model_response(
        {"sender": "meera@example.com", "subject": "Project review", "intent": "Schedule a review", "action_items": ["Send agenda"]}, model, specs
    )
    assert result["sender"] == "meera@example.com"
    custom, custom_specs = build_custom_schema([FieldSpec(name="priority", type="number", required=True)])
    custom_result, statuses = normalize_model_response({"priority": "urgent"}, custom, custom_specs)
    assert custom_result["priority"] is None
    assert statuses["priority"] == "mismatch"


def test_custom_schema_accepts_iso_date_and_json_integer_number():
    custom, specs = build_custom_schema([
        FieldSpec(name="review_date", type="date", required=True),
        FieldSpec(name="headcount", type="number", required=True),
    ])
    result, statuses = normalize_model_response({"review_date": "2026-08-05", "headcount": 12}, custom, specs)
    assert result == {"review_date": "2026-08-05", "headcount": 12}
    assert set(statuses.values()) == {"validated"}


def test_gemini_request_uses_structured_json_schema(monkeypatch):
    model, _ = get_schema("invoice")
    captured = {}

    class FakeInteractions:
        def create(self, **kwargs):
            captured.update(kwargs)
            return SimpleNamespace(output_text='{"vendor_name": "Northstar"}')

    class FakeClient:
        interactions = FakeInteractions()

    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(extraction.genai, "Client", lambda api_key: FakeClient())
    assert extraction._call_gemini("Invoice from Northstar", model) == {"vendor_name": "Northstar"}
    assert captured["response_format"]["mime_type"] == "application/json"
    assert captured["response_format"]["schema"] == model.model_json_schema()


def test_provider_error_messages_are_actionable():
    assert "GEMINI_API_KEY" in extraction_error_message(RuntimeError("GEMINI_API_KEY is not configured."))
    assert "free-tier" in extraction_error_message(RuntimeError("429 RESOURCE_EXHAUSTED"))
