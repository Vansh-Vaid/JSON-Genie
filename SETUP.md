Environment and setup

Required environment variables for running the backend locally:

- GEMINI_API_KEY: Your Google Gemini API key used by the extraction provider. Set this in the shell running the backend, e.g. `set GEMINI_API_KEY=...` (Windows) or `export GEMINI_API_KEY=...` (macOS/Linux).
- GEMINI_MODEL (optional): Model to use. Default: `gemini-3.5-flash`.
- ALLOWED_ORIGINS (optional): Comma-separated list of allowed CORS origins. Default: `http://localhost:5173`.

Run backend tests

cd backend
python -m pytest

Run frontend build

cd frontend
npm ci
npm run build
