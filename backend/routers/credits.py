"""
Credit ledger endpoints.

Balances are never stored as a mutable number that can drift — every balance is
the sum of an append-only transaction log, so any balance can be explained by
listing the rows that produced it.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.deps import get_current_active_user
from core.authz import require_main_admin
from models.user import User
from models.credit import (
    CreditTransaction,
    CreditGrantRequest,
    CreditTransactionResponse,
    CreditBalanceResponse,
    CREDIT_REASONS,
)

router = APIRouter(prefix="/credits", tags=["Credits"])


async def get_balance(db: AsyncSession, user_id: str) -> int:
    total = (
        await db.execute(
            select(func.coalesce(func.sum(CreditTransaction.amount), 0)).where(
                CreditTransaction.user_id == user_id
            )
        )
    ).scalar()
    return int(total or 0)


async def record_transaction(
    db: AsyncSession,
    *,
    user_id: str,
    amount: int,
    reason: str,
    description: Optional[str] = None,
    page_id: Optional[str] = None,
    ref_type: Optional[str] = None,
    ref_id: Optional[str] = None,
    created_by: Optional[str] = None,
) -> CreditTransaction:
    """The single write path for credits. Every spend/grant in the application
    goes through here so `balance_after` stays consistent and no code path can
    change a balance without leaving a reason behind."""
    new_balance = await get_balance(db, user_id) + amount
    if new_balance < 0:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    tx = CreditTransaction(
        user_id=user_id, page_id=page_id, amount=amount, reason=reason,
        description=description, ref_type=ref_type, ref_id=ref_id,
        balance_after=new_balance, created_by=created_by,
    )
    db.add(tx)
    return tx


@router.get("/me", response_model=CreditBalanceResponse)
async def my_credits(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    limit: int = Query(50, le=200),
):
    rows = list((await db.execute(
        select(CreditTransaction)
        .where(CreditTransaction.user_id == current_user.id)
        .order_by(CreditTransaction.created_at.desc())
        .limit(limit)
    )).scalars().all())
    return CreditBalanceResponse(
        user_id=current_user.id,
        balance=await get_balance(db, current_user.id),
        transactions=[CreditTransactionResponse.model_validate(r) for r in rows],
    )


@router.get("/{user_id}", response_model=CreditBalanceResponse)
async def user_credits(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_main_admin),
    limit: int = Query(50, le=200),
):
    """Platform oversight of any account's ledger."""
    rows = list((await db.execute(
        select(CreditTransaction)
        .where(CreditTransaction.user_id == user_id)
        .order_by(CreditTransaction.created_at.desc())
        .limit(limit)
    )).scalars().all())
    return CreditBalanceResponse(
        user_id=user_id,
        balance=await get_balance(db, user_id),
        transactions=[CreditTransactionResponse.model_validate(r) for r in rows],
    )


@router.post("/grant", response_model=CreditTransactionResponse, status_code=status.HTTP_201_CREATED)
async def grant_credits(
    payload: CreditGrantRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_main_admin),
):
    """PLATFORM-OWNED. Only a Main Admin moves credits by fiat; a negative
    amount is a correction, which is why `reason` is required."""
    if payload.reason not in CREDIT_REASONS:
        raise HTTPException(status_code=422, detail=f"reason must be one of {CREDIT_REASONS}")
    if payload.amount == 0:
        raise HTTPException(status_code=422, detail="amount must be non-zero")

    target = (await db.execute(select(User).where(User.id == payload.user_id))).scalars().first()
    if target is None:
        raise HTTPException(status_code=404, detail="User not found")

    tx = await record_transaction(
        db,
        user_id=target.id,
        amount=payload.amount,
        reason=payload.reason,
        description=payload.description,
        created_by=admin.id,
    )
    await db.commit()
    await db.refresh(tx)
    return tx
