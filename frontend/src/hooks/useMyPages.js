import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchMyPages } from '../Api/Api';

/**
 * The institute pages the current user administers.
 *
 * Backed by `/pages/mine`, i.e. the page_admins table — not by matching the
 * user's email against a bundled array, which is what the client-side
 * stand-in in InstituteContext still does.
 *
 * This is a SHARED STORE rather than per-component state on purpose. Several
 * screens ask the same question at once (the Me menu, the feed, the profile's
 * organisation tab), and they must agree: when the organisation form creates a
 * page, `refresh()` has to light up the "Institute Console" entry in the Me
 * menu too. The previous version kept a `useState` per caller, so a refresh
 * updated only the component that called it and everything else stayed stale
 * until a full page reload — reported by the client, 02 Sep 2026.
 */

const listeners = new Set();

let state = {
  key: null, // the user id these pages belong to
  pages: [],
  loading: false,
  promise: null, // in flight, so overlapping callers share one request
};

function setState(patch) {
  state = { ...state, ...patch };
  listeners.forEach((notify) => notify());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

function load(key, { force = false } = {}) {
  if (!key) {
    // Signed out: drop everything, including any in-flight response.
    if (state.key !== null || state.pages.length) {
      setState({ key: null, pages: [], loading: false, promise: null });
    }
    return Promise.resolve([]);
  }

  if (!force && state.key === key && state.promise) return state.promise;

  const promise = fetchMyPages().catch(() => []);
  setState({ key, loading: true, promise, pages: state.key === key ? state.pages : [] });

  promise.then((result) => {
    // A newer load — or a sign-out — has superseded this one; its result is
    // stale and must not overwrite the current user's pages.
    if (state.promise !== promise) return;
    setState({ pages: Array.isArray(result) ? result : [], loading: false });
  });

  return promise;
}

/** Drop the cache and re-read. Call after creating or deleting a page. */
export function invalidateMyPages() {
  return load(state.key, { force: true });
}

export function useMyPages() {
  const { user } = useAuth();
  const key = user?.id || null;
  const snapshot = useSyncExternalStore(subscribe, getSnapshot);

  useEffect(() => {
    load(key);
  }, [key]);

  // Never hand back another account's pages while the switch is in flight.
  const mine = snapshot.key === key;
  const pages = mine ? snapshot.pages : [];

  const refresh = useCallback(() => load(key, { force: true }), [key]);

  return {
    pages,
    // The effect that starts the first load runs after this render, so a key
    // we have not loaded yet still counts as loading — otherwise callers would
    // flash "you have no institute pages" before the request even begins.
    loading: !!key && (snapshot.loading || !mine),
    refresh,
    isInstituteAdmin: pages.length > 0,
  };
}
