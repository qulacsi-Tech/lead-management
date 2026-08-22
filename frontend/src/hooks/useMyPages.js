import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchMyPages } from '../Api/Api';

// One shared in-flight request per signed-in user, so the several screens that
// ask "which institutes do I administer?" (the Me menu, the profile's
// organisation tab) cost a single call to /pages/mine between them.
let cache = { key: null, promise: null };

function load(key) {
  if (cache.key !== key || !cache.promise) {
    cache = { key, promise: fetchMyPages().catch(() => []) };
  }
  return cache.promise;
}

/** Drop the cache so the next read re-fetches — call after creating a page. */
export function invalidateMyPages() {
  cache = { key: null, promise: null };
}

/**
 * The institute pages the current user administers.
 *
 * Backed by `/pages/mine`, i.e. the page_admins table — not by matching the
 * user's email against a bundled array, which is what the client-side
 * stand-in in InstituteContext still does.
 */
export function useMyPages() {
  const { user } = useAuth();
  const key = user?.id || null;
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(!!key);

  useEffect(() => {
    if (!key) {
      setPages([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    load(key).then((result) => {
      if (cancelled) return;
      setPages(Array.isArray(result) ? result : []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [key]);

  const refresh = useCallback(() => {
    invalidateMyPages();
    if (key) load(key).then((r) => setPages(Array.isArray(r) ? r : []));
  }, [key]);

  return { pages, loading, refresh, isInstituteAdmin: pages.length > 0 };
}
