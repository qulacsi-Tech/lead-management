import { createContext, useCallback, useContext, useMemo } from 'react';
import { useLocalStorageState } from '../hooks/useLocalStorageState';

const DataContext = createContext(null);

const DEFAULT_CREDITS = 1240;
const UNLOCK_COST = 10;

const SEED_LEADS = [
  { id: 'seed-1', name: 'Alex Wong', mobile: '9800000001', city: 'Seattle', course: 'Cybersecurity', notes: '', source: 'seed', referrerKey: null, status: 'pending', points: 0, views: 0, unlockedBy: null, createdAt: Date.now() - 6 * 86400000 },
  { id: 'seed-2', name: 'Sarah Miller', mobile: '9800000002', city: 'Chicago', course: 'Clinical Psychology', notes: '', source: 'seed', referrerKey: null, status: 'pending', points: 0, views: 0, unlockedBy: null, createdAt: Date.now() - 4 * 86400000 },
  { id: 'seed-3', name: 'Ryan Kapoor', mobile: '9800000003', city: 'Miami', course: 'Architectural Design', notes: '', source: 'seed', referrerKey: null, status: 'pending', points: 0, views: 0, unlockedBy: null, createdAt: Date.now() - 2 * 86400000 },
];

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

const STATUS_CYCLE = ['hot', 'interested', 'converted'];

export function DataProvider({ children }) {
  const [leads, setLeads] = useLocalStorageState('lm.leads', SEED_LEADS);
  const [institutes, setInstitutes] = useLocalStorageState('lm.institutes', SEED_INSTITUTES);
  const [students, setStudents] = useLocalStorageState('lm.students', SEED_STUDENTS);
  const [mentors, setMentors] = useLocalStorageState('lm.mentors', SEED_MENTORS);
  const [wallet, setWallet] = useLocalStorageState('lm.wallet', {});
  const [notifications, setNotifications] = useLocalStorageState('lm.notifications', []);

  const notify = useCallback((userKey, message) => {
    if (!userKey) return;
    setNotifications((prev) => [
      { id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, userKey, message, read: false, createdAt: Date.now() },
      ...prev,
    ]);
  }, [setNotifications]);

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

  const addLead = useCallback((fields) => {
    const lead = {
      id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: fields.name || '',
      mobile: fields.mobile || '',
      city: fields.city || '',
      course: fields.course || '',
      notes: fields.notes || '',
      source: fields.source,
      referrerKey: fields.referrerKey,
      status: 'pending',
      points: 0,
      views: 0,
      unlockedBy: null,
      createdAt: Date.now(),
    };
    setLeads((prev) => [lead, ...prev]);
    return lead;
  }, [setLeads]);

  const creditsFor = useCallback((instituteKey) => {
    if (!instituteKey) return DEFAULT_CREDITS;
    return wallet[instituteKey] ?? DEFAULT_CREDITS;
  }, [wallet]);

  const unlockLead = useCallback((id, instituteKey) => {
    const balance = creditsFor(instituteKey);
    if (balance < UNLOCK_COST) {
      return { ok: false, reason: 'insufficient-credits' };
    }
    const target = leads.find((l) => l.id === id && !l.unlockedBy);
    if (!target) return { ok: false, reason: 'not-found' };
    setLeads(leads.map((l) => (l.id === id ? { ...l, unlockedBy: instituteKey, views: l.views + 1 } : l)));
    setWallet((prev) => ({ ...prev, [instituteKey]: balance - UNLOCK_COST }));
    notify(target.referrerKey, `${instituteKey || 'An institute'} unlocked your referral for ${target.name}.`);
    return { ok: true };
  }, [leads, creditsFor, setLeads, setWallet, notify]);

  const verifyLead = useCallback((id) => {
    const target = leads.find((l) => l.id === id && l.status !== 'verified');
    if (!target) return { ok: false, reason: 'already-verified' };
    setLeads(leads.map((l) => (l.id === id ? { ...l, status: 'verified', points: 100 } : l)));
    notify(target.referrerKey, `Your referral for ${target.name} was verified — +100 points!`);
    return { ok: true };
  }, [leads, setLeads, notify]);

  const updateLeadStatus = useCallback((id) => {
    const target = leads.find((l) => l.id === id);
    if (!target) return null;
    const idx = STATUS_CYCLE.indexOf(target.status);
    const nextStatus = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length] ?? STATUS_CYCLE[0];
    setLeads(leads.map((l) => (l.id === id ? { ...l, status: nextStatus } : l)));
    notify(target.referrerKey, `Status for ${target.name} updated to ${nextStatus}.`);
    return nextStatus;
  }, [leads, setLeads, notify]);

  const markRead = useCallback((id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, [setNotifications]);

  const markAllRead = useCallback((userKey) => {
    setNotifications((prev) => prev.map((n) => (n.userKey === userKey ? { ...n, read: true } : n)));
  }, [setNotifications]);

  const leadsFor = useCallback((userKey) => leads.filter((l) => l.referrerKey === userKey), [leads]);

  const unlockedLeadsFor = useCallback((instituteKey) => leads.filter((l) => l.unlockedBy === instituteKey), [leads]);

  const discoverableLeads = useCallback((filters = {}) => {
    return leads.filter((l) => {
      if (l.unlockedBy) return false;
      if (filters.city && !l.city.toLowerCase().includes(filters.city.toLowerCase())) return false;
      if (filters.course && filters.course !== 'All Courses' && !l.course.toLowerCase().includes(filters.course.toLowerCase())) return false;
      return true;
    });
  }, [leads]);

  const notificationsFor = useCallback((userKey) => notifications.filter((n) => n.userKey === userKey), [notifications]);

  const value = useMemo(() => ({
    leads,
    institutes,
    students,
    mentors,
    autoRegisterUser,
    updateEntityStatus,
    deleteEntity,
    addLead,
    verifyLead,
    unlockLead,
    updateLeadStatus,
    creditsFor,
    leadsFor,
    unlockedLeadsFor,
    discoverableLeads,
    notificationsFor,
    markRead,
    markAllRead,
    unlockCost: UNLOCK_COST,
  }), [leads, institutes, students, mentors, autoRegisterUser, updateEntityStatus, deleteEntity, addLead, verifyLead, unlockLead, updateLeadStatus, creditsFor, leadsFor, unlockedLeadsFor, discoverableLeads, notificationsFor, markRead, markAllRead]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

