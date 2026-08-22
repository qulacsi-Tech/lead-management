import { createContext, useCallback, useContext, useMemo, useEffect, useRef, useState } from 'react';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import {
  fetchAdminInstitutes,
  fetchAdminStudents,
  fetchAdminMentors,
} from '../Api/Api';

const DataContext = createContext(null);

// Admin-facing data only. Student/Mentor/Institute self-service dashboards
// (and the referral-lead marketplace they drove) were retired in favor of
// the unified feed/profile experience — see
// docs/EDUCATION_NETWORK_ROADMAP.md. What remains here backs the Admin
// "manage institutes/students/mentors" screens and their notification bell.
//
// These three lists come exclusively from the backend (`/api/admin/*`). They
// are deliberately NOT seeded or cached in localStorage: an admin console must
// show what the database actually holds, never a demo fixture that survives a
// failed request.
export function DataProvider({ children }) {
  const [institutes, setInstitutes] = useState([]);
  const [students, setStudents] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useLocalStorageState('lm.notifications', []);

  // Callers that overlap share one round-trip rather than each firing their
  // own. Without this, StrictMode's double-invoked mount effect (and any two
  // screens mounting together) would hit /admin/* twice for the same data.
  const inFlight = useRef(null);

  const refreshAdminData = useCallback(() => {
    if (inFlight.current) return inFlight.current;
    inFlight.current = (async () => {
      setLoading(true);
      const [instRes, studRes, mentRes] = await Promise.allSettled([
        fetchAdminInstitutes(),
        fetchAdminStudents(),
        fetchAdminMentors(),
      ]);

      const failed = [instRes, studRes, mentRes].some((r) => r.status === 'rejected');
      setError(failed ? 'Some records could not be loaded from the server.' : '');

      if (instRes.status === 'fulfilled' && Array.isArray(instRes.value)) {
        setInstitutes(instRes.value.map((i) => {
          const locParts = [i.block, i.district, i.state].filter(Boolean);
          return {
            id: i.id || `inst-${i.email}`,
            name: i.name,
            email: i.email,
            phone: i.phone || 'N/A',
            city: locParts.length ? locParts.join(', ') : i.city || 'N/A',
            state: i.state,
            district: i.district,
            block: i.block,
            courses: i.programs ? i.programs.split(', ') : [],
            status: 'Active',
            registeredAt: i.created_at ? new Date(i.created_at).getTime() : null,
            autoApproved: true,
          };
        }));
      }

      if (studRes.status === 'fulfilled' && Array.isArray(studRes.value)) {
        setStudents(studRes.value.map((s) => ({
          id: s.id || `stud-${s.email}`,
          name: s.name,
          email: s.email,
          phone: s.phone || 'N/A',
          city: s.city || 'N/A',
          course: s.target_course || 'Undecided',
          status: 'Active',
          registeredAt: s.created_at ? new Date(s.created_at).getTime() : null,
          autoApproved: true,
        })));
      }

      if (mentRes.status === 'fulfilled' && Array.isArray(mentRes.value)) {
        setMentors(mentRes.value.map((m) => ({
          id: m.id || `ment-${m.email}`,
          name: m.name,
          email: m.email,
          phone: m.phone || 'N/A',
          domain: m.domain || 'General Mentorship',
          company: m.company || 'Independent Consultant',
          status: 'Active',
          registeredAt: m.created_at ? new Date(m.created_at).getTime() : null,
          autoApproved: true,
        })));
      }

      setLoading(false);
      inFlight.current = null;
    })();
    return inFlight.current;
  }, []);

  // Sync data on provider load
  useEffect(() => {
    refreshAdminData();
  }, [refreshAdminData]);

  // Local-only view state: the backend has no suspend/delete endpoints for
  // these accounts yet, so the change lives for the current session only.
  const updateEntityStatus = useCallback((type, id, status) => {
    if (type === 'institute') {
      setInstitutes((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    } else if (type === 'student') {
      setStudents((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    } else if (type === 'mentor') {
      setMentors((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    }
  }, []);

  const deleteEntity = useCallback((type, id) => {
    if (type === 'institute') {
      setInstitutes((prev) => prev.filter((item) => item.id !== id));
    } else if (type === 'student') {
      setStudents((prev) => prev.filter((item) => item.id !== id));
    } else if (type === 'mentor') {
      setMentors((prev) => prev.filter((item) => item.id !== id));
    }
  }, []);

  const markRead = useCallback((id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, [setNotifications]);

  const markAllRead = useCallback((userKey) => {
    setNotifications((prev) => prev.map((n) => (n.userKey === userKey ? { ...n, read: true } : n)));
  }, [setNotifications]);

  const notificationsFor = useCallback((userKey) => notifications.filter((n) => n.userKey === userKey), [notifications]);

  const value = useMemo(() => ({
    institutes,
    students,
    mentors,
    loading,
    error,
    updateEntityStatus,
    deleteEntity,
    notificationsFor,
    markRead,
    markAllRead,
    refreshAdminData,
  }), [institutes, students, mentors, loading, error, updateEntityStatus, deleteEntity, notificationsFor, markRead, markAllRead, refreshAdminData]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
