"""
Ad description templates — PLATFORM-owned.

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
    AdDescriptionTemplate,
    AdDescriptionTemplateCreate,
    AdDescriptionTemplateUpdate,
    AdDescriptionTemplateResponse,
    AD_TEMPLATE_SECTIONS,
)

router = APIRouter(prefix="/ad-templates/descriptions", tags=["Ad Templates"])


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

    last = await db.scalar(
        select(func.max(AdDescriptionTemplate.sort_order)).where(
            AdDescriptionTemplate.section == payload.section
        )
    )
    template = AdDescriptionTemplate(
        section=payload.section, text=text, sort_order=(last or 0) + 1, created_by=admin.id
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
