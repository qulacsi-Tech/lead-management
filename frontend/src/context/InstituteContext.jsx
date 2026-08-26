import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { fetchMyPages } from '../Api/Api';
import { pagesAdministeredBy, findPageBySlug } from '../pages/mockData';
import { useLocalStorageState } from '../hooks/useLocalStorageState';

const InstituteContext = createContext(null);

export function InstituteProvider({ children }) {
  const { user } = useAuth();
  const [activeSlug, setActiveSlug] = useLocalStorageState('institute.activeSlug', null);
  const [apiPages, setApiPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [revision, setRevision] = useState(0);

  const loadPages = useCallback(async () => {
    if (!user) {
      setApiPages([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchMyPages();
      setApiPages(Array.isArray(res) ? res : []);
    } catch (err) {
      console.warn('Failed to fetch /pages/mine, falling back to mock data', err);
      setApiPages([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPages();
  }, [loadPages, revision]);

  const mockFallbackPages = useMemo(
    () => pagesAdministeredBy(user?.email),
    [user?.email, revision]
  );

  const myPages = useMemo(() => {
    return apiPages.length > 0 ? apiPages : mockFallbackPages;
  }, [apiPages, mockFallbackPages]);

  const page = useMemo(() => {
    const pinned = activeSlug
      ? myPages.find((p) => p.slug === activeSlug) || findPageBySlug(activeSlug)
      : null;
    const stillMine = pinned && myPages.some((p) => p.slug === pinned.slug);
    return stillMine ? pinned : myPages[0] || null;
  }, [activeSlug, myPages]);

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
      .catch(() => {
        setIsAdmin(pagesAdministeredBy(user?.email).length > 0);
      });
  }, [user]);

  return isAdmin;
}

