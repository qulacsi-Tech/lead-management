import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { mockDesiredJob } from './mockData';

// "Save what you're looking for, get notified when a matching lead shows
// up" — the client's own matrimony-website comparison. Persisted so both
// the Dashboard (where it's edited) and the notification bell (where a
// match gets announced) read the same saved criteria. See
// docs/CLIENT_FEEDBACK_2026-08-16.md, Section 4.
export function useDesiredCriteria() {
  const [desiredJob, setDesiredJob] = useLocalStorageState('desiredJob', mockDesiredJob);
  return { desiredJob, setDesiredJob };
}
