"""
Credit ledger — an append-only accounting record of every credit movement.

Replaces the bare mutable `institutes.credits` integer, which could tell you a
balance but never *why* it was that number. The existing column is left in
place (it still has live data and the legacy admin screen reads it); balances
are now derived by summing the ledger, and the column is treated as a cache
that Phase 3 can retire.

Sign convention: `amount` is positive for credit in (purchase, grant, refund)
and negative for credit out (unlock, adjustment down). A balance is therefore
just SUM(amount) for the account — which makes it impossible for a balance to
exist that no transaction explains.
"""

from sqlalchemy import Column, String, Integer, DateTime, JSON, ForeignKey, Index
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import Optional, Any, Dict, List
import uuid

from core.database import Base

CREDIT_REASONS = [
    "purchase",      # bought credits            (+)
    "grant",         # platform granted credits  (+)
    "refund",        # reversal of an unlock     (+)
    "unlock",        # spent unlocking a profile/enquiry (-)
    "adjustment",    # manual admin correction   (+/-)
]


class CreditTransaction(Base):
    __tablename__ = "credit_transactions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    # The account the credits belong to. Credits are held by a user (an
    # institute admin spending on behalf of their page records page_id too).
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    page_id = Column(String, ForeignKey("pages.id", ondelete="SET NULL"), index=True)

    amount = Column(Integer, nullable=False)      # signed: + in, - out
    reason = Column(String, nullable=False)       # see CREDIT_REASONS
    description = Column(String)

    # What was unlocked/purchased, e.g. ("enquiry", "<id>").
    ref_type = Column(String)
    ref_id = Column(String)
    meta = Column(JSON, default=dict)

    # Running balance after this transaction, stored for auditability so a
    # historical statement doesn't change if older rows are ever corrected.
    balance_after = Column(Integer, nullable=False)

    created_by = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (Index("ix_credit_tx_user_created", "user_id", "created_at"),)


class CreditGrantRequest(BaseModel):
    """Main Admin adjusts a user's balance."""
    user_id: str
    amount: int
    reason: str = "grant"
    description: Optional[str] = None


class CreditTransactionResponse(BaseModel):
    id: str
    user_id: str
    page_id: Optional[str] = None
    amount: int
    reason: str
    description: Optional[str] = None
    ref_type: Optional[str] = None
    ref_id: Optional[str] = None
    balance_after: int
    created_at: Optional[Any] = None

    class Config:
        from_attributes = True


class CreditBalanceResponse(BaseModel):
    user_id: str
    balance: int
    transactions: List[CreditTransactionResponse] = []
