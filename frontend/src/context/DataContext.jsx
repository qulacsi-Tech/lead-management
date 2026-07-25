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

const STATUS_CYCLE = ['hot', 'interested', 'converted'];

export function DataProvider({ children }) {
  const [leads, setLeads] = useLocalStorageState('lm.leads', SEED_LEADS);
  const [wallet, setWallet] = useLocalStorageState('lm.wallet', {});
  const [notifications, setNotifications] = useLocalStorageState('lm.notifications', []);

  const notify = useCallback((userKey, message) => {
    if (!userKey) return;
    setNotifications((prev) => [
      { id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, userKey, message, read: false, createdAt: Date.now() },
      ...prev,
    ]);
  }, [setNotifications]);

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
  }), [leads, addLead, verifyLead, unlockLead, updateLeadStatus, creditsFor, leadsFor, unlockedLeadsFor, discoverableLeads, notificationsFor, markRead, markAllRead]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
