# Civic Infrastructure Coordination Engine - Backend

High-performance backend API for civic infrastructure coordination with spatio-temporal clash detection and joint work optimization.

## Tech Stack

- Python 3.11+
- FastAPI + Uvicorn
- PostgreSQL with PostGIS
- SQLAlchemy 2.0 (Async) + GeoAlchemy2
- Pydantic v2

## Quick Start

### Using Docker Compose (Recommended)

```bash
# From project root
docker-compose up --build
```

This starts:
- PostgreSQL with PostGIS on port 5432
- FastAPI backend on port 8000

API docs available at: http://localhost:8000/docs

### Manual Setup (no Docker required)

Works against any PostgreSQL/PostGIS instance, including free hosted providers
such as Neon or Supabase.

1. Install dependencies:
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate   |  macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
```

2. Copy `.env.example` to `.env` and set `DATABASE_URL` (a hosted PostGIS URL
   such as `postgresql+asyncpg://user:password@host/db?sslmode=require`). The
   `postgres://` / `postgresql://` schemes are converted automatically.

3. Create the tables, enable PostGIS and seed demo data in one step:
```bash
python seed.py
```
`seed.py` runs `CREATE EXTENSION IF NOT EXISTS postgis;` (wrapped so managed
databases that already have PostGIS are unaffected) before creating tables.

4. Start the server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### Projects
- `POST /api/v1/projects` - Create project (accepts GeoJSON coordinates)
- `GET /api/v1/projects` - List all projects as GeoJSON
- `GET /api/v1/projects/{id}` - Get project details with clashes
- `PUT /api/v1/projects/{id}` - Update project
- `DELETE /api/v1/projects/{id}` - Delete project

### Clashes & Optimization
- `GET /api/v1/clashes/detect` - Run real-time collision detection
- `GET /api/v1/clashes` - List all detected clashes
- `GET /api/v1/clashes/optimization/joint-tenders` - Get joint tender recommendations with taxpayer savings

### Complaints & Public Participation
- `POST /api/v1/complaints` - File citizen complaint with coordinates
- `GET /api/v1/complaints` - List complaints sorted by upvotes
- `POST /api/v1/complaints/{id}/upvote` - Upvote complaint (one per user fingerprint)
- `DELETE /api/v1/complaints/{id}/upvote` - Remove upvote

### Feedback
- `POST /api/v1/projects/{id}/feedback` - Submit phase rating (1-5) and comments
- `GET /api/v1/projects/{id}/feedback` - List feedback for project

### Departments
- `POST /api/v1/departments` - Create department
- `GET /api/v1/departments` - List departments
- `GET /api/v1/departments/{id}` - Get department
- `PUT /api/v1/departments/{id}` - Update department
- `DELETE /api/v1/departments/{id}` - Delete department

## Core Algorithms

### Spatio-Temporal Clash Detection
1. **Proximity Check**: `ST_DWithin(project_a.location::geography, project_b.location::geography, 200)` - detects projects within 200m
2. **Temporal Overlap**: Detects excavation within 180 days after road resurfacing in same zone
3. **Warnings**: Generates explicit alerts: "Conflict: {Dept B} plans digging on newly resurfaced road from {Dept A} within {N} days"

### Joint Work Optimization
- **Shared Trenching Cost**: `max(Cost_A, Cost_B) * 0.65`
- **Estimated Savings**: `(Cost_A + Cost_B) - Shared_Trenching_Cost`
- Aggregates total taxpayer savings across all synchronized tenders

## Demo Data

Run `python seed.py` to populate:
- 5 Departments (Roads, Water, Telecom, Electricity, Gas)
- 10 Projects with pre-configured clashes
- 5 Citizen complaints
- 9 Phase feedback entries

Key clash scenarios:
1. MG Road Resurfacing (Jan-Feb 2026) → Water Pipeline (Apr-Jun 2026) → **60-day clash**
2. MG Road Water Pipeline ↔ 5G Fiber (same zone, overlapping dates) → **Joint trenching candidate**
3. Brigade Road Resurfacing (Mar-Apr 2026) → Underground Cabling (May-Jul 2026) → **30-day clash**

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| DATABASE_URL | postgresql+asyncpg://postgres:postgres@localhost:5432/civic_db | Database connection string |
| DEBUG | true | Enable debug mode |

## License

MIT