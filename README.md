# Civic Infrastructure Coordination Engine

A full-stack platform that helps city departments coordinate road, water,
telecom, power and gas works. It detects spatio-temporal clashes between
projects (e.g. a utility digging up a road that was just resurfaced), proposes
joint tenders to save taxpayer money, and gives citizens a transparency portal
with complaint upvoting and per-phase feedback.

- **Frontend:** React + Vite + Tailwind CSS (`src/`)
- **Backend:** FastAPI + SQLAlchemy 2.0 (async) + PostGIS (`backend/`)
- **Database:** PostgreSQL 15 with PostGIS (local, Docker or hosted)

> Doing a GitHub evaluation? You can run everything **without Docker** by
> pointing at a free hosted PostGIS database (Neon, Supabase, ...), or use the
> one-command Docker Compose setup. Both paths are below.

---

## Quickstart (Cloud DB & Local Python Virtualenv)

Requirements: Python 3.11+ and a PostgreSQL database **with the PostGIS
extension** (free tiers: [Neon](https://neon.tech), [Supabase](https://supabase.com)).

Run **three commands** from the `backend/` folder:

```bash
# 1. Create a virtualenv and install the pinned dependencies
python -m venv .venv && .venv\Scripts\activate && pip install -r requirements.txt   # Windows
python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt   # macOS / Linux

# 2. Point the app at your database (paste your own DATABASE_URL into .env)
cp .env.example .env

# 3. Create tables + seed demo data, then start the API
python seed.py && uvicorn app.main:app --reload
```

Open **http://localhost:8000/docs** for the interactive API.

`postgres://` and `postgresql://` connection strings are auto-converted to
`postgresql+asyncpg://`, and an `sslmode=require` query parameter (as handed out
by Neon/Supabase/Render/Railway) is applied to the async driver automatically.
The `.env.example` file documents both the hosted and local-host variants.

### Frontend (optional, same repo)

```bash
npm install
npm run dev   # http://localhost:5173
```

---

## Containerized Run (Docker Compose)

Requirements: Docker Desktop / Docker Engine with the Compose plugin. No local
Python or PostgreSQL installation is needed.

```bash
docker compose up --build
```

This starts:

- **`postgres`** — `postgis/postgis:15` on port `5432` (schema auto-created)
- **`api`** — FastAPI on port `8000` (waits for the DB healthcheck)

Once both containers are healthy, load the demo data (one command):

```bash
docker compose exec api python seed.py
```

Then browse **http://localhost:8000/docs**.

Useful commands:

```bash
docker compose logs -f api     # tail API logs
docker compose down            # stop containers
docker compose down -v         # stop and wipe the database volume
```

---

## Project Structure

```
.
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── core/config.py   # settings + DATABASE_URL normalisation
│   │   ├── database/        # async engine, session, PostGIS bootstrap
│   │   ├── models/          # SQLAlchemy models (geometry columns)
│   │   ├── routers/         # projects, clashes, complaints, feedback, depts
│   │   └── services/        # clash detection + joint-tender optimisation
│   ├── alembic/             # async migrations
│   ├── seed.py              # demo data seeder
│   ├── requirements.txt     # pinned, Python 3.11-3.13 compatible
│   └── Dockerfile
├── docker-compose.yml       # PostGIS + API
└── src/                     # React citizen portal
```

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and set:

| Variable       | Default                                                       | Description                                                                 |
| -------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `DATABASE_URL` | `postgresql+asyncpg://postgres:postgres@localhost:5432/civic_db` | PostGIS connection string. `postgres://` / `postgresql://` are accepted too. |
| `DB_SSL_MODE`  | inferred from `?sslmode=...`                                  | Optional explicit SSL mode (`require`, `verify-full`, ...).                  |
| `DEBUG`        | `true`                                                        | SQL echo + reload-friendly behaviour.                                        |

## API Overview

- `GET /api/v1/clashes/detect` — run real-time spatial clash detection
- `GET /api/v1/clashes/optimization/joint-tenders` — joint tender + savings
- `GET /api/v1/projects` — projects as GeoJSON
- `POST /api/v1/complaints` — citizen complaint with coordinates
- Full list in [`backend/README.md`](backend/README.md)

## License

MIT
