import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { fetchPageBySlug } from '../Api/Api';
import { pagePath } from '../utils/pageUrl';

/**
 * Forwards `connectedus.in/sait` to `connectedus.in/college/sait/indore`.
 *
 * Institute pages used to live at a single-segment URL. Those links were handed
 * to institutes and posted in chats before the format changed, so they resolve
 * and forward instead of 404ing.
 *
 * In production the server answers these with a 301 before the SPA ever loads
 * (`legacy_slug_redirect` in backend/routers/seo.py) — that is the one search
 * engines follow. This handles the cases the server cannot: an in-app <Link>
 * that still holds an old path, and the Vite dev server, which serves the SPA
 * itself with no redirect in front of it.
 *
 * `replace` so Back does not bounce the visitor into the redirect again.
 */
export default function LegacySlugRedirect() {
  const { instituteSlug } = useParams();
  const [target, setTarget] = useState(undefined); // undefined = resolving

  useEffect(() => {
    let active = true;
    setTarget(undefined);
    fetchPageBySlug(instituteSlug)
      .then((page) => {
        if (!active) return;
        const path = pagePath(page);
        setTarget(path === `/${instituteSlug}` ? null : path);
      })
      .catch(() => {
        if (active) setTarget(null);
      });
    return () => {
      active = false;
    };
  }, [instituteSlug]);

  if (target === undefined) return null;

  // No such institute — hand it to the feed rather than sitting on a blank
  // screen. The server has already replied 404 for a crawler.
  if (target === null) return <Navigate to="/" replace />;

  return <Navigate to={target} replace />;
}
