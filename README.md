# JSON Genie

JSON Genie turns everyday text into dependable, inspectable JSON. Paste a paragraph, email, invoice, job description, or any other source text, choose a schema, and get the details that matter in a clear, reviewable format.

## A focused extraction workspace

JSON Genie is designed around a simple split view: source text stays visible on one side while the resolved fields appear beside it. The interface is intentionally calm and information-dense, so the result can be checked at a glance instead of treated as a black box.

- Works with natural, messy, and unstructured text—no fixed document template required.
- Includes invoice, job posting, and email schemas for common workflows.
- Supports custom fields with string, number, boolean, date, and list types.
- Presents validated, missing, and mismatched values with clear status markers.
- Switches between a field view and the underlying raw JSON.
- Copies results, downloads JSON, and keeps a short local session history.
- Includes responsive layouts, keyboard-friendly controls, and an intentional dark mode.

## Transparent by design

Every extracted value is checked against the selected schema before it reaches the result panel. Missing information is returned as `null` and marked as missing. Values that do not match their declared type are also returned as `null` and marked as mismatches, making uncertainty visible rather than silently hiding it.

The original source remains unchanged, and session history stays in the browser. JSON Genie is suited to document triage, structured review, and lightweight data preparation where people need to understand the result as well as use it.

## Product details

The UI uses a small, consistent design system with neutral surfaces, a single blue accent, accessible focus states, responsive cards, and restrained motion. A compact navigation bar provides theme switching, GitHub access, and workspace status without distracting from the extraction task.

## Project structure

- `frontend/` contains the React workspace, design system, responsive components, and result viewer.
- `backend/` contains the FastAPI extraction service, schema compiler, validation layer, and tests.

## Built with

React and TypeScript power the browser workspace. FastAPI and Pydantic provide the service and validation layer, while the extraction provider proposes schema-shaped values that are checked by the backend before being displayed.
