# JSON Genie

JSON Genie turns messy documents into clear, inspectable JSON. Paste an invoice, job posting, email, or any other source text, choose the fields you care about, and receive a structured result that is easy to review, copy, and reuse.

## What it does

- Extracts fields from unstructured text using reusable schemas.
- Includes ready-to-use schemas for invoices, job postings, and emails.
- Lets you define custom fields with string, number, boolean, date, and list types.
- Shows every field with a clear validation status: validated, missing, or mismatch.
- Keeps the original source unchanged while presenting the extracted result beside it.
- Supports raw JSON view, one-click copying, JSON download, and a short session history.

## Validation-first workflow

Each result is checked against its selected schema before it reaches the interface. Values that are not present are returned as `null` and marked as missing. Values that do not match their declared type are also returned as `null`, with a mismatch status so they can be reviewed instead of silently accepted.

This makes JSON Genie useful for quick document triage, structured review, and lightweight data preparation where the result should remain transparent and easy to inspect.

## Project structure

The project is split into two focused parts:

- `frontend/` contains the browser workspace and result viewer.
- `backend/` contains the extraction service, schema definitions, validation, and tests.

The browser keeps session history locally and does not persist source documents as part of the application.

## Built with

React and TypeScript power the workspace, while FastAPI and Pydantic provide the service and validation layer. The extraction provider is used only to propose schema-shaped values; the backend remains responsible for parsing and validating the returned data.
