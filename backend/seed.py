import asyncio
import json
from datetime import date, timedelta
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession
from geoalchemy2.shape import from_shape
from shapely.geometry import LineString, Point

from app.database.database import (
    async_session_maker,
    ensure_postgis_extension,
    init_db,
)
from app.models.models import (
    Department,
    Project,
    Complaint,
    PhaseFeedback,
    ProjectType,
    ProjectStatus,
    ComplaintStatus,
)


MG_ROAD_COORDS = [
    [77.5946, 12.9716],
    [77.5956, 12.9720],
    [77.5966, 12.9724],
    [77.5976, 12.9728],
    [77.5986, 12.9732],
]

BRIGADE_ROAD_COORDS = [
    [77.6046, 12.9716],
    [77.6056, 12.9720],
    [77.6066, 12.9724],
    [77.6076, 12.9728],
    [77.6086, 12.9732],
]

RESIDENCY_ROAD_COORDS = [
    [77.5946, 12.9616],
    [77.5956, 12.9620],
    [77.5966, 12.9624],
    [77.5976, 12.9628],
    [77.5986, 12.9632],
]

CHURCH_STREET_COORDS = [
    [77.6046, 12.9616],
    [77.6056, 12.9620],
    [77.6066, 12.9624],
    [77.6076, 12.9628],
    [77.6086, 12.9632],
]

KORAMANGALA_COORDS = [
    [77.6246, 12.9316],
    [77.6256, 12.9320],
    [77.6266, 12.9324],
    [77.6276, 12.9328],
    [77.6286, 12.9332],
]

INDIANAGAR_COORDS = [
    [77.6346, 12.9716],
    [77.6356, 12.9720],
    [77.6366, 12.9724],
    [77.6376, 12.9728],
    [77.6386, 12.9732],
]

JAYANAGAR_COORDS = [
    [77.5846, 12.9216],
    [77.5856, 12.9220],
    [77.5866, 12.9224],
    [77.5876, 12.9228],
    [77.5886, 12.9232],
]

ELECTRONIC_CITY_COORDS = [
    [77.6646, 12.8416],
    [77.6656, 12.8420],
    [77.6666, 12.8424],
    [77.6676, 12.8428],
    [77.6686, 12.8432],
]

WHITEFIELD_COORDS = [
    [77.7446, 12.9616],
    [77.7456, 12.9620],
    [77.7466, 12.9624],
    [77.7476, 12.9628],
    [77.7486, 12.9632],
]

HEBBAL_COORDS = [
    [77.5946, 13.0316],
    [77.5956, 13.0320],
    [77.5966, 13.0324],
    [77.5976, 13.0328],
    [77.5986, 13.0332],
]


async def seed_departments(db: AsyncSession) -> dict[str, Department]:
    departments_data = [
        {
            "name": "Roads & Highways Department",
            "contact_email": "roads@city.gov.in",
        },
        {
            "name": "Water Supply & Sewerage Board",
            "contact_email": "water@city.gov.in",
        },
        {
            "name": "Telecom / Fiber Department",
            "contact_email": "telecom@city.gov.in",
        },
        {
            "name": "Electricity Board",
            "contact_email": "electricity@city.gov.in",
        },
        {
            "name": "Gas Distribution Authority",
            "contact_email": "gas@city.gov.in",
        },
    ]

    departments = {}
    for dept_data in departments_data:
        dept = Department(**dept_data)
        db.add(dept)
        await db.flush()
        departments[dept_data["name"]] = dept

    await db.commit()
    for dept in departments.values():
        await db.refresh(dept)

    return departments


