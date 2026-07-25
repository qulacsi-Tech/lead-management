import { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Field';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';

const STATUS_STYLE = {
  pending: { label: 'Pending', tone: 'bg-primary-fixed text-primary', dot: 'bg-primary' },
  verified: { label: 'Verified', tone: 'bg-secondary-container text-on-secondary-container', dot: 'bg-secondary' },
  hot: { label: 'Hot', tone: 'bg-error-container text-on-error-container', dot: 'bg-error' },
  interested: { label: 'Interested', tone: 'bg-primary-fixed text-primary', dot: 'bg-primary' },
  converted: { label: 'Converted', tone: 'bg-secondary-container text-on-secondary-container', dot: 'bg-secondary' },
};

export default function BuyLeads() {
  const { displayName } = useAuth();
  const { discoverableLeads, unlockedLeadsFor, unlockLead, updateLeadStatus, verifyLead, creditsFor, unlockCost } = useData();
  const { push } = useToast();
  const [tab, setTab] = useState('discovery');
  const [filters, setFilters] = useState({ state: 'Select State', city: '', course: 'All Courses', undergrad: false, postgrad: false, diploma: false });

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const toggleFilter = (key) => setFilter(key, !filters[key]);

  const credits = creditsFor(displayName);
  const candidates = discoverableLeads(filters);
  const purchased = unlockedLeadsFor(displayName);

  const handleUnlock = (id, name) => {
    const result = unlockLead(id, displayName);
    if (result.ok) {
      push({ type: 'success', message: `${name}'s profile unlocked for ${unlockCost} credits.` });
    } else {
      push({ type: 'error', message: 'Not enough credits to unlock this profile.' });
    }
  };

  const handleUpdateStatus = (id) => {
    const next = updateLeadStatus(id);
    push({ type: 'info', message: `Status updated to ${next}.` });
  };

  const handleVerify = (id, name) => {
    verifyLead(id);
    push({ type: 'success', message: `${name} marked verified — referrer awarded 100 points.` });
  };

  return (
    <div className="max-w-7xl w-full mx-auto px-10 py-8 box-border relative">
      <section className="flex justify-between items-end gap-6 flex-wrap mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold m-0 mb-2">Student Discovery</h2>
          <p className="text-on-surface-variant m-0 max-w-xl">
            Find the perfect candidates for your programs using high-precision filters and behavioral insights.
          </p>
        </div>
        <div className="bg-primary-fixed border border-outline-variant rounded-xl px-6 py-3 flex flex-col items-center">
          <span className="text-[11px] text-outline uppercase tracking-wide">Available Credits</span>
          <span className="text-xl font-bold text-primary">{credits.toLocaleString()}</span>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        <div>
          <Card className="p-6 sticky top-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold m-0">Search Filters</h3>
              <button
                onClick={() => setFilters({ state: 'Select State', city: '', course: 'All Courses', undergrad: false, postgrad: false, diploma: false })}
                className="bg-transparent border-none text-primary text-xs font-semibold cursor-pointer"
              >
                Reset All
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs text-outline mb-1.5">State</label>
                <Select value={filters.state} onChange={(e) => setFilter('state', e.target.value)}>
                  <option>Select State</option><option>California</option><option>New York</option><option>Texas</option>
                </Select>
              </div>
              <div>
                <label className="block text-xs text-outline mb-1.5">City</label>
                <Input value={filters.city} onChange={(e) => setFilter('city', e.target.value)} placeholder="Enter city name" />
              </div>
              <div>
                <label className="block text-xs text-outline mb-1.5">Course Interest</label>
                <Select value={filters.course} onChange={(e) => setFilter('course', e.target.value)}>
                  <option>All Courses</option><option>Computer Science</option><option>Business Admin</option><option>Healthcare</option>
                </Select>
              </div>
              <div>
                <label className="block text-xs text-outline mb-2">Qualification</label>
                <div className="flex flex-col gap-2">
                  {[['undergrad', 'Undergraduate'], ['postgrad', 'Postgraduate'], ['diploma', 'Diploma']].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={filters[key]} onChange={() => toggleFilter(key)} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <Button className="w-full mt-6">Apply Discovery</Button>
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

          {tab === 'discovery' ? (
            candidates.length === 0 ? (
              <Card className="p-10 text-center text-on-surface-variant text-sm">
                No leads match your filters right now. Try widening the city or course search.
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {candidates.map((c) => (
                  <Card key={c.id} className="p-6 flex flex-col gap-4">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-primary-fixed text-primary flex items-center justify-center font-bold flex-shrink-0">
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold m-0">{c.name}</h3>
                          <div className="flex items-center gap-1 text-on-surface-variant text-xs mt-0.5">
                            <span className="material-symbols-outlined text-sm">location_on</span>{c.city || 'Location unknown'}
                          </div>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap bg-surface-container-highest text-on-surface-variant capitalize">
                        via {c.source}
                      </span>
                    </div>
                    <p className="text-on-surface-variant text-sm leading-relaxed m-0">
                      {c.notes || 'No additional notes provided.'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-surface-container text-on-surface-variant px-2.5 py-1 rounded border border-outline-variant text-[11px] font-semibold">
                        {c.course}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-outline-variant">
                      <span className="text-primary font-semibold text-sm">{unlockCost} Credits</span>
                      <button
                        onClick={() => handleUnlock(c.id, c.name)}
                        className="px-4 py-2 rounded-lg font-semibold text-xs cursor-pointer border-none bg-primary text-white"
                      >
                        Unlock Profile
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )
          ) : (
            <LeadsTable leads={purchased} onUpdateStatus={handleUpdateStatus} onVerify={handleVerify} />
          )}

          <div>
            <h3 className="text-base font-bold mb-3">Recently Purchased Leads</h3>
            <LeadsTable leads={purchased} onUpdateStatus={handleUpdateStatus} onVerify={handleVerify} />
          </div>
        </div>
      </div>

      <button className="fixed bottom-8 right-8 bg-primary text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center cursor-pointer border-none z-50">
        <span className="material-symbols-outlined text-2xl">add</span>
      </button>
    </div>
  );
}

function LeadsTable({ leads, onUpdateStatus, onVerify }) {
  if (!leads.length) {
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
            <th className="px-5 py-3.5 text-xs text-outline font-semibold">Course Interest</th>
            <th className="px-5 py-3.5 text-xs text-outline font-semibold">Location</th>
            <th className="px-5 py-3.5 text-xs text-outline font-semibold">Status</th>
            <th className="px-5 py-3.5 text-xs text-outline font-semibold text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => {
            const style = STATUS_STYLE[l.status] || STATUS_STYLE.pending;
            return (
              <tr key={l.id} className="border-t border-surface-container">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-primary-fixed text-primary flex items-center justify-center text-[11px] font-bold">
                      {l.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold">{l.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-on-surface-variant">{l.course}</td>
                <td className="px-5 py-3.5 text-sm text-on-surface-variant">{l.city || '—'}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${style.tone}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />{style.label}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex justify-end gap-2">
                    {l.status === 'pending' && (
                      <button
                        onClick={() => onVerify(l.id, l.name)}
                        className="text-secondary text-xs font-semibold border border-secondary px-3 py-1.5 rounded-md cursor-pointer bg-transparent"
                      >
                        Verify
                      </button>
                    )}
                    <button
                      onClick={() => onUpdateStatus(l.id)}
                      className="text-primary text-xs font-semibold border border-primary px-3 py-1.5 rounded-md cursor-pointer bg-transparent"
                    >
                      Update Status
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
