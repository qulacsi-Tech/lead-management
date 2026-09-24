"""
Importing this package registers every SQLAlchemy model on `Base.metadata`.

Alembic's autogenerate and any metadata-driven tooling need every model
imported before they run; collecting the imports here means a new model is
registered by adding one line in one place rather than being silently missed.
"""

from models import user            # noqa: F401
from models import revoked_token   # noqa: F401
from models import student         # noqa: F401
from models import mentor          # noqa: F401
from models import institute       # noqa: F401
from models import enquiry         # noqa: F401
# --- Phase 2 ---
from models import page            # noqa: F401
from models import course          # noqa: F401
from models import opportunity     # noqa: F401
from models import social          # noqa: F401
from models import credit          # noqa: F401
from models import page_enquiry    # noqa: F401
from models import study_paper    # noqa: F401
from models import application     # noqa: F401
from models import ad_template     # noqa: F401

ALL_MODEL_MODULES = (
    "user", "revoked_token", "student", "mentor", "institute", "enquiry",
    "page", "course", "opportunity", "social", "credit", "page_enquiry",
    "study_paper", "application", "ad_template",
)
