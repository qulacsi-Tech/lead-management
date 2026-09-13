import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { fetchMyPages } from '../Api/Api';
import { useLocalStorageState } from '../hooks/useLocalStorageState';

const InstituteContext = createContext(null);

export function InstituteProvider({ children }) {
  const { user } = useAuth();
  const [activeSlug, setActiveSlug] = useLocalStorageState('institute.activeSlug', null);
  const [apiPages, setApiPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [revision, setRevision] = useState(0);

  const userId = user?.id || user?.email;
  const loadPages = useCallback(async () => {
    if (!userId) {
      setApiPages([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchMyPages();
      setApiPages(Array.isArray(res) ? res : []);
    } catch (err) {
      // No fallback. A failed request means "we do not know", and the only
      // safe reading of that is "no pages" — see the note on myPages below.
      console.warn('Failed to fetch /pages/mine', err);
      setApiPages([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);


  useEffect(() => {
    loadPages();
  }, [loadPages, revision]);

  /**
   * The server is the sole authority on which pages are this user's.
   *
   * There was a fallback here that matched the signed-in email against a
   * bundled `mockPages` array whenever the API returned nothing — the same
   * class of bug as the fabricated offline session removed from AuthContext.
   * It meant anyone whose email appeared in that fixture got an Institute
   * Console, and it fired precisely when the real answer was "you administer
   * no pages". An empty list must stay an empty list.
   */
  const myPages = apiPages;

  // The pinned page only counts while it is still one of this user's — a slug
  // left in localStorage by a previous account, or a page whose admin was
  // since revoked, must not select anything.
  const page = useMemo(
    () => myPages.find((p) => p.slug === activeSlug) || myPages[0] || null,
    [activeSlug, myPages],
  );

  const switchPage = useCallback((slug) => setActiveSlug(slug), [setActiveSlug]);

  const commit = useCallback((mutate) => {
    mutate?.();
    setRevision((r) => r + 1);
  }, []);

  const value = {
    page,
    myPages,
    isInstituteAdmin: myPages.length > 0,
    loading,
    switchPage,
    commit,
    refresh: loadPages,
    revision,
  };

  return <InstituteContext.Provider value={value}>{children}</InstituteContext.Provider>;
}

export function useInstitute() {
  const ctx = useContext(InstituteContext);
  if (!ctx) throw new Error('useInstitute must be used within InstituteProvider');
  return ctx;
}

export function useIsInstituteAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    fetchMyPages()
      .then((res) => {
        setIsAdmin(Array.isArray(res) && res.length > 0);
      })
      // A failed request is not evidence of access.
      .catch(() => setIsAdmin(false));
  }, [user]);

  return isAdmin;
}

