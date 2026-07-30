import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import { fetchMyInstituteProfile, fetchEnquiries, fetchUnlockedEnquiries, ApiError } from '../../Api/Api';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function last6MonthsChart(purchased) {
  const counts = new Map();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    counts.set(key, 0);
    months.push({ key, m: MONTH_LABELS[d.getMonth()] });
  }
  purchased.forEach((p) => {
    if (!p.created_at) return;
    const d = new Date(p.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (counts.has(key)) counts.set(key, counts.get(key) + 1);
  });
  const max = Math.max(1, ...Array.from(counts.values()));
  return months.map(({ key, m }, idx) => ({
    m,
    h: Math.max(6, Math.round((counts.get(key) / max) * 100)),
    active: idx === months.length - 1,
    count: counts.get(key),
  }));
}

export default function InstituteDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [discovery, setDiscovery] = useState([]);
  const [purchased, setPurchased] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [p, d, u] = await Promise.all([
          fetchMyInstituteProfile(),
          fetchEnquiries(),
          fetchUnlockedEnquiries(),
        ]);
        setProfile(p);
        setDiscovery(d);
        setPurchased(u);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const hotAvailable = discovery.filter((c) => c.is_hot).length;
  const hotPurchased = purchased.filter((c) => c.is_hot).length;
  const chart = last6MonthsChart(purchased);
  const recent = [...purchased]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 5);
  const topCandidate = recent[0] || null;

  const hotPct = purchased.length ? Math.round((hotPurchased / purchased.length) * 100) : 0;

  const KPIS = [
    { icon: 'sell', label: 'Total Purchased Leads', value: String(purchased.length) },
    { icon: 'local_fire_department', label: 'Hot Leads Purchased', value: String(hotPurchased) },
    { icon: 'search', label: 'Available Enquiries', value: String(discovery.length) },
    { icon: 'account_balance_wallet', label: 'Credits Remaining', value: profile ? String(profile.credits) : '—' },
  ];

  return (
    <div className="max-w-7xl w-full mx-auto px-10 py-8 box-border">
      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-error-container text-on-error-container text-sm">{error}</div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {KPIS.map((k) => (
          <Card key={k.label} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-primary/10 rounded-xl text-primary">
                <span className="material-symbols-outlined">{k.icon}</span>
              </div>
            </div>
            <h3 className="text-xs text-on-surface-variant uppercase tracking-wide m-0 mb-2">{k.label}</h3>
            <p className="text-3xl font-bold text-primary m-0">{loading ? '—' : k.value}</p>
          </Card>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-lg font-semibold m-0">Purchase Growth</h2>
                <p className="text-sm text-on-surface-variant m-0 mt-1">Enquiries unlocked over the last 6 months</p>
              </div>
            </div>
            <div className="h-56 flex items-end justify-between gap-3 px-2">
              {chart.map((m) => (
                <div key={m.m} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className={`w-full rounded-t-lg ${m.active ? 'bg-primary shadow-lg' : 'bg-primary-fixed'}`}
                    style={{ height: `${m.h}%` }}
                    title={`${m.count} unlocked`}
                  />
                  <span className={`text-xs ${m.active ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>{m.m}</span>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 flex flex-col items-center">
              <h3 className="text-lg font-semibold w-full m-0 mb-5">Lead Composition</h3>
              <div className="relative w-44 h-44 mb-5">
                <svg width="176" height="176" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r="16" fill="transparent" stroke="var(--color-surface-container-highest)" strokeWidth="4" />
                  <circle cx="18" cy="18" r="16" fill="transparent" stroke="var(--color-error)" strokeDasharray={`${hotPct},100`} strokeWidth="4" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{purchased.length ? `${hotPct}%` : '—'}</span>
                  <span className="text-[11px] text-on-surface-variant uppercase">Hot Leads</span>
                </div>
              </div>
              <div className="w-full flex flex-col gap-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-error" />Hot (same state)</span>
                  <span>{hotPurchased}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-surface-container-highest" />Standard</span>
                  <span>{purchased.length - hotPurchased}</span>
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden min-h-[280px] flex flex-col justify-end bg-gradient-to-br from-primary to-primary-container">
              <div className="p-6 relative z-10">
                {topCandidate ? (
                  <>
                    <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-semibold inline-block mb-3">
                      {topCandidate.is_hot ? 'Hot Lead' : 'Most Recent Unlock'}
                    </span>
                    <h4 className="text-white text-xl font-semibold m-0 mb-1">{topCandidate.student_name}</h4>
                    <p className="text-primary-fixed text-sm m-0 mb-4">{topCandidate.course} · {topCandidate.state}</p>
                    <button
                      onClick={() => navigate('/institute/buy-leads')}
                      className="w-full bg-white text-primary py-2.5 rounded-lg font-semibold text-sm cursor-pointer border-none"
                    >
                      View Buy Leads
                    </button>
                  </>
                ) : (
                  <>
                    <h4 className="text-white text-xl font-semibold m-0 mb-1">No leads purchased yet</h4>
                    <p className="text-primary-fixed text-sm m-0 mb-4">Unlock enquiries in Buy Leads to see candidates here.</p>
                    <button
                      onClick={() => navigate('/institute/buy-leads')}
                      className="w-full bg-white text-primary py-2.5 rounded-lg font-semibold text-sm cursor-pointer border-none"
                    >
                      Browse Enquiries
                    </button>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>

        <aside className="lg:col-span-4 flex flex-col gap-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold m-0">Recent Activity</h2>
              <button
                onClick={() => navigate('/institute/buy-leads')}
                className="bg-transparent border-none text-primary font-semibold text-sm cursor-pointer"
              >
                View All
              </button>
            </div>
            {recent.length === 0 ? (
              <p className="text-sm text-on-surface-variant m-0">No purchases yet — unlock an enquiry to see activity here.</p>
            ) : (
              <div className="flex flex-col gap-5 relative pl-3 border-l-2 border-outline-variant">
                {recent.map((r) => (
                  <div key={r.id} className="relative pl-4">
                    <div className={`absolute -left-[19px] top-0 w-[22px] h-[22px] rounded-full flex items-center justify-center border-4 border-surface-container-lowest ${r.is_hot ? 'bg-error text-white' : 'bg-primary-fixed text-primary'}`}>
                      <span className="material-symbols-outlined text-xs">{r.enquiry_type === 'Coaching' ? 'school' : 'account_balance'}</span>
                    </div>
                    <p className="text-sm m-0"><strong>{r.student_name}</strong> — {r.enquiry_type} enquiry, {r.course}</p>
                    <p className="text-[11px] text-outline m-0 mt-0.5">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}{r.is_hot ? ' · Hot Lead' : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6 bg-primary text-white border-none">
            <h4 className="text-lg font-semibold m-0 mb-2">Need More Leads?</h4>
            <p className="text-primary-fixed text-sm m-0 mb-4">
              {discovery.length} enquir{discovery.length === 1 ? 'y' : 'ies'} available right now, {hotAvailable} hot for your state.
            </p>
            <button
              onClick={() => navigate('/institute/buy-leads')}
              className="w-full bg-white text-primary py-2.5 rounded-lg font-semibold text-sm cursor-pointer border-none"
            >
              Browse Enquiries
            </button>
          </Card>
        </aside>
      </div>
    </div>
  );
}
