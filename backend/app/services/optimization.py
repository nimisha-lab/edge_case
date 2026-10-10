from datetime import date, timedelta
from typing import List, Optional, Tuple
from uuid import UUID
from sqlalchemy import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from geoalchemy2 import Geography
from geoalchemy2.functions import ST_DWithin, ST_Distance

from app.models.models import (
    Project,
    Department,
    ProjectType,
    ProjectStatus,
)
from app.schemas.schemas import (
    JointTenderRecommendation,
    OptimizationResponse,
    ProjectResponse,
)


PROXIMITY_THRESHOLD_METERS = 200
TIME_WINDOW_DAYS = 60

EXCAVATION_TYPES = {
    ProjectType.EXCAVATION,
    ProjectType.PIPE_LAYING,
    ProjectType.CABLING,
}

RESURFACING_TYPE = ProjectType.RESURFACING


class OptimizationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_joint_tender_recommendations(self) -> OptimizationResponse:
        projects = await self.get_active_projects()
        recommendations = []
        processed_pairs = set()

        for i, project_a in enumerate(projects):
            for project_b in projects[i + 1 :]:
                pair_key = tuple(sorted([str(project_a.id), str(project_b.id)]))
                if pair_key in processed_pairs:
                    continue
                processed_pairs.add(pair_key)

                recommendation = await self.analyze_pair_for_joint_tender(
                    project_a, project_b
                )
                if recommendation:
                    recommendations.append(recommendation)

        total_savings = sum(r.estimated_savings for r in recommendations)

        return OptimizationResponse(
            recommendations=recommendations,
            total_taxpayer_savings=total_savings,
            total_projects_analyzed=len(projects),
        )

    async def get_active_projects(self) -> List[Project]:
        result = await self.db.execute(
            select(Project)
            .options(selectinload(Project.department))
            .where(Project.status.in_([ProjectStatus.PLANNED, ProjectStatus.IN_PROGRESS]))
            .order_by(Project.start_date)
        )
        return list(result.scalars().all())

    async def analyze_pair_for_joint_tender(
        self, project_a: Project, project_b: Project
    ) -> Optional[JointTenderRecommendation]:
        if project_a.department_id == project_b.department_id:
            return None

        distance = await self.get_spatial_distance(project_a, project_b)
        if distance is None or distance > PROXIMITY_THRESHOLD_METERS:
            return None

        time_overlap = self.calculate_time_overlap(project_a, project_b)
        if time_overlap < 0:
            return None

        is_excavation_a = project_a.project_type in EXCAVATION_TYPES
        is_excavation_b = project_b.project_type in EXCAVATION_TYPES
        is_resurfacing_a = project_a.project_type == RESURFACING_TYPE
        is_resurfacing_b = project_b.project_type == RESURFACING_TYPE

        if not ((is_excavation_a and is_excavation_b) or 
                (is_excavation_a and is_resurfacing_b) or
                (is_resurfacing_a and is_excavation_b)):
            return None

        shared_cost = max(project_a.estimated_cost, project_b.estimated_cost) * 0.65
        estimated_savings = (project_a.estimated_cost + project_b.estimated_cost) - shared_cost

        if estimated_savings <= 0:
            return None

        return JointTenderRecommendation(
            project_a=ProjectResponse.model_validate(project_a),
            project_b=ProjectResponse.model_validate(project_b),
            shared_trenching_cost=shared_cost,
            estimated_savings=estimated_savings,
            overlap_distance_meters=distance,
            time_overlap_days=time_overlap,
        )

    async def get_spatial_distance(
        self, project_a: Project, project_b: Project
    ) -> Optional[float]:
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
        return float(distance) if distance is not None else None

    def calculate_time_overlap(self, project_a: Project, project_b: Project) -> int:
        latest_start = max(project_a.start_date, project_b.start_date)
        earliest_end = min(project_a.end_date, project_b.end_date)

        if latest_start <= earliest_end:
            return (earliest_end - latest_start).days + 1

        gap = (latest_start - earliest_end).days
        if gap <= TIME_WINDOW_DAYS:
            return -gap
        return -1

    async def update_clash_savings(self):
        result = await self.db.execute(select(Project).options(selectinload(Project.department)))
        projects = list(result.scalars().all())

        for i, project_a in enumerate(projects):
            for project_b in projects[i + 1 :]:
                if project_a.department_id == project_b.department_id:
                    continue

                distance = await self.get_spatial_distance(project_a, project_b)
                if distance is None or distance > PROXIMITY_THRESHOLD_METERS:
                    continue

                shared_cost = max(project_a.estimated_cost, project_b.estimated_cost) * 0.65
                savings = (project_a.estimated_cost + project_b.estimated_cost) - shared_cost

                if savings > 0:
                    await self.update_or_create_clash_savings(
                        project_a.id, project_b.id, savings
                    )

    async def update_or_create_clash_savings(
        self, project_a_id: UUID, project_b_id: UUID, savings: float
    ):
        from app.models.models import Clash

        result = await self.db.execute(
            select(Clash).where(
                or_(
                    and_(Clash.project_a_id == project_a_id, Clash.project_b_id == project_b_id),
                    and_(Clash.project_a_id == project_b_id, Clash.project_b_id == project_a_id),
                )
            )
        )
        clash = result.scalar_one_or_none()

        if clash:
            clash.potential_savings = savings
        else:
            pass