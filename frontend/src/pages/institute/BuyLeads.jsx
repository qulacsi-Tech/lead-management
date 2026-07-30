import { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import { Input, Select } from '../../components/ui/Field';
import { useToast } from '../../context/ToastContext';
import {
  fetchMyInstituteProfile, fetchEnquiries, fetchUnlockedEnquiries, unlockEnquiry,
  fetchStates, ApiError,
} from '../../Api/Api';

export default function BuyLeads() {
  const { push } = useToast();
  const [tab, setTab] = useState('discovery');
  const [statesList, setStatesList] = useState([]);
  const [filters, setFilters] = useState({ state: '', course: '' });

  const [credits, setCredits] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [purchased, setPurchased] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unlockingId, setUnlockingId] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [profile, discovery, unlocked] = await Promise.all([
        fetchMyInstituteProfile(),
        fetchEnquiries(),
        fetchUnlockedEnquiries(),
      ]);
      setCredits(profile.credits ?? 0);
      setCandidates(discovery);
      setPurchased(unlocked);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load leads.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStates().then(setStatesList).catch(() => setStatesList([]));
    loadAll();
  }, []);

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const visibleCandidates = candidates.filter((c) => {
    if (filters.state && c.state !== filters.state) return false;
    if (filters.course && !c.course.toLowerCase().includes(filters.course.toLowerCase())) return false;
    return true;
  });

  const handleUnlock = async (enquiry) => {
    setUnlockingId(enquiry.id);
    try {
      const unlocked = await unlockEnquiry(enquiry.id);
      setCandidates((prev) => prev.filter((c) => c.id !== enquiry.id));
      setPurchased((prev) => [unlocked, ...prev]);
      setCredits((c) => (c === null ? c : c - unlocked.unlock_cost));
      push({ type: 'success', message: `${unlocked.student_name}'s profile unlocked for ${unlocked.unlock_cost} credits.` });
    } catch (err) {
      push({ type: 'error', message: err instanceof ApiError ? err.message : 'Not enough credits to unlock this enquiry.' });
    } finally {
      setUnlockingId(null);
    }
  };

  return (
    <div className="max-w-7xl w-full mx-auto px-10 py-8 box-border relative">
      <section className="flex justify-between items-end gap-6 flex-wrap mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold m-0 mb-2">Student Discovery</h2>
          <p className="text-on-surface-variant m-0 max-w-xl">
            Browse student Coaching &amp; College enquiries. Enquiries from your own state are flagged HOT.
          </p>
        </div>
        <div className="bg-primary-fixed border border-outline-variant rounded-xl px-6 py-3 flex flex-col items-center">
          <span className="text-[11px] text-outline uppercase tracking-wide">Available Credits</span>
          <span className="text-xl font-bold text-primary">{credits === null ? '—' : credits.toLocaleString()}</span>
        </div>
      </section>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-error-container text-on-error-container text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        <div>
          <Card className="p-6 sticky top-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold m-0">Search Filters</h3>
              <button
                onClick={() => setFilters({ state: '', course: '' })}
                className="bg-transparent border-none text-primary text-xs font-semibold cursor-pointer"
              >
                Reset All
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs text-outline mb-1.5">State</label>
                <Select value={filters.state} onChange={(e) => setFilter('state', e.target.value)}>
                  <option value="">All States</option>
                  {statesList.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-xs text-outline mb-1.5">Course</label>
                <Input value={filters.course} onChange={(e) => setFilter('course', e.target.value)} placeholder="e.g. Computer Science" />
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex border-b border-outline-variant">
            <button
              onClick={() => setTab('discovery')}
              className={`px-6 py-4 border-b-2 text-sm font-semibold flex items-center gap-2 cursor-pointer bg-transparent ${
                tab === 'discovery' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-lg">search</span>Discovery Results
            </button>
            <button
              onClick={() => setTab('purchased')}
              className={`px-6 py-4 border-b-2 text-sm font-semibold flex items-center gap-2 cursor-pointer bg-transparent ${
                tab === 'purchased' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-lg">verified</span>Purchased Leads
            </button>
          </div>

          {loading ? (
            <Card className="p-10 text-center text-on-surface-variant text-sm">Loading...</Card>
          ) : tab === 'discovery' ? (
            visibleCandidates.length === 0 ? (
              <Card className="p-10 text-center text-on-surface-variant text-sm">
                No enquiries match your filters right now. Try widening the state or course search.
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {visibleCandidates.map((c) => (
                  <Card key={c.id} className="p-6 flex flex-col gap-4">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-primary-fixed text-primary flex items-center justify-center font-bold flex-shrink-0">
                          <span className="material-symbols-outlined">
                            {c.enquiry_type === 'Coaching' ? 'school' : 'account_balance'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold m-0">{c.enquiry_type} Enquiry</h3>
                          <div className="flex items-center gap-1 text-on-surface-variant text-xs mt-0.5">
                            <span className="material-symbols-outlined text-sm">location_on</span>{c.state}
                          </div>
                        </div>
                      </div>
                      {c.is_hot && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap bg-error-container text-on-error-container">
                          HOT
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-surface-container text-on-surface-variant px-2.5 py-1 rounded border border-outline-variant text-[11px] font-semibold">
                        {c.course}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-outline-variant">
                      <span className="text-primary font-semibold text-sm">{c.unlock_cost} Credits</span>
                      <button
                        onClick={() => handleUnlock(c)}
                        disabled={unlockingId === c.id}
                        className="px-4 py-2 rounded-lg font-semibold text-xs cursor-pointer border-none bg-primary text-white disabled:opacity-50"
                      >
                        Unlock Profile
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )
          ) : (
            <EnquiryTable enquiries={purchased} />
          )}
        </div>
      </div>
    </div>
  );
}

function EnquiryTable({ enquiries }) {
  if (!enquiries.length) {
    return (
      <Card className="p-8 text-center text-on-surface-variant text-sm">
        No purchased leads yet — unlock a profile from Discovery Results to see it here.
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <table className="w-full border-collapse text-left">
        <thead className="bg-surface-container-low">
          <tr>
            <th className="px-5 py-3.5 text-xs text-outline font-semibold">Student</th>
            <th className="px-5 py-3.5 text-xs text-outline font-semibold">Contact</th>
            <th className="px-5 py-3.5 text-xs text-outline font-semibold">Course</th>
            <th className="px-5 py-3.5 text-xs text-outline font-semibold">State</th>
            <th className="px-5 py-3.5 text-xs text-outline font-semibold text-right">Type</th>
          </tr>
        </thead>
        <tbody>
          {enquiries.map((l) => (
            <tr key={l.id} className="border-t border-surface-container">
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-primary-fixed text-primary flex items-center justify-center text-[11px] font-bold">
                    {(l.student_name || '?').slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold">{l.student_name}</span>
                </div>
              </td>
              <td className="px-5 py-3.5 text-sm text-on-surface-variant">
                {l.student_phone || '—'}{l.student_email ? ` · ${l.student_email}` : ''}
              </td>
              <td className="px-5 py-3.5 text-sm text-on-surface-variant">{l.course}</td>
              <td className="px-5 py-3.5 text-sm text-on-surface-variant">{l.state}</td>
              <td className="px-5 py-3.5 text-right">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-fixed text-primary">
                  {l.enquiry_type}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
