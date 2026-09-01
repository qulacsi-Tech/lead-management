"""
Canonical public URLs for institute pages.

Client request, 01 Sep 2026:

    connectedus.in/college/sait/indore
    connectedus.in/university/medicaps-university/indore
    connectedus.in/coaching/paras/bhopal

so the shape is `/{type}/{name}/{city}`. See
docs/CLIENT_FEEDBACK_2026-09-01.md, Section 9.

Only the *name* is stored (`Page.slug`); the type and city segments are derived
from `Page.type` and `Page.city` on the way out. Storing the whole path would
mean a page that moves city, or is re-typed, silently keeps a URL that
contradicts its own record.

Both the JSON API and the server-rendered HTML build their links here, so a
page cannot be advertised at one URL and resolved at another.

Two properties worth preserving if you change this:

  - The path is *derived*, never parsed back into stored state. `parse_public_path`
    exists only to look a page up; nothing writes from it.
  - A page with no city degrades to a two-segment `/{type}/{name}` rather than
    emitting an empty segment. City is optional on the record, and `//` in a URL
    is its own category of bug.
"""

import re
from typing import Optional, Tuple

# The five values of `Page.type`, mapped to their URL segment. Explicit rather
# than slugified on the fly so that renaming a type label in the UI cannot
# silently change every one of its pages' URLs.
TYPE_SEGMENTS = {
    "School": "school",
    "Coaching": "coaching",
    "College": "college",
    "University": "university",
    "Training Institute": "training-institute",
}

SEGMENT_TYPES = {segment: name for name, segment in TYPE_SEGMENTS.items()}


def slugify(value: str) -> str:
    value = (value or "").lower().strip()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return re.sub(r"(^-|-$)", "", value)


def type_segment(page_type: Optional[str]) -> str:
    """URL segment for an institute type. Unknown types are slugified so a new
    type added to the taxonomy still produces a working URL."""
    if page_type in TYPE_SEGMENTS:
        return TYPE_SEGMENTS[page_type]
    return slugify(page_type or "") or "institute"


def page_public_path(page) -> str:
    """`/college/sait/indore` — the one canonical path for this page.

    Accepts anything with `.type`, `.slug` and `.city`, which covers both the
    ORM model and the response schema.
    """
    parts = [type_segment(getattr(page, "type", None)), getattr(page, "slug", "") or ""]
    city = slugify(getattr(page, "city", None) or "")
    if city:
        parts.append(city)
    return "/" + "/".join(p for p in parts if p)


def parse_public_path(path: str) -> Optional[Tuple[str, str, Optional[str]]]:
    """Split `/college/sait/indore` into ("College", "sait", "indore").

    Returns None when `path` is not shaped like an institute URL — the wrong
    number of segments, or a leading segment that is not a known institute
    type. Returning None (rather than guessing) is what keeps `/profile` and
    friends from being looked up as institutes.

    The third element is None for the two-segment form.
    """
    segments = [s for s in (path or "").strip("/").split("/") if s]
    if len(segments) not in (2, 3):
        return None

    page_type = SEGMENT_TYPES.get(segments[0].lower())
    if page_type is None:
        return None

    city = segments[2].lower() if len(segments) == 3 else None
    return page_type, segments[1].lower(), city


def matches_city(page, city_slug: Optional[str]) -> bool:
    """Whether `page` sits at a URL ending in `city_slug`.

    City is compared as a slug, not as stored text: `Page.city` holds "Indore"
    while the URL carries "indore", and pre-existing rows may hold anything a
    free-text field once accepted.
    """
    actual = slugify(getattr(page, "city", None) or "")
    if city_slug is None:
        # The two-segment form is only correct for a page that has no city.
        return not actual
    return actual == city_slug
