from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.database import get_db
from app.models.models import Clash, Project, Department
from app.schemas.schemas import (
    ClashDetectionResponse,
    ClashResponse,
    OptimizationResponse,
)
from app.services.clash_detector import ClashDetectorService
from app.services.optimization import OptimizationService

router = APIRouter(prefix="/clashes", tags=["clashes"])


@router.get("/detect", response_model=ClashDetectionResponse)
async def detect_clashes(db: AsyncSession = Depends(get_db)):
    service = ClashDetectorService(db)
    result = await service.detect_all_clashes()
    return result


@router.get("", response_model=List[ClashResponse])
async def list_clashes(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Clash)
        .options(
            selectinload(Clash.project_a).selectinload(Project.department),
            selectinload(Clash.project_b).selectinload(Project.department),
        )
        .offset(skip)
        .limit(limit)
        .order_by(Clash.created_at.desc())
    )
    return list(result.scalars().all())


@router.get("/optimization/joint-tenders", response_model=OptimizationResponse)
async def get_joint_tender_recommendations(db: AsyncSession = Depends(get_db)):
    service = OptimizationService(db)
    result = await service.get_joint_tender_recommendations()
    return result