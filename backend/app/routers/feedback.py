from uuid import UUID
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.database import get_db
from app.models.models import PhaseFeedback, Project
from app.schemas.schemas import (
    PhaseFeedbackCreate,
    PhaseFeedbackResponse,
)

router = APIRouter(prefix="/projects", tags=["feedback"])


@router.post("/{project_id}/feedback", response_model=PhaseFeedbackResponse, status_code=status.HTTP_201_CREATED)
async def create_feedback(
    project_id: UUID,
    feedback_in: PhaseFeedbackCreate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if feedback_in.project_id != project_id:
        raise HTTPException(status_code=400, detail="Project ID mismatch")

    feedback = PhaseFeedback(**feedback_in.model_dump())
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)
    return feedback


@router.get("/{project_id}/feedback", response_model=List[PhaseFeedbackResponse])
async def list_feedback(
    project_id: UUID,
    phase_name: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    query = select(PhaseFeedback).where(PhaseFeedback.project_id == project_id)

    if phase_name:
        query = query.where(PhaseFeedback.phase_name == phase_name)

    query = query.order_by(PhaseFeedback.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())