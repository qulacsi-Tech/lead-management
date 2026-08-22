import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { pagesAdministeredBy, findPageBySlug } from '../pages/mockData';
import { useLocalStorageState } from '../hooks/useLocalStorageState';

const InstituteContext = createContext(null);

/**
 * Institute Admin context — answers "which Institute/Page am I managing right
 * now?" for every screen under /institute.
 *
 * Ownership model (docs/CONNECTEDUS_INTEGRATION_AUDIT_2026-08-20.md §Ownership):
 *   Main Admin  → creates the Page and assigns its admins
 *   Institute Admin → manages that Page's operational content
 * A user is an Institute Admin purely by virtue of appearing in some page's
 * `admins` list — there is no separate role flag, exactly as the future
 * PageAdmin table will work.
 *
 * NOTE: this is the client-side stand-in for that table. It decides what the UI
 * offers, not what the server permits — real enforcement lands in Phase 2.
 */
export function InstituteProvider({ children }) {
  const { user } = useAuth();
  const [activeSlug, setActiveSlug] = useLocalStorageState('institute.activeSlug', null);
  // Bumped on every write so screens re-render off the mutated mock objects.
  const [revision, setRevision] = useState(0);

  const myPages = useMemo(
    () => pagesAdministeredBy(user?.email),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.email, revision],
  );

  // Fall back to the first page this user administers when nothing is pinned,
  // or when the pinned page is one they no longer administer.
  const page = useMemo(() => {
    const pinned = activeSlug ? findPageBySlug(activeSlug) : null;
    const stillMine = pinned && myPages.some((p) => p.slug === pinned.slug);
    return stillMine ? pinned : myPages[0] || null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSlug, myPages, revision]);

  const switchPage = useCallback((slug) => setActiveSlug(slug), [setActiveSlug]);

  /** Wrap any mutation of the mock page object so dependent screens refresh. */
  const commit = useCallback((mutate) => {
    mutate?.();
    setRevision((r) => r + 1);
  }, []);

  const value = {
    page,
    myPages,
    isInstituteAdmin: myPages.length > 0,
    switchPage,
    commit,
    revision,
  };

  return <InstituteContext.Provider value={value}>{children}</InstituteContext.Provider>;
}

export function useInstitute() {
  const ctx = useContext(InstituteContext);
  if (!ctx) throw new Error('useInstitute must be used within InstituteProvider');
  return ctx;
}

/** Safe variant for screens outside the Institute Console (e.g. the top-bar
 * link in AppLayout) that only need to know whether the console applies. */
export function useIsInstituteAdmin() {
  const { user } = useAuth();
  return pagesAdministeredBy(user?.email).length > 0;
}
