import { createContext, useCallback, useContext, useMemo, useEffect } from 'react';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import {
  fetchAdminInstitutes,
  fetchAdminStudents,
  fetchAdminMentors,
} from '../Api/Api';

const DataContext = createContext(null);

const SEED_INSTITUTES = [
  { id: 'inst-1', name: 'Apex Institute of Technology', email: 'contact@apextech.edu', city: 'Seattle', phone: '+1 206-555-0142', courses: ['Cybersecurity', 'Data Science', 'Cloud Computing'], status: 'Active', leadsPurchased: 42, registeredAt: Date.now() - 15 * 86400000 },
  { id: 'inst-2', name: 'Horizon Business Academy', email: 'admissions@horizon.edu', city: 'Chicago', phone: '+1 312-555-0188', courses: ['Business Analytics', 'Digital Marketing', 'MBA'], status: 'Active', leadsPurchased: 28, registeredAt: Date.now() - 10 * 86400000 },
  { id: 'inst-3', name: 'Metro Healthcare & Nursing College', email: 'info@metrohealth.org', city: 'Miami', phone: '+1 305-555-0199', courses: ['Clinical Psychology', 'Healthcare Admin', 'Nursing'], status: 'Active', leadsPurchased: 15, registeredAt: Date.now() - 5 * 86400000 },
];

const SEED_STUDENTS = [
  { id: 'stud-1', name: 'Alex Wong', email: 'alex.wong@example.com', city: 'Seattle', course: 'Cybersecurity', phone: '+1 206-555-0101', status: 'Active', leadsPosted: 3, verifiedLeads: 2, points: 200, registeredAt: Date.now() - 6 * 86400000 },
  { id: 'stud-2', name: 'Sarah Miller', email: 'sarah.m@example.com', city: 'Chicago', course: 'Clinical Psychology', phone: '+1 312-555-0102', status: 'Active', leadsPosted: 2, verifiedLeads: 1, points: 100, registeredAt: Date.now() - 4 * 86400000 },
  { id: 'stud-3', name: 'Ryan Kapoor', email: 'ryan.k@example.com', city: 'Miami', course: 'Architectural Design', phone: '+1 305-555-0103', status: 'Active', leadsPosted: 1, verifiedLeads: 1, points: 100, registeredAt: Date.now() - 2 * 86400000 },
  { id: 'stud-4', name: 'Elena Rostova', email: 'elena.r@example.com', city: 'San Francisco', course: 'Data Science', phone: '+1 415-555-0104', status: 'Active', leadsPosted: 4, verifiedLeads: 4, points: 400, registeredAt: Date.now() - 1 * 86400000 },
];

const SEED_MENTORS = [
  { id: 'ment-1', name: 'Dr. Evelyn Carter', email: 'evelyn.carter@mentors.com', domain: 'Artificial Intelligence & ML', company: 'Tech Corp', rating: 4.9, testsCreated: 5, opportunitiesPosted: 8, status: 'Active', registeredAt: Date.now() - 12 * 86400000 },
  { id: 'ment-2', name: 'Marcus Vance', email: 'marcus.vance@mentors.com', domain: 'Cybersecurity & Infrastructure', company: 'SecureNet', rating: 4.8, testsCreated: 3, opportunitiesPosted: 4, status: 'Active', registeredAt: Date.now() - 8 * 86400000 },
  { id: 'ment-3', name: 'Sophia Chen', email: 'sophia.chen@mentors.com', domain: 'Product Design & UX', company: 'DesignHub', rating: 5.0, testsCreated: 6, opportunitiesPosted: 10, status: 'Active', registeredAt: Date.now() - 3 * 86400000 },
];

