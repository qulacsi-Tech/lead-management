"""
Ad description templates and their groups — PLATFORM-owned.

Read by anyone signed in (a page admin needs the list to fill in an ad); every
write is Main Admin only. See models/ad_template.py for why ads store the
filled-in text rather than a template id.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.deps import get_current_active_user
from core.authz import require_main_admin
from models.user import User
from models.ad_template import (
    AdDescriptionGroup,
    AdDescriptionGroupCreate,
    AdDescriptionGroupResponse,
    AdDescriptionGroupUpdate,
    AdDescriptionTemplate,
    AdDescriptionTemplateCreate,
    AdDescriptionTemplateUpdate,
    AdDescriptionTemplateResponse,
    AD_TEMPLATE_SECTIONS,
)

router = APIRouter(prefix="/ad-templates/descriptions", tags=["Ad Templates"])
groups_router = APIRouter(prefix="/ad-templates/groups", tags=["Ad Templates"])


def _clean_text(text: str) -> str:
    """Collapse to one line.

    Each template is a single line of an ad's description — the ad stores its
    chosen lines separated by newlines, so a line break inside a template would
    read back as two picks.
    """
    cleaned = " ".join(text.split())
    if not cleaned:
        raise HTTPException(status_code=422, detail="Description text cannot be empty")
    return cleaned


def _check_section(section: str) -> None:
    if section not in AD_TEMPLATE_SECTIONS:
        raise HTTPException(status_code=422, detail=f"section must be one of {AD_TEMPLATE_SECTIONS}")


async def _assert_unique(db: AsyncSession, section: str, text: str, exclude_id: Optional[str] = None) -> None:
    stmt = select(AdDescriptionTemplate.id).where(
        AdDescriptionTemplate.section == section, AdDescriptionTemplate.text == text
    )
    if exclude_id:
        stmt = stmt.where(AdDescriptionTemplate.id != exclude_id)
    if (await db.execute(stmt)).first():
        raise HTTPException(status_code=409, detail="This description already exists for this ad type")


async def _check_group(db: AsyncSession, group_id: Optional[str], section: str) -> Optional[str]:
    """A line can only join a group of its own ad type."""
    if not group_id:
        return None
    group = await db.get(AdDescriptionGroup, group_id)
    if group is None or group.section != section:
        raise HTTPException(status_code=422, detail="That group does not belong to this ad type")
    return group.id


# ---------------------------------------------------------------------------
# Description lines
# ---------------------------------------------------------------------------

@router.get("", response_model=List[AdDescriptionTemplateResponse])
async def list_templates(
    section: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    stmt = select(AdDescriptionTemplate)
    if section:
        _check_section(section)
        stmt = stmt.where(AdDescriptionTemplate.section == section)
    stmt = stmt.order_by(
        AdDescriptionTemplate.section, AdDescriptionTemplate.sort_order, AdDescriptionTemplate.created_at
    )
    return list((await db.execute(stmt)).scalars().all())


@router.post("", response_model=AdDescriptionTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    payload: AdDescriptionTemplateCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_main_admin),
):
    _check_section(payload.section)
    text = _clean_text(payload.text)
    await _assert_unique(db, payload.section, text)
    group_id = await _check_group(db, payload.group_id, payload.section)

    last = await db.scalar(
        select(func.max(AdDescriptionTemplate.sort_order)).where(
            AdDescriptionTemplate.section == payload.section
        )
    )
    template = AdDescriptionTemplate(
        section=payload.section, text=text, group_id=group_id,
        sort_order=(last or 0) + 1, created_by=admin.id,
    )
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return template


@router.patch("/{template_id}", response_model=AdDescriptionTemplateResponse)
async def update_template(
    template_id: str,
    payload: AdDescriptionTemplateUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_main_admin),
):
    template = await db.get(AdDescriptionTemplate, template_id)
    if template is None:
        raise HTTPException(status_code=404, detail="Template not found")

    data = payload.model_dump(exclude_unset=True)
    if data.get("text") is not None:
        text = _clean_text(data["text"])
        await _assert_unique(db, template.section, text, exclude_id=template.id)
        template.text = text
    if data.get("sort_order") is not None:
        template.sort_order = data["sort_order"]
    if "group_id" in data:
        template.group_id = await _check_group(db, data["group_id"], template.section)

    await db.commit()
    await db.refresh(template)
    return template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_main_admin),
):
    template = await db.get(AdDescriptionTemplate, template_id)
    if template is None:
        raise HTTPException(status_code=404, detail="Template not found")
    await db.delete(template)
    await db.commit()


# ---------------------------------------------------------------------------
# Groups
# ---------------------------------------------------------------------------

def _clean_name(name: str) -> str:
    cleaned = " ".join(name.split())
    if not cleaned:
        raise HTTPException(status_code=422, detail="Group name cannot be empty")
    return cleaned


async def _assert_group_name_free(
    db: AsyncSession, section: str, name: str, exclude_id: Optional[str] = None
) -> None:
    stmt = select(AdDescriptionGroup.id).where(
        AdDescriptionGroup.section == section, func.lower(AdDescriptionGroup.name) == name.lower()
    )
    if exclude_id:
        stmt = stmt.where(AdDescriptionGroup.id != exclude_id)
    if name.lower() == "general" or (await db.execute(stmt)).first():
        raise HTTPException(status_code=409, detail="A group with this name already exists for this ad type")


@groups_router.get("", response_model=List[AdDescriptionGroupResponse])
async def list_groups(
    section: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    stmt = select(AdDescriptionGroup)
    if section:
        _check_section(section)
        stmt = stmt.where(AdDescriptionGroup.section == section)
    stmt = stmt.order_by(AdDescriptionGroup.section, AdDescriptionGroup.sort_order, AdDescriptionGroup.created_at)
    return list((await db.execute(stmt)).scalars().all())


@groups_router.post("", response_model=AdDescriptionGroupResponse, status_code=status.HTTP_201_CREATED)
async def create_group(
    payload: AdDescriptionGroupCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_main_admin),
):
    _check_section(payload.section)
    name = _clean_name(payload.name)
    await _assert_group_name_free(db, payload.section, name)
    last = await db.scalar(
        select(func.max(AdDescriptionGroup.sort_order)).where(AdDescriptionGroup.section == payload.section)
    )
    group = AdDescriptionGroup(
        section=payload.section, name=name, sort_order=(last or 0) + 1, created_by=admin.id,
    )
    db.add(group)
    await db.commit()
    await db.refresh(group)
    return group


@groups_router.patch("/{group_id}", response_model=AdDescriptionGroupResponse)
async def update_group(
    group_id: str,
    payload: AdDescriptionGroupUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_main_admin),
):
    group = await db.get(AdDescriptionGroup, group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    data = payload.model_dump(exclude_unset=True)
    if data.get("name") is not None:
        name = _clean_name(data["name"])
        await _assert_group_name_free(db, group.section, name, exclude_id=group.id)
        group.name = name
    if data.get("sort_order") is not None:
        group.sort_order = data["sort_order"]
    await db.commit()
    await db.refresh(group)
    return group


@groups_router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(
    group_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_main_admin),
):
    """Removes the group only. Its lines go back to "General" — explicitly
    here rather than trusting ON DELETE SET NULL, which SQLite ignores unless
    foreign keys are switched on."""
    group = await db.get(AdDescriptionGroup, group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    lines = (await db.execute(
        select(AdDescriptionTemplate).where(AdDescriptionTemplate.group_id == group.id)
    )).scalars().all()
    for line in lines:
        line.group_id = None
    await db.delete(group)
    await db.commit()
