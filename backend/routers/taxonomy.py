"""
Platform Taxonomy Router.

Allows Main Admin to dynamically manage:
  - Course categories and subcategories per institute type
  - Course levels
  - Affiliation options and locations
"""

import copy
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
    LevelItemsRequest,
    LevelSubcategoryRequest,
    RenameLevelRequest,
    RenameCategoryRequest,
    RenameSubcategoryRequest,
    LocationRequest,
    RenameLocationRequest,
    AffiliationRequest,
    RenameAffiliationRequest,
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

    level_rec = await _get_or_create_record(db, "level_hierarchy", {})
    course_levels = levels_rec.data if levels_rec.data is not None else []
    level_hierarchy = dict(level_rec.data or {})
    # Every level appears, even one with nothing under it yet.
    level_hierarchy = {lvl: level_hierarchy.get(lvl, {}) for lvl in course_levels}

    return TaxonomyResponse(
        course_hierarchy=hierarchy_rec.data if hierarchy_rec.data is not None else {},
        level_hierarchy=level_hierarchy,
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
    lh_rec = await _get_or_create_record(db, "level_hierarchy", {})
    lh = copy.deepcopy(lh_rec.data or {})
    if level in lh:
        lh.pop(level)
        lh_rec.data = lh
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


# ---------------------------------------------------------------------------
# Per-level hierarchy (Level -> Category -> Subcategories)
#
# Everything below edits ONE level at a time: a category or branch added,
# renamed or removed under UG is untouched under PG. See models/taxonomy.py.
# ---------------------------------------------------------------------------

def _clean(value: str, what: str) -> str:
    cleaned = " ".join((value or "").split())
    if not cleaned:
        raise HTTPException(status_code=422, detail=f"{what} cannot be empty")
    return cleaned


def _find(names, wanted: str) -> Optional[str]:
    """The existing spelling of `wanted`, matched case-insensitively."""
    low = wanted.lower()
    return next((n for n in names if n.lower() == low), None)


async def _level_state(db: AsyncSession):
    levels_rec = await _get_or_create_record(db, "course_levels", DEFAULT_COURSE_LEVELS)
    lh_rec = await _get_or_create_record(db, "level_hierarchy", {})
    levels = list(levels_rec.data or [])
    lh = copy.deepcopy(lh_rec.data or {})
    return levels_rec, lh_rec, levels, lh


async def _save(db: AsyncSession, levels_rec, lh_rec, levels, lh):
    # Reassign rather than mutate: SQLAlchemy only notices a JSON change when
    # the attribute itself is replaced.
    levels_rec.data = list(levels)
    lh_rec.data = {lvl: lh.get(lvl, {}) for lvl in levels}
    await db.commit()
    return await get_taxonomy(db)


def _require_level(levels, level: str) -> str:
    found = _find(levels, level)
    if found is None:
        raise HTTPException(status_code=404, detail=f'Level "{level}" not found')
    return found


def _require_category(lh, level: str, category: str) -> str:
    found = _find(lh.get(level, {}).keys(), category)
    if found is None:
        raise HTTPException(status_code=404, detail=f'"{category}" is not under {level}')
    return found


@router.post("/level-hierarchy/items", response_model=TaxonomyResponse)
async def add_level_items(
    payload: LevelItemsRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_main_admin),
):
    """Add a category (with branches) under each ticked level — only those."""
    levels_rec, lh_rec, levels, lh = await _level_state(db)
    category = _clean(payload.category, "Category")
    subs = [_clean(s, "Branch") for s in payload.subcategories if (s or "").strip()]

    for raw_level in payload.levels:
        name = _clean(raw_level, "Level")
        level = _find(levels, name)
        if level is None:
            levels.append(name)
            level = name
        cats = lh.setdefault(level, {})
        cat = _find(cats.keys(), category) or category
        current = cats.setdefault(cat, [])
        for sub in subs:
            if _find(current, sub) is None:
                current.append(sub)

    return await _save(db, levels_rec, lh_rec, levels, lh)