// Admin-facing data only. Student/Mentor/Institute self-service dashboards
// (and the referral-lead marketplace they drove) were retired in favor of
// the unified feed/profile experience — see
// docs/EDUCATION_NETWORK_ROADMAP.md. What remains here backs the Admin
// "manage institutes/students/mentors" screens and their notification bell.
export function DataProvider({ children }) {
  const [institutes, setInstitutes] = useLocalStorageState('lm.institutes', SEED_INSTITUTES);
  const [students, setStudents] = useLocalStorageState('lm.students', SEED_STUDENTS);
  const [mentors, setMentors] = useLocalStorageState('lm.mentors', SEED_MENTORS);
  const [notifications, setNotifications] = useLocalStorageState('lm.notifications', []);

  const refreshAdminData = useCallback(async () => {
    try {
      const [instRes, studRes, mentRes] = await Promise.allSettled([
        fetchAdminInstitutes(),
        fetchAdminStudents(),
        fetchAdminMentors(),
      ]);

      if (instRes.status === 'fulfilled' && Array.isArray(instRes.value) && instRes.value.length > 0) {
        const backendInsts = instRes.value.map((i) => {
          const locParts = [i.block, i.district, i.state].filter(Boolean);
          const locationStr = locParts.length ? locParts.join(', ') : i.city || 'N/A';
          return {
            id: i.id || `inst-${i.email}`,
            name: i.name,
            email: i.email,
            phone: i.phone || 'N/A',
            city: locationStr,
            state: i.state,
            district: i.district,
            block: i.block,
            courses: i.programs ? i.programs.split(', ') : ['General'],
            status: 'Active',
            leadsPurchased: 0,
            registeredAt: i.created_at ? new Date(i.created_at).getTime() : Date.now(),
            autoApproved: true,
          };
        });
        setInstitutes((prev) => {
          const existingEmails = new Set(backendInsts.map((b) => b.email));
          const localOnly = prev.filter((p) => !existingEmails.has(p.email));
          return [...backendInsts, ...localOnly];
        });
      }

      if (studRes.status === 'fulfilled' && Array.isArray(studRes.value) && studRes.value.length > 0) {
        const backendStuds = studRes.value.map((s) => ({
          id: s.id || `stud-${s.email}`,
          name: s.name,
          email: s.email,
          phone: s.phone || 'N/A',
          city: s.city || 'N/A',
          course: s.target_course || 'Undecided',
          status: 'Active',
          leadsPosted: 0,
          verifiedLeads: 0,
          points: 0,
          registeredAt: s.created_at ? new Date(s.created_at).getTime() : Date.now(),
          autoApproved: true,
        }));
        setStudents((prev) => {
          const existingEmails = new Set(backendStuds.map((b) => b.email));
          const localOnly = prev.filter((p) => !existingEmails.has(p.email));
          return [...backendStuds, ...localOnly];
        });
      }

      if (mentRes.status === 'fulfilled' && Array.isArray(mentRes.value) && mentRes.value.length > 0) {
        const backendMents = mentRes.value.map((m) => ({
          id: m.id || `ment-${m.email}`,
          name: m.name,
          email: m.email,
          phone: m.phone || 'N/A',
          domain: m.domain || 'General Mentorship',
          company: m.company || 'Independent Consultant',
          rating: 5.0,
          testsCreated: 0,
          opportunitiesPosted: 0,
          status: 'Active',
          registeredAt: m.created_at ? new Date(m.created_at).getTime() : Date.now(),
          autoApproved: true,
        }));
        setMentors((prev) => {
          const existingEmails = new Set(backendMents.map((b) => b.email));
          const localOnly = prev.filter((p) => !existingEmails.has(p.email));
          return [...backendMents, ...localOnly];
        });
      }
    } catch {
      // Offline fallback
    }
  }, [setInstitutes, setStudents, setMentors]);

  // Sync data on provider load
  useEffect(() => {
    refreshAdminData();
  }, [refreshAdminData]);

  const autoRegisterUser = useCallback(({ name, email, role, city, course, domain, company, phone }) => {
    const normRole = (role || 'student').toLowerCase();
    const idSuffix = Math.random().toString(36).slice(2, 7);
    const registeredAt = Date.now();

    if (normRole === 'institute') {
      const newInst = {
        id: `inst-${idSuffix}`,
        name: name || 'New Institute',
        email,
        city: city || 'Not specified',
        phone: phone || '+1 555-000-0000',
        courses: course ? [course] : ['General Studies'],
        status: 'Active',
        leadsPurchased: 0,
        registeredAt,
        autoApproved: true,
      };
      setInstitutes((prev) => [newInst, ...prev.filter((i) => i.email !== email)]);
      return newInst;
    }

    if (normRole === 'mentor') {
      const newMent = {
        id: `ment-${idSuffix}`,
        name: name || 'New Mentor',
        email,
        domain: domain || 'General Mentorship',
        company: company || 'Independent Consultant',
        rating: 5.0,
        testsCreated: 0,
        opportunitiesPosted: 0,
        status: 'Active',
        registeredAt,
        autoApproved: true,
      };
      setMentors((prev) => [newMent, ...prev.filter((m) => m.email !== email)]);
      return newMent;
    }

    // Default to student
    const newStud = {
      id: `stud-${idSuffix}`,
      name: name || 'New Student',
      email,
      city: city || 'Not specified',
      course: course || 'Undecided',
      phone: phone || '+1 555-000-0000',
      status: 'Active',
      leadsPosted: 0,
      verifiedLeads: 0,
      points: 0,
      registeredAt,
      autoApproved: true,
    };
    setStudents((prev) => [newStud, ...prev.filter((s) => s.email !== email)]);
    return newStud;
  }, [setInstitutes, setMentors, setStudents]);

  const updateEntityStatus = useCallback((type, id, status) => {
    if (type === 'institute') {
      setInstitutes((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    } else if (type === 'student') {
      setStudents((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    } else if (type === 'mentor') {
      setMentors((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    }
  }, [setInstitutes, setStudents, setMentors]);

  const deleteEntity = useCallback((type, id) => {
    if (type === 'institute') {
      setInstitutes((prev) => prev.filter((item) => item.id !== id));
    } else if (type === 'student') {
      setStudents((prev) => prev.filter((item) => item.id !== id));
    } else if (type === 'mentor') {
      setMentors((prev) => prev.filter((item) => item.id !== id));
    }
  }, [setInstitutes, setStudents, setMentors]);

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
    autoRegisterUser,
    updateEntityStatus,
    deleteEntity,
    notificationsFor,
    markRead,
    markAllRead,
    refreshAdminData,
  }), [institutes, students, mentors, autoRegisterUser, updateEntityStatus, deleteEntity, notificationsFor, markRead, markAllRead, refreshAdminData]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
