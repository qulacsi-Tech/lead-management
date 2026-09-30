"""Course taxonomy: file categories under levels

Client request, 30 Sep 2026, on Platform Admin -> Types & Categories:
"whatever I add under a level should reflect there only". Categories used to
live in `course_hierarchy`, keyed by institute type with no notion of level,
and the admin screen drew the same pooled categories under every level.

The per-level tree now lives under its own key, `level_hierarchy`
({level: {category: [branches]}}), in the same `platform_taxonomies` table.
This migration builds it from the existing pool, placing each category by its
name (agreed with the client):

    B.* / Bachelor* / BA / BSc / BTech / BCom / BBA / BCA  -> the UG level
    M.* / Master* / MA / MSc / MTech / MCom / MBA / MCA    -> the PG level
    PhD / Ph.D / Doctor*                                  -> the Doctorate level

where "the UG level" is whichever configured level is named like UG /
Undergraduate (and so on). A category that matches no rule, or whose level
does not exist, is put under EVERY level — what the screen showed until now —
so nothing is lost and the admin can remove it where it does not belong.

Data only; nothing to undo structurally. Downgrade removes the new key.

Revision ID: 0013
Revises: 0012
"""
import json
import re
import uuid
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0013"
down_revision: Union[str, None] = "0012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

CATEGORY_RULES = [
    ("ug", re.compile(r"^(b\.|b\s|bachelor|ba$|bsc|b\.?sc|btech|b\.?tech|bcom|b\.?com|bba|bca|be$|b\.?e\.?$)", re.I)),
    ("pg", re.compile(r"^(m\.|m\s|master|ma$|msc|m\.?sc|mtech|m\.?tech|mcom|m\.?com|mba|mca|me$|m\.?e\.?$)", re.I)),
    ("doc", re.compile(r"(ph\.?\s?d|doctor)", re.I)),
]
LEVEL_RULES = {
    "ug": re.compile(r"^(ug|u\.g\.?|under\s?-?graduate|bachelor)", re.I),
    "pg": re.compile(r"^(pg|p\.g\.?|post\s?-?graduate|master)", re.I),
    "doc": re.compile(r"(doctor|ph\.?\s?d)", re.I),
}


def _load(conn, key):
    row = conn.execute(sa.text("SELECT data FROM platform_taxonomies WHERE key = :k"), {"k": key}).first()
    if row is None:
        return None
    data = row[0]
    return json.loads(data) if isinstance(data, str) else data


def upgrade() -> None:
    conn = op.get_bind()
    if _load(conn, "level_hierarchy"):
        return  # already built

    levels = _load(conn, "course_levels") or []
    hierarchy = _load(conn, "course_hierarchy") or {}

    # The pool: every category across institute types, branches merged.
    pool = {}
    for by_type in hierarchy.values():
        if not isinstance(by_type, dict):
            continue
        for cat, subs in by_type.items():
            merged = pool.setdefault(cat, [])
            for s in subs or []:
                if s not in merged:
                    merged.append(s)

    tier_level = {}
    for tier, rule in LEVEL_RULES.items():
        tier_level[tier] = next((lvl for lvl in levels if rule.search(lvl.strip())), None)

    level_hierarchy = {lvl: {} for lvl in levels}
    for cat, subs in pool.items():
        target = None
        for tier, rule in CATEGORY_RULES:
            if rule.search(cat.strip()):
                target = tier_level.get(tier)
                break
        for lvl in ([target] if target else levels):
            level_hierarchy[lvl][cat] = list(subs)

    payload = json.dumps(level_hierarchy)
    exists = conn.execute(sa.text("SELECT 1 FROM platform_taxonomies WHERE key = 'level_hierarchy'")).first()
    if exists:
        conn.execute(
            sa.text("UPDATE platform_taxonomies SET data = CAST(:d AS JSON) WHERE key = 'level_hierarchy'"),
            {"d": payload},
        )
    else:
        conn.execute(
            sa.text("INSERT INTO platform_taxonomies (id, key, data) VALUES (:id, 'level_hierarchy', CAST(:d AS JSON))"),
            {"id": str(uuid.uuid4()), "d": payload},
        )


def downgrade() -> None:
    op.execute("DELETE FROM platform_taxonomies WHERE key = 'level_hierarchy'")
