from uuid import UUID
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from geoalchemy2 import Geography
from geoalchemy2.functions import ST_AsGeoJSON

from app.database.database import get_db
from app.models.models import Complaint, Upvote, Project, ComplaintStatus
from app.schemas.schemas import (
    ComplaintCreate,
    ComplaintResponse,
    UpvoteCreate,
    UpvoteResponse,
)

router = APIRouter(prefix="/complaints", tags=["complaints"])


async def complaint_to_response(complaint: Complaint, db: AsyncSession) -> ComplaintResponse:
    result = await db.execute(
        select(ST_AsGeoJSON(Complaint.location)).where(Complaint.id == complaint.id)
    )
    geojson_str = result.scalar()
    import json
    location = json.loads(geojson_str) if geojson_str else None

    project = None
    if complaint.project:
        project = complaint.project

    return ComplaintResponse(
        id=complaint.id,
        project_id=complaint.project_id,
        title=complaint.title,
        description=complaint.description,
        location=location,
        upvotes_count=complaint.upvotes_count,
        status=complaint.status,
        created_at=complaint.created_at,
        project=project,
    )


@router.post("", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
async def create_complaint(
    complaint_in: ComplaintCreate,
    db: AsyncSession = Depends(get_db),
):
    from geoalchemy2.shape import from_shape
    from shapely.geometry import shape
    import json

    if complaint_in.project_id:
        result = await db.execute(
            select(Project).where(Project.id == complaint_in.project_id)
        )
        project = result.scalar_one_or_none()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

    location_data = complaint_in.location
    if isinstance(location_data, str):
        location_data = json.loads(location_data)
    location_shape = shape(location_data)
    location_wkb = from_shape(location_shape, srid=4326)

    complaint_data = complaint_in.model_dump(exclude={"location"})
    complaint = Complaint(**complaint_data, location=location_wkb)

    db.add(complaint)
    await db.commit()
    await db.refresh(complaint)

    return await complaint_to_response(complaint, db)


@router.get("", response_model=List[ComplaintResponse])
async def list_complaints(
    status: Optional[ComplaintStatus] = None,
    project_id: Optional[UUID] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    query = select(Complaint).options(selectinload(Complaint.project))

    if status:
        query = query.where(Complaint.status == status)
    if project_id:
        query = query.where(Complaint.project_id == project_id)

    query = query.order_by(Complaint.upvotes_count.desc(), Complaint.created_at.desc())
    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    complaints = list(result.scalars().all())

    return [await complaint_to_response(c, db) for c in complaints]


@router.get("/{complaint_id}", response_model=ComplaintResponse)
async def get_complaint(
    complaint_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Complaint).options(selectinload(Complaint.project)).where(Complaint.id == complaint_id)
    )
    complaint = result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return await complaint_to_response(complaint, db)


@router.post("/{complaint_id}/upvote", response_model=UpvoteResponse, status_code=status.HTTP_201_CREATED)
async def upvote_complaint(
    complaint_id: UUID,
    upvote_in: UpvoteCreate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Complaint).where(Complaint.id == complaint_id)
    )
    complaint = result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    existing = await db.execute(
        select(Upvote).where(
            Upvote.complaint_id == complaint_id,
            Upvote.user_fingerprint == upvote_in.user_fingerprint,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already upvoted")

    upvote = Upvote(
        complaint_id=complaint_id,
        user_fingerprint=upvote_in.user_fingerprint,
    )
    db.add(upvote)

    complaint.upvotes_count += 1
    await db.commit()
    await db.refresh(upvote)

    return upvote


@router.delete("/{complaint_id}/upvote", status_code=status.HTTP_204_NO_CONTENT)
async def remove_upvote(
    complaint_id: UUID,
    user_fingerprint: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Upvote).where(
            Upvote.complaint_id == complaint_id,
            Upvote.user_fingerprint == user_fingerprint,
        )
    )
    upvote = result.scalar_one_or_none()
    if not upvote:
        raise HTTPException(status_code=404, detail="Upvote not found")

    result = await db.execute(
        select(Complaint).where(Complaint.id == complaint_id)
    )
    complaint = result.scalar_one_or_none()
    if complaint:
        complaint.upvotes_count = max(0, complaint.upvotes_count - 1)

    await db.delete(upvote)
    await db.commit()