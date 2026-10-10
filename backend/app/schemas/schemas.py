from datetime import datetime, date
from typing import Optional, List, Any
from uuid import UUID
from pydantic import BaseModel, Field, field_validator, model_validator
from enum import Enum
import json


class ProjectType(str, Enum):
    RESURFACING = "resurfacing"
    EXCAVATION = "excavation"
    PIPE_LAYING = "pipe_laying"
    CABLING = "cabling"


class ProjectStatus(str, Enum):
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class ClashType(str, Enum):
    RESURFACING_EXCAVATION_OVERLAP = "resurfacing_excavation_overlap"
    SPATIAL_PROXIMITY_OVERLAP = "spatial_proximity_overlap"


class ComplaintStatus(str, Enum):
    REPORTED = "reported"
    UNDER_REVIEW = "under_review"
    RESOLVED = "resolved"


class Coordinates(BaseModel):
    lat: float
    lng: float


class GeoJSONPoint(BaseModel):
    type: str = "Point"
    coordinates: List[float]

    @model_validator(mode="after")
    def validate_coordinates(self):
        if len(self.coordinates) != 2:
            raise ValueError("Point coordinates must be [lng, lat]")
        return self


class GeoJSONLineString(BaseModel):
    type: str = "LineString"
    coordinates: List[List[float]]

    @model_validator(mode="after")
    def validate_coordinates(self):
        if len(self.coordinates) < 2:
            raise ValueError("LineString must have at least 2 points")
        for coord in self.coordinates:
            if len(coord) != 2:
                raise ValueError("Each coordinate must be [lng, lat]")
        return self


class DepartmentBase(BaseModel):
    name: str = Field(..., max_length=255)
    contact_email: str = Field(..., max_length=255)


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(DepartmentBase):
    pass


class DepartmentResponse(DepartmentBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectBase(BaseModel):
    department_id: UUID
    title: str = Field(..., max_length=255)
    project_type: ProjectType
    estimated_cost: float = Field(..., gt=0)
    start_date: date
    end_date: date
    location: Any
    status: ProjectStatus = ProjectStatus.PLANNED

    @field_validator("location", mode="before")
    @classmethod
    def parse_location(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                pass
        return v


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    department_id: Optional[UUID] = None
    title: Optional[str] = Field(None, max_length=255)
    project_type: Optional[ProjectType] = None
    estimated_cost: Optional[float] = Field(None, gt=0)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    location: Optional[Any] = None
    status: Optional[ProjectStatus] = None


class ProjectResponse(BaseModel):
    id: UUID
    department_id: UUID
    title: str
    project_type: ProjectType
    estimated_cost: float
    start_date: date
    end_date: date
    location: Any
    status: ProjectStatus
    created_at: datetime
    department: Optional["DepartmentResponse"] = None

    class Config:
        from_attributes = True


class ProjectGeoJSON(BaseModel):
    type: str = "Feature"
    geometry: Any
    properties: dict


class ClashBase(BaseModel):
    project_a_id: UUID
    project_b_id: UUID
    clash_type: ClashType
    distance_meters: float
    description: str
    potential_savings: float = 0.0


class ClashCreate(ClashBase):
    pass


class ClashResponse(ClashBase):
    id: UUID
    created_at: datetime
    project_a: Optional[ProjectResponse] = None
    project_b: Optional[ProjectResponse] = None

    class Config:
        from_attributes = True


class ComplaintBase(BaseModel):
    project_id: Optional[UUID] = None
    title: str = Field(..., max_length=255)
    description: str
    location: Any

    @field_validator("location", mode="before")
    @classmethod
    def parse_location(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                pass
        return v


class ComplaintCreate(ComplaintBase):
    pass


class ComplaintResponse(ComplaintBase):
    id: UUID
    upvotes_count: int
    status: ComplaintStatus
    created_at: datetime
    project: Optional[ProjectResponse] = None

    class Config:
        from_attributes = True


class UpvoteCreate(BaseModel):
    user_fingerprint: str = Field(..., max_length=255)


class UpvoteResponse(BaseModel):
    id: UUID
    complaint_id: UUID
    user_fingerprint: str
    created_at: datetime

    class Config:
        from_attributes = True


class PhaseFeedbackBase(BaseModel):
    project_id: UUID
    phase_name: str = Field(..., max_length=255)
    rating: int = Field(..., ge=1, le=5)
    comments: Optional[str] = None


class PhaseFeedbackCreate(PhaseFeedbackBase):
    pass


class PhaseFeedbackResponse(PhaseFeedbackBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class ClashDetectionResponse(BaseModel):
    clashes_detected: int
    clashes: List[ClashResponse]
    warnings: List[str]


class JointTenderRecommendation(BaseModel):
    project_a: ProjectResponse
    project_b: ProjectResponse
    shared_trenching_cost: float
    estimated_savings: float
    overlap_distance_meters: float
    time_overlap_days: int


class OptimizationResponse(BaseModel):
    recommendations: List[JointTenderRecommendation]
    total_taxpayer_savings: float
    total_projects_analyzed: int


class SeedResponse(BaseModel):
    message: str
    departments_created: int
    projects_created: int
    complaints_created: int
    feedback_created: int