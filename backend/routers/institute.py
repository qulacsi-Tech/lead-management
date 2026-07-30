from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from core.database import get_db
from core.deps import require_roles
from models.user import User
from models.enums import UserRole
from models.institute import Institute, InstituteResponse

router = APIRouter(prefix="/institute", tags=["Institute"])

require_institute = require_roles(UserRole.INSTITUTE)


async def _get_institute_or_404(db: AsyncSession, user: User) -> Institute:
    result = await db.execute(select(Institute).where(Institute.user_id == user.id))
    institute = result.scalars().first()
    if not institute:
        raise HTTPException(status_code=404, detail="Institute profile not found")
    return institute


@router.get("/me", response_model=InstituteResponse)
async def get_my_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_institute),
):
    return await _get_institute_or_404(db, current_user)
