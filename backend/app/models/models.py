import enum
import uuid
from datetime import datetime, date
from typing import Optional

from sqlalchemy import (
    Column,
    String,
    Float,
    Integer,
    DateTime,
    Date,
    Text,
    ForeignKey,
    Enum,
    Index,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry

from app.database.database import Base


class ProjectType(str, enum.Enum):
    RESURFACING = "resurfacing"
    EXCAVATION = "excavation"
    PIPE_LAYING = "pipe_laying"
    CABLING = "cabling"


class ProjectStatus(str, enum.Enum):
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class Department(Base):
    __tablename__ = "departments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, unique=True)
    contact_email = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    projects = relationship("Project", back_populates="department", lazy="selectin")


class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    department_id = Column(
        UUID(as_uuid=True),
        ForeignKey("departments.id", ondelete="CASCADE"),
        nullable=False,
    )
    title = Column(String(255), nullable=False)
    project_type = Column(Enum(ProjectType, name="project_type_enum"), nullable=False)
    estimated_cost = Column(Float, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    location = Column(
        Geometry(geometry_type="LINESTRING", srid=4326, spatial_index=True),
        nullable=False,
    )
    status = Column(
        Enum(ProjectStatus, name="project_status_enum"),
        default=ProjectStatus.PLANNED,
        nullable=False,
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    department = relationship("Department", back_populates="projects", lazy="selectin")
    clashes_as_a = relationship(
        "Clash",
        foreign_keys="Clash.project_a_id",
        back_populates="project_a",
        lazy="selectin",
    )
    clashes_as_b = relationship(
        "Clash",
        foreign_keys="Clash.project_b_id",
        back_populates="project_b",
        lazy="selectin",
    )
    complaints = relationship("Complaint", back_populates="project", lazy="selectin")
    phase_feedbacks = relationship("PhaseFeedback", back_populates="project", lazy="selectin")

    __table_args__ = (
        Index("ix_projects_location", "location", postgresql_using="gist"),
        Index("ix_projects_dates", "start_date", "end_date"),
        Index("ix_projects_department", "department_id"),
    )


class ClashType(str, enum.Enum):
    RESURFACING_EXCAVATION_OVERLAP = "resurfacing_excavation_overlap"
    SPATIAL_PROXIMITY_OVERLAP = "spatial_proximity_overlap"


class Clash(Base):
    __tablename__ = "clashes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_a_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    project_b_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    clash_type = Column(Enum(ClashType, name="clash_type_enum"), nullable=False)
    distance_meters = Column(Float, nullable=False)
    description = Column(Text, nullable=False)
    potential_savings = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    project_a = relationship(
        "Project",
        foreign_keys=[project_a_id],
        back_populates="clashes_as_a",
        lazy="selectin",
    )
    project_b = relationship(
        "Project",
        foreign_keys=[project_b_id],
        back_populates="clashes_as_b",
        lazy="selectin",
    )

    __table_args__ = (
        UniqueConstraint("project_a_id", "project_b_id", name="uq_clash_projects"),
        Index("ix_clashes_project_a", "project_a_id"),
        Index("ix_clashes_project_b", "project_b_id"),
    )


class ComplaintStatus(str, enum.Enum):
    REPORTED = "reported"
    UNDER_REVIEW = "under_review"
    RESOLVED = "resolved"


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="SET NULL"),
        nullable=True,
    )
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    location = Column(
        Geometry(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=False,
    )
    upvotes_count = Column(Integer, default=0, nullable=False)
    status = Column(
        Enum(ComplaintStatus, name="complaint_status_enum"),
        default=ComplaintStatus.REPORTED,
        nullable=False,
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    project = relationship("Project", back_populates="complaints", lazy="selectin")
    upvotes = relationship("Upvote", back_populates="complaint", lazy="selectin")

    __table_args__ = (
        Index("ix_complaints_location", "location", postgresql_using="gist"),
        Index("ix_complaints_upvotes", "upvotes_count"),
        Index("ix_complaints_project", "project_id"),
    )


class Upvote(Base):
    __tablename__ = "upvotes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    complaint_id = Column(
        UUID(as_uuid=True),
        ForeignKey("complaints.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_fingerprint = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    complaint = relationship("Complaint", back_populates="upvotes", lazy="selectin")

    __table_args__ = (
        UniqueConstraint("complaint_id", "user_fingerprint", name="uq_upvote_complaint_user"),
        Index("ix_upvotes_complaint", "complaint_id"),
    )


class PhaseFeedback(Base):
    __tablename__ = "phase_feedback"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    phase_name = Column(String(255), nullable=False)
    rating = Column(Integer, nullable=False)
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    project = relationship("Project", back_populates="phase_feedbacks", lazy="selectin")

    __table_args__ = (
        Index("ix_phase_feedback_project", "project_id"),
    )