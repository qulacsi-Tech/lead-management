"""
Platform Taxonomy Router.

Allows Main Admin to dynamically manage:
  - Course categories and subcategories per institute type
  - Course levels
  - Affiliation options and locations
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.authz import require_main_admin
from models.user import User
from models.taxonomy import (
    PlatformTaxonomy,
    AddCategoryRequest,
    AddSubcategoryRequest,
    DeleteCategoryRequest,
    DeleteSubcategoryRequest,
    AddLevelRequest,
    DeleteLevelRequest,
    AddHierarchyItemRequest,
    FullHierarchyUpdateRequest,
    TaxonomyResponse,
    DEFAULT_COURSE_HIERARCHY,
    DEFAULT_COURSE_LEVELS,
)
from models.page import INSTITUTE_TYPES

router = APIRouter(prefix="/taxonomy", tags=["Platform Taxonomy"])

DEFAULT_AFFILIATIONS = {
    "School": ["CBSE", "ICSE", "State Board", "IB", "NIOS"],
    "College": ["Devi Ahilya Vishwavidyalaya", "RGPV", "AICTE Approved", "UGC Recognised"],
    "University": ["UGC", "AICTE", "NAAC A++", "NAAC A+"],
    "Coaching": [],
    "Training Institute": [],
}

DEFAULT_LOCATIONS = ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Pune", "Nagpur"]


async def _get_or_create_record(db: AsyncSession, key: str, default_data: Any) -> PlatformTaxonomy:
    stmt = select(PlatformTaxonomy).where(PlatformTaxonomy.key == key)
    record = (await db.execute(stmt)).scalars().first()
    if not record:
        record = PlatformTaxonomy(key=key, data=default_data)
        db.add(record)
        await db.commit()
        await db.refresh(record)
    return record


@router.get("", response_model=TaxonomyResponse)
async def get_taxonomy(db: AsyncSession = Depends(get_db)):
    """Public read of current platform taxonomy.

    Used by public institute pages, search filters, institute page editors,
    and platform admin taxonomy screens.
    """
    hierarchy_rec = await _get_or_create_record(db, "course_hierarchy", DEFAULT_COURSE_HIERARCHY)
    levels_rec = await _get_or_create_record(db, "course_levels", DEFAULT_COURSE_LEVELS)
    affiliations_rec = await _get_or_create_record(db, "affiliations", DEFAULT_AFFILIATIONS)
    locations_rec = await _get_or_create_record(db, "locations", DEFAULT_LOCATIONS)

    return TaxonomyResponse(
        course_hierarchy=hierarchy_rec.data if hierarchy_rec.data is not None else {},
        course_levels=levels_rec.data if levels_rec.data is not None else [],
        institute_types=INSTITUTE_TYPES,
        affiliations=affiliations_rec.data if affiliations_rec.data is not None else DEFAULT_AFFILIATIONS,
        locations=locations_rec.data if locations_rec.data is not None else DEFAULT_LOCATIONS,
    )


@router.post("/category", response_model=TaxonomyResponse)
async def add_category(
    payload: AddCategoryRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_main_admin),
):
    """Add a course category and optional subcategories to the common platform pool."""
    rec = await _get_or_create_record(db, "course_hierarchy", DEFAULT_COURSE_HIERARCHY)
    hierarchy = dict(rec.data or DEFAULT_COURSE_HIERARCHY)

    cat_name = payload.category.strip()
    if not cat_name:
        raise HTTPException(status_code=422, detail="Category name cannot be empty")

    target_types = [payload.institute_type] if payload.institute_type else INSTITUTE_TYPES
    for it in target_types:
        if it not in hierarchy:
            hierarchy[it] = {}
        current_cats = dict(hierarchy[it])
        current_subs = list(current_cats.get(cat_name, []))

        for s in payload.subcategories:
            s_clean = s.strip()
            if s_clean and s_clean not in current_subs:
                current_subs.append(s_clean)

        current_cats[cat_name] = current_subs
        hierarchy[it] = current_cats

    rec.data = hierarchy
    await db.commit()
    await db.refresh(rec)

    return await get_taxonomy(db)


@router.post("/subcategory", response_model=TaxonomyResponse)
async def add_subcategory(
    payload: AddSubcategoryRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_main_admin),
):
    """Add a subcategory to a category in the common pool."""
    rec = await _get_or_create_record(db, "course_hierarchy", DEFAULT_COURSE_HIERARCHY)
    hierarchy = dict(rec.data or DEFAULT_COURSE_HIERARCHY)

    cat_name = payload.category.strip()
    sub_name = payload.subcategory.strip()

    if not sub_name:
        raise HTTPException(status_code=422, detail="Subcategory cannot be empty")

    target_types = [payload.institute_type] if payload.institute_type else INSTITUTE_TYPES
    for it in target_types:
        if it not in hierarchy:
            hierarchy[it] = {}
        current_cats = dict(hierarchy[it])
        current_subs = list(current_cats.get(cat_name, []))
        if sub_name not in current_subs:
            current_subs.append(sub_name)
        current_cats[cat_name] = current_subs
        hierarchy[it] = current_cats

    rec.data = hierarchy
    await db.commit()
    await db.refresh(rec)

    return await get_taxonomy(db)


@router.delete("/category", response_model=TaxonomyResponse)
async def delete_category(
    category: str = Query(...),
    institute_type: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_main_admin),
):
    """Remove a course category from the common pool."""
    rec = await _get_or_create_record(db, "course_hierarchy", DEFAULT_COURSE_HIERARCHY)
    hierarchy = dict(rec.data or DEFAULT_COURSE_HIERARCHY)

    target_types = [institute_type] if institute_type else list(hierarchy.keys())
    for it in target_types:
        if it in hierarchy and category in hierarchy[it]:
            current_cats = dict(hierarchy[it])
            current_cats.pop(category, None)
            hierarchy[it] = current_cats

    rec.data = hierarchy
    await db.commit()
    await db.refresh(rec)

    return await get_taxonomy(db)


@router.delete("/subcategory", response_model=TaxonomyResponse)
async def delete_subcategory(
    category: str = Query(...),
    subcategory: str = Query(...),
    institute_type: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_main_admin),
):
    """Remove a subcategory from a category in the common pool."""
    rec = await _get_or_create_record(db, "course_hierarchy", DEFAULT_COURSE_HIERARCHY)
    hierarchy = dict(rec.data or DEFAULT_COURSE_HIERARCHY)

    target_types = [institute_type] if institute_type else list(hierarchy.keys())
    for it in target_types:
        if it in hierarchy and category in hierarchy[it]:
            current_cats = dict(hierarchy[it])
            subs = [s for s in current_cats[category] if s != subcategory]
            current_cats[category] = subs
            hierarchy[it] = current_cats

    rec.data = hierarchy
    await db.commit()
    await db.refresh(rec)

    return await get_taxonomy(db)


@router.post("/level", response_model=TaxonomyResponse)
async def add_course_level(
    payload: AddLevelRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_main_admin),
):
    """Add a course level / programme type."""
    lvl = payload.level.strip()
    if not lvl:
        raise HTTPException(status_code=422, detail="Level cannot be empty")

    rec = await _get_or_create_record(db, "course_levels", DEFAULT_COURSE_LEVELS)
    current_levels = list(rec.data or DEFAULT_COURSE_LEVELS)
    if lvl not in current_levels:
        current_levels.append(lvl)
        rec.data = current_levels
        await db.commit()
        await db.refresh(rec)

    return await get_taxonomy(db)


@router.delete("/level", response_model=TaxonomyResponse)
async def delete_course_level(
    level: str = Query(...),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_main_admin),
):
    """Remove a course level."""
    rec = await _get_or_create_record(db, "course_levels", DEFAULT_COURSE_LEVELS)
    current_levels = [l for l in (rec.data or DEFAULT_COURSE_LEVELS) if l != level]
    rec.data = current_levels
    await db.commit()
    await db.refresh(rec)

    return await get_taxonomy(db)


@router.put("/course-hierarchy", response_model=TaxonomyResponse)
async def update_full_hierarchy(
    payload: FullHierarchyUpdateRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_main_admin),
):
    """Full update of course hierarchy dictionary."""
    rec = await _get_or_create_record(db, "course_hierarchy", DEFAULT_COURSE_HIERARCHY)
    rec.data = payload.hierarchy
    await db.commit()
    await db.refresh(rec)

    return await get_taxonomy(db)


@router.post("/hierarchy-item", response_model=TaxonomyResponse)
async def add_hierarchy_item(
    payload: AddHierarchyItemRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_main_admin),
):
    """Streamlined single endpoint to add level, category, and subcategories to the common pool.
    
    If level is provided and new, it is added to course_levels.
    The category and subcategories are added across all institute types as a common pool.
    """
    # 1. Handle level if provided
    if payload.level:
        lvl = payload.level.strip()
        if lvl:
            lvl_rec = await _get_or_create_record(db, "course_levels", DEFAULT_COURSE_LEVELS)
            current_levels = list(lvl_rec.data if lvl_rec.data is not None else [])
            if lvl not in current_levels:
                current_levels.append(lvl)
                lvl_rec.data = current_levels
                await db.commit()

    # 2. Handle category and subcategories across all types
    cat_name = payload.category.strip()
    if cat_name:
        rec = await _get_or_create_record(db, "course_hierarchy", DEFAULT_COURSE_HIERARCHY)
        hierarchy = dict(rec.data if rec.data is not None else {})

        target_types = [payload.institute_type] if payload.institute_type else INSTITUTE_TYPES
        for it in target_types:
            if it not in hierarchy:
                hierarchy[it] = {}
            current_cats = dict(hierarchy[it])
            current_subs = list(current_cats.get(cat_name, []))

            for s in payload.subcategories:
                s_clean = s.strip()
                if s_clean and s_clean not in current_subs:
                    current_subs.append(s_clean)

            current_cats[cat_name] = current_subs
            hierarchy[it] = current_cats

        rec.data = hierarchy
        await db.commit()

    return await get_taxonomy(db)
