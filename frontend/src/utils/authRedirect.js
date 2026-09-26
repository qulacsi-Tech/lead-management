/**
 * Where the sign-in page sends someone back to.
 *
 * Every "sign in to …" entry point goes to /login with the page it came from
 * in `next`, so the visitor lands back on the institute they were following or
 * the paper they were downloading. `next` arrives in the URL, so it is only
 * honoured when it is a path on this site — never `//evil.com` or a full URL,
 * which would turn the login page into an open redirect.
 */

const AUTH_PATHS = ['/login', '/signup'];

export function safeNext(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return null;
  }
  // Never bounce back onto the auth pages themselves.
  if (AUTH_PATHS.some((p) => value === p || value.startsWith(`${p}?`) || value.startsWith(`${p}/`))) return null;
  return value;
}

/** `/login` or `/signup` carrying the return path and an optional reason line. */
export function authPath(base, { next, reason } = {}) {
  const params = new URLSearchParams();
  const target = safeNext(next);
  // `/` is the landing page, which forwards a signed-in user on its own.
  if (target && target !== '/') params.set('next', target);
  if (reason) params.set('reason', reason);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

/** Where to go once signed in: the page they came from, else their home. */
export function afterSignIn(role, next) {
  const target = safeNext(next);
  if (target) return target;
  if (role === 'admin') return '/admin';
  if (role === 'institute') return '/institute';
  return '/feed';
}
