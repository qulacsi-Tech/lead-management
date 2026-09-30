"""
Platform-wide taxonomy model and schemas.

Allows Main Admin to dynamically configure:
  1. Course Hierarchy: Institute Type -> Category -> Subcategories
  2. Course Levels: e.g. Undergraduate, Postgraduate, Diploma, Foundation
  3. Affiliations & Accreditations: per institute type
  4. Serviced Locations: cities Connectedus operates in

Persisted in PostgreSQL so the platform admin can add, edit and delete categories
and assign them via multi-checkbox to any institute.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid

from pydantic import BaseModel, Field
from sqlalchemy import Column, DateTime, JSON, String
from sqlalchemy.sql import func

from core.database import Base


# Baseline hierarchy and levels (empty by default so admin builds own taxonomy)
DEFAULT_COURSE_HIERARCHY: Dict[str, Dict[str, List[str]]] = {}
DEFAULT_COURSE_LEVELS: List[str] = []


class PlatformTaxonomy(Base):
    __tablename__ = "platform_taxonomies"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    key = Column(String, unique=True, nullable=False, index=True)
    data = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class AddCategoryRequest(BaseModel):
    institute_type: Optional[str] = None
    category: str = Field(min_length=1)
    subcategories: List[str] = Field(default_factory=list)


class AddSubcategoryRequest(BaseModel):
    institute_type: Optional[str] = None
    category: str = Field(min_length=1)
    subcategory: str = Field(min_length=1)


class DeleteCategoryRequest(BaseModel):
    institute_type: Optional[str] = None
    category: str


class DeleteSubcategoryRequest(BaseModel):
    institute_type: Optional[str] = None
    category: str
    subcategory: str


class AddLevelRequest(BaseModel):
    level: str = Field(min_length=1)


class DeleteLevelRequest(BaseModel):
    level: str


class AddHierarchyItemRequest(BaseModel):
    institute_type: Optional[str] = None
    level: Optional[str] = None
    category: str = Field(min_length=1)
    subcategories: List[str] = Field(default_factory=list)


class FullHierarchyUpdateRequest(BaseModel):
    hierarchy: Dict[str, Dict[str, List[str]]]


# ---------------------------------------------------------------------------
# Per-level hierarchy: Level -> Category -> Subcategories
#
# Client request, 30 Sep 2026: whatever is added under a level must appear
# under that level only. `course_hierarchy` above is keyed by institute type
# and has no notion of level, so every level used to show the same pooled
# categories. `level_hierarchy` (stored under its own key) is the source of
# truth for the admin screen; the institute-facing pickers read the union of
# all levels, as they read the pool before.
# ---------------------------------------------------------------------------

class LevelItemsRequest(BaseModel):
    """Add one category (and branches) under each of the ticked levels.
    A level that does not exist yet is created."""
    levels: List[str] = Field(min_length=1)
    category: str = Field(min_length=1)
    subcategories: List[str] = Field(default_factory=list)


class LevelSubcategoryRequest(BaseModel):
    level: str = Field(min_length=1)
    category: str = Field(min_length=1)
    subcategory: str = Field(min_length=1)


class RenameLevelRequest(BaseModel):
    level: str = Field(min_length=1)
    new_name: str = Field(min_length=1)


class RenameCategoryRequest(BaseModel):
    level: str = Field(min_length=1)
    category: str = Field(min_length=1)
    new_name: str = Field(min_length=1)


class RenameSubcategoryRequest(BaseModel):
    level: str = Field(min_length=1)
    category: str = Field(min_length=1)
    subcategory: str = Field(min_length=1)
    new_name: str = Field(min_length=1)


# Serviced locations and affiliations — editable lists (client request,
# 30 Sep 2026: "make these items dynamic, user can edit and add too").

class LocationRequest(BaseModel):
    name: str = Field(min_length=1)


class RenameLocationRequest(BaseModel):
    name: str = Field(min_length=1)
    new_name: str = Field(min_length=1)


class AffiliationRequest(BaseModel):
    institute_type: str = Field(min_length=1)
    name: str = Field(min_length=1)


class RenameAffiliationRequest(BaseModel):
    institute_type: str = Field(min_length=1)
    name: str = Field(min_length=1)
    new_name: str = Field(min_length=1)


class TaxonomyResponse(BaseModel):
    course_hierarchy: Dict[str, Dict[str, List[str]]]
    level_hierarchy: Dict[str, Dict[str, List[str]]] = Field(default_factory=dict)
    course_levels: List[str]
    institute_types: List[str]
    affiliations: Dict[str, List[str]]
    locations: List[str]