async def seed_projects(db: AsyncSession, departments: dict[str, Department]) -> list[Project]:
    projects_data = [
        {
            "department": "Roads & Highways Department",
            "title": "MG Road Smart Resurfacing",
            "project_type": ProjectType.RESURFACING,
            "estimated_cost": 1_200_000.0,
            "start_date": date(2026, 1, 10),
            "end_date": date(2026, 2, 28),
            "coordinates": MG_ROAD_COORDS,
            "status": ProjectStatus.COMPLETED,
        },
        {
            "department": "Water Supply & Sewerage Board",
            "title": "MG Road Main Water Pipeline Overhaul",
            "project_type": ProjectType.PIPE_LAYING,
            "estimated_cost": 850_000.0,
            "start_date": date(2026, 4, 15),
            "end_date": date(2026, 6, 30),
            "coordinates": MG_ROAD_COORDS,
            "status": ProjectStatus.PLANNED,
        },
        {
            "department": "Telecom / Fiber Department",
            "title": "5G Fiber Duct Laying - MG Road",
            "project_type": ProjectType.CABLING,
            "estimated_cost": 400_000.0,
            "start_date": date(2026, 4, 20),
            "end_date": date(2026, 5, 25),
            "coordinates": MG_ROAD_COORDS,
            "status": ProjectStatus.PLANNED,
        },
        {
            "department": "Roads & Highways Department",
            "title": "Brigade Road Resurfacing Phase 2",
            "project_type": ProjectType.RESURFACING,
            "estimated_cost": 950_000.0,
            "start_date": date(2026, 3, 1),
            "end_date": date(2026, 4, 30),
            "coordinates": BRIGADE_ROAD_COORDS,
            "status": ProjectStatus.IN_PROGRESS,
        },
        {
            "department": "Electricity Board",
            "title": "Brigade Road Underground Cabling",
            "project_type": ProjectType.CABLING,
            "estimated_cost": 600_000.0,
            "start_date": date(2026, 5, 1),
            "end_date": date(2026, 7, 15),
            "coordinates": BRIGADE_ROAD_COORDS,
            "status": ProjectStatus.PLANNED,
        },
        {
            "department": "Water Supply & Sewerage Board",
            "title": "Residency Road Sewer Line Replacement",
            "project_type": ProjectType.PIPE_LAYING,
            "estimated_cost": 720_000.0,
            "start_date": date(2026, 2, 1),
            "end_date": date(2026, 4, 15),
            "coordinates": RESIDENCY_ROAD_COORDS,
            "status": ProjectStatus.IN_PROGRESS,
        },
        {
            "department": "Roads & Highways Department",
            "title": "Residency Road Resurfacing",
            "project_type": ProjectType.RESURFACING,
            "estimated_cost": 880_000.0,
            "start_date": date(2026, 6, 1),
            "end_date": date(2026, 7, 31),
            "coordinates": RESIDENCY_ROAD_COORDS,
            "status": ProjectStatus.PLANNED,
        },
        {
            "department": "Gas Distribution Authority",
            "title": "Church Street Gas Pipeline Installation",
            "project_type": ProjectType.EXCAVATION,
            "estimated_cost": 450_000.0,
            "start_date": date(2026, 3, 15),
            "end_date": date(2026, 5, 30),
            "coordinates": CHURCH_STREET_COORDS,
            "status": ProjectStatus.PLANNED,
        },
        {
            "department": "Telecom / Fiber Department",
            "title": "Koramangala 5G Fiber Rollout",
            "project_type": ProjectType.CABLING,
            "estimated_cost": 1_100_000.0,
            "start_date": date(2026, 1, 15),
            "end_date": date(2026, 4, 30),
            "coordinates": KORAMANGALA_COORDS,
            "status": ProjectStatus.IN_PROGRESS,
        },
        {
            "department": "Electricity Board",
            "title": "Indiranagar Underground Power Lines",
            "project_type": ProjectType.CABLING,
            "estimated_cost": 1_350_000.0,
            "start_date": date(2026, 2, 1),
            "end_date": date(2026, 6, 30),
            "coordinates": INDIANAGAR_COORDS,
            "status": ProjectStatus.PLANNED,
        },
    ]

    projects = []
    for proj_data in projects_data:
        dept = departments[proj_data.pop("department")]
        coords = proj_data.pop("coordinates")
        line = LineString(coords)
        location_wkb = from_shape(line, srid=4326)

        project = Project(
            department_id=dept.id,
            location=location_wkb,
            **proj_data,
        )
        db.add(project)
        await db.flush()
        projects.append(project)

    await db.commit()
    for p in projects:
        await db.refresh(p)

    return projects


