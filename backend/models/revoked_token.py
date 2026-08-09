from sqlalchemy import Column, String, DateTime
from core.database import Base


class RevokedToken(Base):
    """Logged-out access tokens, by JWT id (jti), until their natural expiry.

    Access tokens are otherwise stateless (verified by signature alone), so
    logout has nothing to invalidate server-side without this — this table
    is what makes `/auth/logout` actually revoke the token instead of the
    frontend just discarding it.
    """
    __tablename__ = "revoked_tokens"

    jti = Column(String, primary_key=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
