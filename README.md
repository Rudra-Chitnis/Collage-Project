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
   python -m venv backend\.venv
   .\backend\.venv\Scripts\Activate.ps1
   python -m pip install -r backend\requirements.txt
   uvicorn app.main:app --app-dir backend --reload
   ```

5. Install and start the frontend in PowerShell window 2:

   ```powershell
   npm install
   npm run dev
   ```

   Open the Vite URL printed in the terminal (normally `http://localhost:5173`). The API health endpoint is `http://127.0.0.1:8005/api/health`.

If PowerShell blocks venv activation, run the environment's Python directly instead: `backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt` and `backend\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --reload`.

## Public demo deployment (Vercel + Render)

The repository includes [`vercel.json`](vercel.json) for the root Vite app and [`render.yaml`](render.yaml) for the FastAPI service in `backend/`. These files prepare the project for deployment; they do not deploy it or configure hosting accounts by themselves. No local `.env` or credential file is needed by either build.

1. **Deploy the backend on Render.** Sign in to Render, choose **New → Blueprint**, connect `Rudra-Chitnis/Collage-Project`, and apply the `render.yaml` blueprint. Keep the `wayfarer-api` service on the Free plan. Enter `GEMINI_API_KEY` (optional; the fallback works without it), `SUPABASE_URL`, `SUPABASE_KEY` (the publishable/anon key, never a service-role key), and a temporary `FRONTEND_ORIGIN` value if prompted. Do not enter the Supabase database password. Wait until the deploy is live, then verify `https://<render-service>.onrender.com/api/health` returns HTTP 200.

2. **Deploy the frontend on Vercel.** Import the same GitHub repository as a Vite project. Set the root directory to `.` and use the `vercel.json` build settings. In the Vercel project's Production environment variables, set `VITE_API_URL` to the Render service origin (for example, `https://wayfarer-api.onrender.com`, without `/api`), and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the existing project's URL and publishable/anon key. Never add Gemini or a Supabase service-role key to a `VITE_` variable. Deploy and copy the resulting production domain.

3. **Finish exact-origin configuration.** In Render, set `FRONTEND_ORIGIN` to the exact Vercel production origin, such as `https://wayfarer.vercel.app` (no trailing slash), then redeploy the backend. The API allows that configured origin and the two explicit localhost development origins; it does not use a wildcard. In the existing Supabase project, open **Authentication → URL Configuration** and set **Site URL** to the exact Vercel production URL. Add that same URL to **Redirect URLs**. Keep the existing saved-trip table and owner-only RLS policies enabled.

4. **Verify the public workflow.** Open the Vercel URL over HTTPS, call the Render `/api/health` endpoint, create an itinerary, and check that its source is Gemini or the labelled fallback. Sign in with a confirmed Supabase account to test save, reload, update, and delete. Confirm day editing and regeneration. A Render Free service can sleep after inactivity, so its first request may take about a minute; do not upgrade to a paid plan for this project. See [Render's free-service limits](https://render.com/docs/free).

The hosting accounts must be authorized in their official dashboards before either service can be created. The actual public URLs are assigned by those platforms during deployment and cannot be known from the repository alone.

## Configuration reference

| Variable | Used by | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | Backend only | Gemini API credential. Never prefix with `VITE_`. |
| `GEMINI_MODEL` | Backend only | Gemini model name (default `gemini-3.6-flash`). |
| `SUPABASE_URL` | Backend | Project URL for REST requests. |
| `SUPABASE_KEY` | Backend | Supabase publishable/anon key; user access token and RLS enforce ownership. |
| `FRONTEND_ORIGIN` | Backend | Allowed browser origin, defaults to the Vite dev URL. |
| `VITE_SUPABASE_URL` | Frontend | Supabase project URL for client-side email/password sign-in. |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Public publishable/anon key. Safe only with the supplied RLS schema enabled. |
| `VITE_API_URL` | Frontend | FastAPI origin, defaults to `http://127.0.0.1:8005`. |

Vite variables are public in the built frontend. Only the Supabase publishable/anon key belongs there; never place Gemini or Supabase service-role/secret keys in a `VITE_` variable.

## Gemini and fallback

The backend sends trip details to the configured Gemini model. If no key is set or the request/response fails validation, the API returns a labelled `fallback` plan with general, budget-based suggestions. The UI displays this label and reminds you to verify details. Gemini free-tier availability, quotas and model names can change; consult Google AI Studio and its current terms. Do not treat generated content as current travel information.

## Tests and build

Run backend tests from the repository root:

```powershell
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
backend\.venv\Scripts\python.exe -m pytest backend\tests -q
```

Run the frontend production build:

```powershell
npm install
npm run build
```

Manual API smoke check after starting the backend:

```powershell
Invoke-RestMethod http://127.0.0.1:8005/api/health
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