async def seed_complaints(db: AsyncSession, projects: list[Project]):
    complaints_data = [
        {
            "project": projects[0],
            "title": "Dust and noise during MG Road resurfacing",
            "description": "Excessive dust and noise pollution during daytime work hours affecting nearby residents and businesses.",
            "coordinates": [77.5960, 12.9720],
            "status": ComplaintStatus.RESOLVED,
        },
        {
            "project": projects[1],
            "title": "Water supply disruption during pipeline work",
            "description": "No water for 3 days during pipeline overhaul. No prior notice given to residents.",
            "coordinates": [77.5970, 12.9725],
            "status": ComplaintStatus.UNDER_REVIEW,
        },
        {
            "project": projects[3],
            "title": "Traffic congestion on Brigade Road",
            "description": "Severe traffic jams due to single-lane closure during resurfacing. Need better traffic management.",
            "coordinates": [77.6060, 12.9720],
            "status": ComplaintStatus.REPORTED,
        },
        {
            "project": None,
            "title": "Potholes on Koramangala 80ft Road",
            "description": "Multiple large potholes causing vehicle damage and accidents. Urgent repair needed.",
            "coordinates": [77.6260, 12.9320],
            "status": ComplaintStatus.REPORTED,
        },
        {
            "project": projects[5],
            "title": "Sewage smell during pipe replacement",
            "description": "Strong sewage odor in the area during excavation work. Health concern for residents.",
            "coordinates": [77.5965, 12.9620],
            "status": ComplaintStatus.UNDER_REVIEW,
        },
    ]

    for comp_data in complaints_data:
        project = comp_data.pop("project")
        coords = comp_data.pop("coordinates")
        point = Point(coords)
        location_wkb = from_shape(point, srid=4326)

        complaint = Complaint(
            project_id=project.id if project else None,
            location=location_wkb,
            upvotes_count=0,
            **comp_data,
        )
        db.add(complaint)

    await db.commit()


async def seed_feedback(db: AsyncSession, projects: list[Project]):
    feedback_data = [
        {
            "project": projects[0],
            "phase_name": "Planning",
            "rating": 4,
            "comments": "Good planning but timeline was aggressive.",
        },
        {
            "project": projects[0],
            "phase_name": "Execution",
            "rating": 3,
            "comments": "Work quality good but caused significant disruption.",
        },
        {
            "project": projects[0],
            "phase_name": "Completion",
            "rating": 5,
            "comments": "Road surface is excellent now. Smooth driving experience.",
        },
        {
            "project": projects[3],
            "phase_name": "Planning",
            "rating": 4,
            "comments": "Well coordinated with traffic police.",
        },
        {
            "project": projects[3],
            "phase_name": "Execution",
            "rating": 2,
            "comments": "Delays due to weather. Communication could be better.",
        },
        {
            "project": projects[5],
            "phase_name": "Planning",
            "rating": 3,
            "comments": "Standard planning process.",
        },
        {
            "project": projects[5],
            "phase_name": "Execution",
            "rating": 4,
            "comments": "Work progressing well. Minimal disruption so far.",
        },
        {
            "project": projects[8],
            "phase_name": "Planning",
            "rating": 5,
            "comments": "Excellent community consultation done.",
        },
        {
            "project": projects[8],
            "phase_name": "Execution",
            "rating": 4,
            "comments": "Good progress. Fiber quality is high.",
        },
    ]

    for fb_data in feedback_data:
        project = fb_data.pop("project")
        feedback = PhaseFeedback(
            project_id=project.id,
            **fb_data,
        )
        db.add(feedback)

    await db.commit()


async def main():
    print("Initializing database...")

    # Enable PostGIS before creating tables. Wrapped so pre-provisioned managed
    # databases (Neon/Supabase) that already have the extension are fine.
    try:
        await ensure_postgis_extension()
        print("PostGIS extension enabled (or already present).")
    except Exception as exc:
        print(f"WARNING: could not enable PostGIS extension: {exc}")

    await init_db()

    async with async_session_maker() as db:
        print("Seeding departments...")
        departments = await seed_departments(db)
        print(f"Created {len(departments)} departments")

        print("Seeding projects...")
        projects = await seed_projects(db, departments)
        print(f"Created {len(projects)} projects")

        print("Seeding complaints...")
        await seed_complaints(db, projects)
        print(f"Created 5 complaints")

        print("Seeding phase feedback...")
        await seed_feedback(db, projects)
        print(f"Created 9 feedback entries")

    print("\n✅ Seed completed successfully!")
    print(f"Departments: {len(departments)}")
    print(f"Projects: {len(projects)}")
    print(f"Complaints: 5")
    print(f"Feedback: 9")


if __name__ == "__main__":
    asyncio.run(main())