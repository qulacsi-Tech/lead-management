import { useEffect, useSyncExternalStore } from 'react';
import { fetchAdDescriptionTemplates, fetchAdDescriptionGroups } from '../Api/Api';

/**
 * The platform's ad description lines and the groups they are filed under,
 * all sections, from `/ad-templates/descriptions` and `/ad-templates/groups`.
 *
 * A shared store (same shape as useMyPages) so every open ad form reads one
 * request, and so the Platform Admin's Ad Descriptions screen can call
 * `reloadAdDescriptionTemplates()` after an edit and have the ad forms pick up
 * the change without a page reload.
 */

const listeners = new Set();

let state = { templates: [], groups: [], loaded: false, error: null, promise: null };

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

export function reloadAdDescriptionTemplates() {
  const promise = Promise.all([fetchAdDescriptionTemplates(), fetchAdDescriptionGroups()])
    .then(([templates, groups]) => {
      if (state.promise === promise) setState({ templates, groups, loaded: true, error: null, promise: null });
      return templates;
    })
    .catch((err) => {
      if (state.promise === promise) setState({ loaded: true, error: err, promise: null });
      return [];
    });
  setState({ promise });
  return promise;
}

/** `section` narrows to 'admission' | 'job' | 'paper'; omit it for all. */
export default function useAdDescriptionTemplates(section) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot);

  useEffect(() => {
    if (!state.loaded && !state.promise) reloadAdDescriptionTemplates();
  }, []);

  const inSection = (item) => !section || item.section === section;

  return {
    templates: snapshot.templates.filter(inSection),
    groups: snapshot.groups.filter(inSection),
    loading: !snapshot.loaded,
    error: snapshot.error,
    reload: reloadAdDescriptionTemplates,
  };
}