@router.post("/level-hierarchy/subcategory", response_model=TaxonomyResponse)
async def add_level_subcategory(
    payload: LevelSubcategoryRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_main_admin),
):
    levels_rec, lh_rec, levels, lh = await _level_state(db)
    level = _require_level(levels, payload.level)
    cat = _require_category(lh, level, payload.category)
    sub = _clean(payload.subcategory, "Branch")
    subs = lh[level][cat]
    if _find(subs, sub) is not None:
        raise HTTPException(status_code=409, detail=f'"{sub}" is already under {cat}')
    subs.append(sub)
    return await _save(db, levels_rec, lh_rec, levels, lh)


@router.patch("/level-hierarchy/level", response_model=TaxonomyResponse)
async def rename_level(
    payload: RenameLevelRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_main_admin),
):
    levels_rec, lh_rec, levels, lh = await _level_state(db)
    level = _require_level(levels, payload.level)
    new = _clean(payload.new_name, "Level")
    clash = _find(levels, new)
    if clash is not None and clash != level:
        raise HTTPException(status_code=409, detail=f'A level named "{clash}" already exists')
    levels = [new if l == level else l for l in levels]
    lh[new] = lh.pop(level, {})
    return await _save(db, levels_rec, lh_rec, levels, lh)


@router.patch("/level-hierarchy/category", response_model=TaxonomyResponse)
async def rename_level_category(
    payload: RenameCategoryRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_main_admin),
):
    """Rename a category under one level. Its position and branches are kept."""
    levels_rec, lh_rec, levels, lh = await _level_state(db)
    level = _require_level(levels, payload.level)
    cat = _require_category(lh, level, payload.category)
    new = _clean(payload.new_name, "Category")
    clash = _find(lh[level].keys(), new)
    if clash is not None and clash != cat:
        raise HTTPException(status_code=409, detail=f'"{clash}" already exists under {level}')
    lh[level] = {(new if k == cat else k): v for k, v in lh[level].items()}
    return await _save(db, levels_rec, lh_rec, levels, lh)


@router.patch("/level-hierarchy/subcategory", response_model=TaxonomyResponse)
async def rename_level_subcategory(
    payload: RenameSubcategoryRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_main_admin),
):
    levels_rec, lh_rec, levels, lh = await _level_state(db)
    level = _require_level(levels, payload.level)
    cat = _require_category(lh, level, payload.category)
    subs = lh[level][cat]
    old = _find(subs, payload.subcategory)
    if old is None:
        raise HTTPException(status_code=404, detail=f'"{payload.subcategory}" is not under {cat}')
    new = _clean(payload.new_name, "Branch")
    clash = _find(subs, new)
    if clash is not None and clash != old:
        raise HTTPException(status_code=409, detail=f'"{clash}" is already under {cat}')
    lh[level][cat] = [new if s_ == old else s_ for s_ in subs]
    return await _save(db, levels_rec, lh_rec, levels, lh)


@router.delete("/level-hierarchy/category", response_model=TaxonomyResponse)
async def delete_level_category(
    level: str = Query(...),
    category: str = Query(...),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_main_admin),
):
    levels_rec, lh_rec, levels, lh = await _level_state(db)
    lvl = _require_level(levels, level)
    cat = _require_category(lh, lvl, category)
    lh[lvl].pop(cat)
    return await _save(db, levels_rec, lh_rec, levels, lh)


@router.delete("/level-hierarchy/subcategory", response_model=TaxonomyResponse)
async def delete_level_subcategory(
    level: str = Query(...),
    category: str = Query(...),
    subcategory: str = Query(...),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_main_admin),
):
    levels_rec, lh_rec, levels, lh = await _level_state(db)
    lvl = _require_level(levels, level)
    cat = _require_category(lh, lvl, category)
    lh[lvl][cat] = [s_ for s_ in lh[lvl][cat] if s_.lower() != subcategory.lower()]
    return await _save(db, levels_rec, lh_rec, levels, lh)


