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

/**
 * Whether `pathname` is a public institute page.
 *
 * Mirrors the backend's `parse_public_path` (core/urls.py): two or three
 * segments, led by a known institute type. Used to strip the app's own
 * navigation from these pages — see AppLayout.
 *
 * Deliberately not a string sniff on "/college/": a path is an institute page
 * only if its leading segment is one of the types we actually publish, which is
 * what keeps `/profile` and `/admin/pages` out.
 */
export function isInstitutePath(pathname) {
  const segments = (pathname || '').split('/').filter(Boolean);
  if (segments.length < 2 || segments.length > 3) return false;
  return Object.values(TYPE_SEGMENTS).includes(segments[0].toLowerCase());
}
