from datetime import date, timedelta
from typing import List, Tuple, Optional
from uuid import UUID
from sqlalchemy import select, and_, or_, func, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from geoalchemy2 import Geography, Geometry
from geoalchemy2.functions import ST_DWithin, ST_Distance

from app.models.models import (
    Project,
    Clash,
    ProjectType,
    ProjectStatus,
    ClashType,
    Department,
)
from app.schemas.schemas import ClashDetectionResponse, ClashResponse, ClashCreate


PROXIMITY_THRESHOLD_METERS = 200
TEMPORAL_THRESHOLD_DAYS = 180

EXCAVATION_TYPES = {
    ProjectType.EXCAVATION,
    ProjectType.PIPE_LAYING,
    ProjectType.CABLING,
}


class ClashDetectorService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def detect_all_clashes(self) -> ClashDetectionResponse:
        await self.clear_existing_clashes()

        projects = await self.get_active_projects()
        clashes = []
        warnings = []

        for i, project_a in enumerate(projects):
            for project_b in projects[i + 1 :]:
                clash_results = await self.check_project_pair(project_a, project_b)
                for clash_data in clash_results:
                    clash = await self.create_clash(clash_data)
                    clashes.append(clash)
                    warning = self.generate_warning(project_a, project_b, clash_data)
                    if warning:
                        warnings.append(warning)

        return ClashDetectionResponse(
            clashes_detected=len(clashes),
            clashes=[ClashResponse.model_validate(c) for c in clashes],
            warnings=warnings,
        )

    async def clear_existing_clashes(self):
        await self.db.execute(text("DELETE FROM clashes"))
        await self.db.commit()

    async def get_active_projects(self) -> List[Project]:
        result = await self.db.execute(
            select(Project)
            .options(
                selectinload(Project.department),
            )
            .where(Project.status != ProjectStatus.COMPLETED)
            .order_by(Project.start_date)
        )
        return list(result.scalars().all())

    async def check_project_pair(
        self, project_a: Project, project_b: Project
    ) -> List[dict]:
        results = []

        if project_a.department_id == project_b.department_id:
            return results

        proximity_clash = await self.check_spatial_proximity(project_a, project_b)
        if proximity_clash:
            results.append(proximity_clash)

        temporal_clash = await self.check_temporal_overlap(project_a, project_b)
        if temporal_clash:
            results.append(temporal_clash)

        return results

    async def check_spatial_proximity(
        self, project_a: Project, project_b: Project
    ) -> Optional[dict]:
        query = select(
            ST_Distance(
                Project.location.cast(Geography),
                Project.location.cast(Geography),
            ).label("distance")
        ).where(
            and_(
                Project.id == project_a.id,
                ST_DWithin(
                    Project.location.cast(Geography),
                    project_b.location.cast(Geography),
                    PROXIMITY_THRESHOLD_METERS,
                ),
            )
        )

        result = await self.db.execute(query)
        distance = result.scalar()

        if distance is not None and distance <= PROXIMITY_THRESHOLD_METERS:
            return {
                "project_a_id": project_a.id,
                "project_b_id": project_b.id,
                "clash_type": ClashType.SPATIAL_PROXIMITY_OVERLAP,
                "distance_meters": float(distance),
                "description": (
                    f"Projects '{project_a.title}' ({project_a.department.name}) "
                    f"and '{project_b.title}' ({project_b.department.name}) "
                    f"are within {distance:.0f} meters of each other."
                ),
            }
        return None

    async def check_temporal_overlap(
        self, project_a: Project, project_b: Project
    ) -> Optional[dict]:
        is_a_resurfacing = project_a.project_type == ProjectType.RESURFACING
        is_b_resurfacing = project_b.project_type == ProjectType.RESURFACING
        is_a_excavation = project_a.project_type in EXCAVATION_TYPES
        is_b_excavation = project_b.project_type in EXCAVATION_TYPES

        if not ((is_a_resurfacing and is_b_excavation) or (is_b_resurfacing and is_a_excavation)):
            return None

        if is_a_resurfacing and is_b_excavation:
            resurfacing_project = project_a
            excavation_project = project_b
        else:
            resurfacing_project = project_b
            excavation_project = project_a

        proximity_check = await self.check_spatial_proximity(
            resurfacing_project, excavation_project
        )
        if not proximity_check:
            return None

        resurface_end = resurfacing_project.end_date
        excavation_start = excavation_project.start_date

        days_after_completion = (excavation_start - resurface_end).days

        if 0 <= days_after_completion <= TEMPORAL_THRESHOLD_DAYS:
            return {
                "project_a_id": resurfacing_project.id,
                "project_b_id": excavation_project.id,
                "clash_type": ClashType.RESURFACING_EXCAVATION_OVERLAP,
                "distance_meters": proximity_check["distance_meters"],
                "description": (
                    f"Conflict: {excavation_project.department.name} plans "
                    f"{excavation_project.project_type.value} on newly resurfaced road from "
                    f"{resurfacing_project.department.name} within {days_after_completion} days "
                    f"of completion (resurfacing ended {resurface_end}, excavation starts {excavation_start})."
                ),
            }

        return None

    async def create_clash(self, clash_data: dict) -> Clash:
        clash = Clash(**clash_data)
        self.db.add(clash)
        await self.db.flush()
        await self.db.refresh(clash)
        return clash

    def generate_warning(
        self, project_a: Project, project_b: Project, clash_data: dict
    ) -> Optional[str]:
        if clash_data["clash_type"] == ClashType.RESURFACING_EXCAVATION_OVERLAP:
            resurfacing = project_a if project_a.project_type == ProjectType.RESURFACING else project_b
            excavation = project_b if project_a.project_type == ProjectType.RESURFACING else project_a

            days_after = (excavation.start_date - resurfacing.end_date).days
            return (
                f"WARNING: {excavation.department.name} plans "
                f"{excavation.project_type.value} ('{excavation.title}') "
                f"on newly resurfaced road from {resurfacing.department.name} "
                f"('{resurfacing.title}') within {days_after} days of completion."
            )
        return None

    async def calculate_potential_savings(self, project_a: Project, project_b: Project) -> float:
        shared_cost = max(project_a.estimated_cost, project_b.estimated_cost) * 0.65
        savings = (project_a.estimated_cost + project_b.estimated_cost) - shared_cost
        return max(0.0, savings)