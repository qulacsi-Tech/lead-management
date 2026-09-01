/**
 * Canonical public URL for an institute page: `/college/sait/indore`.
 *
 * Client request, 01 Sep 2026 — see docs/CLIENT_FEEDBACK_2026-09-01.md §9.
 *
 * The backend computes `public_path` on every page payload (core/urls.py), and
 * that is what we use whenever it is present. The local derivation below is a
 * fallback for payloads that predate it or that the client assembles itself —
 * it deliberately mirrors the server's rules, and the server stays the
 * authority.
 */

/** Same transformation as the backend's `slugify`. */
export function slugifySegment(value) {
  return (value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Institute type -> URL segment. Mirrors backend TYPE_SEGMENTS. */
export const TYPE_SEGMENTS = {
  School: 'school',
  Coaching: 'coaching',
  College: 'college',
  University: 'university',
  'Training Institute': 'training-institute',
};

export function typeSegment(type) {
  return TYPE_SEGMENTS[type] || slugifySegment(type) || 'institute';
}

/**
 * The path to link to for `page`.
 *
 * Falls back to '#' rather than '/' for an unusable page: a link to the feed
 * pretending to be an institute link is more confusing than a dead one.
 */
export function pagePath(page) {
  if (!page) return '#';
  if (page.public_path) return page.public_path;
  if (!page.slug) return '#';

  const city = slugifySegment(page.city);
  const parts = [typeSegment(page.type), page.slug];
  if (city) parts.push(city);
  return `/${parts.join('/')}`;
}

/** The same URL as the client sees it, for display next to a page's name. */
export function pageDisplayUrl(page, host = 'connectedus.in') {
  const path = pagePath(page);
  return path === '#' ? host : `${host}${path}`;
}
