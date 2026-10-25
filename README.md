# Wayfarer — Personalized Travel Itinerary Planner

A small college project for planning personalized trips. React + Vite collects trip preferences, FastAPI generates a day-by-day itinerary with Gemini or a clearly labelled fallback, and Supabase stores trips for signed-in users.

## Features

- Destination, dates, budget/currency, interests, travel style and group size form.
- Day-by-day activities, food, transport and accommodation ideas with approximate cost estimates.
- Edit a day or regenerate it independently; regenerate the whole plan.
- Gemini generation on the backend; deterministic fallback suggestions when Gemini is missing or unavailable.
- Optional Supabase email/password accounts and private saved-trip CRUD protected by row-level security (RLS).
- Responsive interface, input validation, loading and error messages.

Costs and suggestions are planning estimates, not live prices, schedules, bookings or verified local recommendations.

## Requirements

- Windows 10/11, Git, Node.js 20+, npm, Python 3.10+ and pip.
- A Supabase project for accounts and saved trips (optional for itinerary generation).
- A Gemini API key for AI generation (optional; fallback works without it).

## Windows setup

Open PowerShell in the project directory.

1. Create local settings from the placeholder template:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Edit `.env` locally. Set the same Supabase project URL and **publishable/anon key** in `SUPABASE_URL`, `SUPABASE_KEY`, `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Add `GEMINI_API_KEY` to enable Gemini. Never use a service-role key here. `.env` is ignored by Git.

3. For saved trips, open the existing Supabase project dashboard, go to **SQL Editor**, paste and run [`supabase/schema.sql`](supabase/schema.sql). In **Authentication → Providers → Email**, enable email/password. For a classroom demo, Supabase email confirmation can remain enabled; sign up and confirm the account before signing in. The table permits authenticated users to access only rows whose `user_id` matches their account. Do not disable RLS or grant access to `anon`.

4. Install and start the backend in PowerShell window 1:

   ```powershell
   py -m venv backend\.venv
   .\backend\.venv\Scripts\Activate.ps1
   py -m pip install -r backend\requirements.txt
   uvicorn app.main:app --app-dir backend --reload
   ```

5. Install and start the frontend in PowerShell window 2:

   ```powershell
   npm install
   npm run dev
   ```

   Open the Vite URL printed in the terminal (normally `http://localhost:5173`). The API health endpoint is `http://localhost:8000/api/health`.

If PowerShell blocks venv activation, run the environment's Python directly instead: `backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt` and `backend\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --reload`.

## Configuration reference

| Variable | Used by | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | Backend only | Gemini API credential. Never prefix with `VITE_`. |
| `GEMINI_MODEL` | Backend only | Gemini model name (default `gemini-2.0-flash`). |
| `SUPABASE_URL` | Backend | Project URL for REST requests. |
| `SUPABASE_KEY` | Backend | Supabase publishable/anon key; user access token and RLS enforce ownership. |
| `FRONTEND_ORIGIN` | Backend | Allowed browser origin, defaults to the Vite dev URL. |
| `VITE_SUPABASE_URL` | Frontend | Supabase project URL for client-side email/password sign-in. |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Public publishable/anon key. Safe only with the supplied RLS schema enabled. |
| `VITE_API_URL` | Frontend | FastAPI origin, defaults to `http://localhost:8000`. |

Vite variables are public in the built frontend. Only the Supabase publishable/anon key belongs there; never place Gemini or Supabase service-role/secret keys in a `VITE_` variable.

## Gemini and fallback

The backend sends trip details to the configured Gemini model. If no key is set or the request/response fails validation, the API returns a labelled `fallback` plan with general, budget-based suggestions. The UI displays this label and reminds you to verify details. Gemini free-tier availability, quotas and model names can change; consult Google AI Studio and its current terms. Do not treat generated content as current travel information.

## Tests and build

Run backend tests from the repository root:

```powershell
py -m pip install -r backend\requirements.txt
py -m pytest backend\tests -q
```

Run the frontend production build:

```powershell
npm install
npm run build
```

Manual API smoke check after starting the backend:

```powershell
Invoke-RestMethod http://localhost:8000/api/health
```

Supabase persistence requires a configured project, the SQL schema and a confirmed signed-in account. Gemini generation requires a valid local API key. Neither external integration is required to use the fallback itinerary flow.

## Project layout

```text
backend/app/main.py       FastAPI API, validation, Gemini fallback and Supabase REST CRUD
backend/tests/            Lightweight API tests
src/                      React application and responsive styles
supabase/schema.sql       Private saved-trip table and owner-only RLS policies
.env.example              Placeholder configuration only
```

## Limitations

- No bookings, live maps, location tracking or live pricing.
- Suggested venues and transport are illustrative; verify local details yourself.
- Saved trips require Supabase setup and an authenticated user.
- Email confirmation behavior depends on the Supabase project's authentication settings.
