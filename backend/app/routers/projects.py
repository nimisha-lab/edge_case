from uuid import UUID
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from geoalchemy2 import Geometry
from geoalchemy2.functions import ST_AsGeoJSON

from app.database.database import get_db
from app.models.models import Project, Department, ProjectStatus
from app.schemas.schemas import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectGeoJSON,
)

router = APIRouter(prefix="/projects", tags=["projects"])


def parse_geojson_location(location_data) -> dict:
    if isinstance(location_data, str):
        import json
        try:
            return json.loads(location_data)
        except json.JSONDecodeError:
            pass
    return location_data


async def project_to_geojson(project: Project, db: AsyncSession) -> ProjectGeoJSON:
    result = await db.execute(
        select(ST_AsGeoJSON(Project.location)).where(Project.id == project.id)
    )
    geojson_str = result.scalar()
    import json
    geometry = json.loads(geojson_str) if geojson_str else None

    properties = {
        "id": str(project.id),
        "department_id": str(project.department_id),
        "title": project.title,
        "project_type": project.project_type.value,
        "estimated_cost": project.estimated_cost,
        "start_date": project.start_date.isoformat(),
        "end_date": project.end_date.isoformat(),
        "status": project.status.value,
        "created_at": project.created_at.isoformat(),
        "department_name": project.department.name if project.department else None,
    }

    return ProjectGeoJSON(geometry=geometry, properties=properties)


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_in: ProjectCreate,
    db: AsyncSession = Depends(get_db),
):
    from geoalchemy2.shape import from_shape
    from shapely.geometry import shape

    location_shape = shape(parse_geojson_location(project_in.location))
    location_wkb = from_shape(location_shape, srid=4326)

    project_data = project_in.model_dump(exclude={"location"})
    project = Project(**project_data, location=location_wkb)

    db.add(project)
    await db.commit()
    await db.refresh(project)

    result = await db.execute(
        select(Project).options(selectinload(Project.department)).where(Project.id == project.id)
    )
    return result.scalar_one()


@router.get("", response_model=List[ProjectGeoJSON])
async def list_projects(
    status: Optional[ProjectStatus] = None,
    department_id: Optional[UUID] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    query = select(Project).options(selectinload(Project.department))

    if status:
        query = query.where(Project.status == status)
    if department_id:
        query = query.where(Project.department_id == department_id)

    query = query.order_by(Project.start_date).offset(skip).limit(limit)
    result = await db.execute(query)
    projects = list(result.scalars().all())

    return [await project_to_geojson(p, db) for p in projects]


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.department), selectinload(Project.clashes_as_a), selectinload(Project.clashes_as_b))
        .where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: UUID,
    project_in: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project).options(selectinload(Project.department)).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    update_data = project_in.model_dump(exclude_unset=True)

    if "location" in update_data:
        from geoalchemy2.shape import from_shape
        from shapely.geometry import shape
        location_shape = shape(parse_geojson_location(update_data.pop("location")))
        project.location = from_shape(location_shape, srid=4326)

    for field, value in update_data.items():
        setattr(project, field, value)

    await db.commit()
    await db.refresh(project)

    result = await db.execute(
        select(Project).options(selectinload(Project.department)).where(Project.id == project.id)
    )
    return result.scalar_one()


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    await db.delete(project)
    await db.commit()