# ---------------------------------------------------------------------------
# Serviced locations and affiliations
# ---------------------------------------------------------------------------

async def _locations(db: AsyncSession):
    rec = await _get_or_create_record(db, "locations", DEFAULT_LOCATIONS)
    return rec, list(rec.data if rec.data is not None else DEFAULT_LOCATIONS)


@router.post("/locations", response_model=TaxonomyResponse)
async def add_location(
    payload: LocationRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_main_admin),
):
    rec, items = await _locations(db)
    name = _clean(payload.name, "Location")
    if _find(items, name) is not None:
        raise HTTPException(status_code=409, detail=f'"{name}" is already listed')
    rec.data = items + [name]
    await db.commit()
    return await get_taxonomy(db)


@router.patch("/locations", response_model=TaxonomyResponse)
async def rename_location(
    payload: RenameLocationRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_main_admin),
):
    rec, items = await _locations(db)
    old = _find(items, payload.name)
    if old is None:
        raise HTTPException(status_code=404, detail=f'"{payload.name}" is not listed')
    new = _clean(payload.new_name, "Location")
    clash = _find(items, new)
    if clash is not None and clash != old:
        raise HTTPException(status_code=409, detail=f'"{clash}" is already listed')
    rec.data = [new if i == old else i for i in items]
    await db.commit()
    return await get_taxonomy(db)


@router.delete("/locations", response_model=TaxonomyResponse)
async def delete_location(
    name: str = Query(...),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_main_admin),
):
    rec, items = await _locations(db)
    rec.data = [i for i in items if i.lower() != name.lower()]
    await db.commit()
    return await get_taxonomy(db)


async def _affiliations(db: AsyncSession, institute_type: str):
    if institute_type not in INSTITUTE_TYPES:
        raise HTTPException(status_code=422, detail=f"institute_type must be one of {INSTITUTE_TYPES}")
    rec = await _get_or_create_record(db, "affiliations", DEFAULT_AFFILIATIONS)
    data = copy.deepcopy(rec.data if rec.data is not None else DEFAULT_AFFILIATIONS)
    return rec, data, list(data.get(institute_type, []))


@router.post("/affiliations", response_model=TaxonomyResponse)
async def add_affiliation(
    payload: AffiliationRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_main_admin),
):
    rec, data, items = await _affiliations(db, payload.institute_type)
    name = _clean(payload.name, "Affiliation")
    if _find(items, name) is not None:
        raise HTTPException(status_code=409, detail=f'"{name}" is already listed for {payload.institute_type}')
    data[payload.institute_type] = items + [name]
    rec.data = data
    await db.commit()
    return await get_taxonomy(db)


@router.patch("/affiliations", response_model=TaxonomyResponse)
async def rename_affiliation(
    payload: RenameAffiliationRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_main_admin),
):
    rec, data, items = await _affiliations(db, payload.institute_type)
    old = _find(items, payload.name)
    if old is None:
        raise HTTPException(status_code=404, detail=f'"{payload.name}" is not listed for {payload.institute_type}')
    new = _clean(payload.new_name, "Affiliation")
    clash = _find(items, new)
    if clash is not None and clash != old:
        raise HTTPException(status_code=409, detail=f'"{clash}" is already listed for {payload.institute_type}')
    data[payload.institute_type] = [new if i == old else i for i in items]
    rec.data = data
    await db.commit()
    return await get_taxonomy(db)


@router.delete("/affiliations", response_model=TaxonomyResponse)
async def delete_affiliation(
    institute_type: str = Query(...),
    name: str = Query(...),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_main_admin),
):
    rec, data, items = await _affiliations(db, institute_type)
    data[institute_type] = [i for i in items if i.lower() != name.lower()]
    rec.data = data
    await db.commit()
    return await get_taxonomy(db)
