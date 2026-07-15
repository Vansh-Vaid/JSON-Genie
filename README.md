# JSON Genie

JSON Genie converts unstructured documents into validated, inspectable JSON. The service validates every extraction against a selected schema before returning it to the interface.

## Run locally

Prerequisites: Python 3.10+, Node 20+, and a Gemini API key. Create a free-tier key in [Google AI Studio](https://aistudio.google.com/app/apikey).

1. In one terminal, start the API:

   ```powershell
   cd backend
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   $env:GEMINI_API_KEY="your-gemini-key"
   # Optional: use the free-tier Flash default explicitly
   $env:GEMINI_MODEL="gemini-3.5-flash"
   uvicorn main:app --reload
   ```

2. In a second terminal, start the app:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

Open `http://localhost:5173`. Set `VITE_API_URL` if the API is not at `http://localhost:8000`.

## Verification

The backend tests cover realistic invoice, job-posting, and email payloads, custom runtime schema compilation, sparse values, and type mismatches:

```powershell
cd backend
pytest
```

## Deployment

Deploy `backend/` to Render with `uvicorn main:app --host 0.0.0.0 --port $PORT` and add `GEMINI_API_KEY` plus `ALLOWED_ORIGINS=https://your-vercel-app.vercel.app` as secrets. Deploy `frontend/` to Vercel, set `VITE_API_URL` to the Render URL, and redeploy.

## Validation behavior

- The extraction service requests values using the selected JSON schema.
- Responses are parsed and validated server-side in strict mode.
- Missing values are explicitly `null`; invalid value types are converted to `null` and returned with a `MISMATCH` stamp.
- Session history lives only in browser memory and is capped at five results.
