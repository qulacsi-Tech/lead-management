import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { fetchMyMentorStats, fetchMyPapers, fetchMyOpportunities, ApiError } from '../../Api/Api';

const QUICK_ACTIONS = [
  { icon: 'add_circle', label: 'Create Paper', to: '/mentor/practice-tests' },
  { icon: 'campaign', label: 'Post Opportunity', to: '/mentor/post-opportunity' },
  { icon: 'person', label: 'Edit Profile', to: '/mentor/profile' },
  { icon: 'analytics', label: 'View Analytics', to: '/mentor/analytics' },
];

function monthKey(date) {
  return date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
}

function buildLast6MonthsChart(papers) {
  const now = new Date();
  const buckets = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, m: monthKey(d), count: 0, active: i === 0 });
  }
  papers.forEach((p) => {
    if (!p.created_at) return;
    const d = new Date(p.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = buckets.find((b) => b.key === key);
    if (bucket) bucket.count += 1;
  });
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return buckets.map((b) => ({ ...b, h: 24 + (b.count / max) * 176 }));
}

export default function MentorDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [papers, setPapers] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const [statsRes, papersRes, oppsRes] = await Promise.allSettled([
        fetchMyMentorStats(),
        fetchMyPapers(),
        fetchMyOpportunities(),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (papersRes.status === 'fulfilled') setPapers(papersRes.value);
      if (oppsRes.status === 'fulfilled') setOpportunities(oppsRes.value);

      const failed = [statsRes, papersRes, oppsRes].find((r) => r.status === 'rejected');
      if (failed) {
        setError(failed.reason instanceof ApiError ? failed.reason.message : 'Some dashboard data failed to load.');
      }

      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="max-w-7xl w-full mx-auto px-10 py-6 box-border text-on-surface-variant">Loading dashboard...</div>;
  }

  if (!stats) {
    return (
      <div className="max-w-7xl w-full mx-auto px-10 py-6 box-border">
        <div className="px-4 py-3 rounded-xl bg-error-container text-on-error-container text-sm">
          {error || 'Failed to load dashboard stats.'}
        </div>
      </div>
    );
  }

  const chart = buildLast6MonthsChart(papers);
  const topPapers = [...papers].sort((a, b) => (b.downloads || 0) - (a.downloads || 0)).slice(0, 3);
  const recentPapers = [...papers].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 4);

  return (
    <div className="max-w-7xl w-full mx-auto px-10 py-6 box-border">
      <div className="flex justify-between items-end gap-6 flex-wrap mb-6">
        <div>
          <h2 className="font-display text-3xl font-bold m-0">Mentor Command Center</h2>
          <p className="text-on-surface-variant m-0 mt-1 max-w-xl">
            Overview of your published papers, student reach, and opportunities.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" icon="add_circle" onClick={() => navigate('/mentor/practice-tests')}>New Test</Button>
          <Button icon="campaign" onClick={() => navigate('/mentor/post-opportunity')}>Post Opportunity</Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-error-container text-on-error-container text-sm">{error}</div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {[
          { icon: 'description', label: 'Papers Published', value: stats.published_papers },
          { icon: 'quiz', label: 'Total Questions', value: stats.total_questions },
          { icon: 'download', label: 'Total Attempts', value: stats.total_attempts },
          { icon: 'groups', label: 'Students Reached', value: stats.distinct_students_reached },
        ].map((k) => (
          <Card key={k.label} className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <span className="material-symbols-outlined">{k.icon}</span>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant m-0">{k.label}</p>
            <h3 className="text-2xl font-bold m-0 mt-0.5">{k.value}</h3>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { icon: 'edit_note', label: 'Draft Papers', value: stats.draft_papers },
          { icon: 'favorite', label: 'Likes Received', value: stats.total_likes },
          { icon: 'work', label: 'Open Opportunities', value: stats.open_opportunities },
        ].map((s) => (
          <Card key={s.label} className="p-4 flex items-center gap-4">
            <div className="p-3 bg-primary-fixed rounded-xl text-primary">
              <span className="material-symbols-outlined">{s.icon}</span>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant m-0">{s.label}</p>
              <h3 className="text-xl font-bold m-0 mt-0.5">{s.value}</h3>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <Card className="md:col-span-8 p-6">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-lg font-semibold m-0">Papers Published (Last 6 Months)</h4>
              </div>
              <div className="h-56 flex items-end justify-between gap-2 px-2 border-b border-outline-variant pb-6">
                {chart.map((m) => (
                  <div key={m.key} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className={`w-full rounded-t-lg ${m.active ? 'bg-primary' : 'bg-surface-container-highest'}`}
                      style={{ height: `${m.h}px` }}
                      title={`${m.count} paper${m.count === 1 ? '' : 's'}`}
                    />
                    <span className={`text-[10px] font-bold ${m.active ? 'text-on-surface' : 'text-on-surface-variant'}`}>{m.m}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="md:col-span-4 p-6 bg-primary text-white border-none flex flex-col">
              <h4 className="text-lg font-semibold mb-1">Top Performing Papers</h4>
              <p className="opacity-80 text-sm mb-6">Ranked by student attempts.</p>
              <div className="flex flex-col gap-4 flex-1">
                {topPapers.length === 0 ? (
                  <p className="text-sm opacity-80">No papers yet.</p>
                ) : (
                  topPapers.map((p) => (
                    <div key={p.id} className="flex justify-between items-end border-b border-white/20 pb-2">
                      <span className="text-sm truncate pr-2">{p.title}</span>
                      <span className="font-bold text-secondary-container flex-shrink-0">{p.downloads}</span>
                    </div>
                  ))
                )}
              </div>
              <Button variant="soft" onClick={() => navigate('/mentor/analytics')} className="mt-6 w-full !bg-white !text-primary">View Full Analytics</Button>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h4 className="text-lg font-semibold mb-6">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-3">
                {QUICK_ACTIONS.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => navigate(a.to)}
                    className="flex items-center gap-3 p-4 bg-surface-container-low border border-outline-variant rounded-xl cursor-pointer hover:border-primary text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary-fixed text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined">{a.icon}</span>
                    </div>
                    <span className="text-xs font-semibold">{a.label}</span>
                  </button>
                ))}
              </div>
            </Card>
            <Card className="p-6">
              <h4 className="text-lg font-semibold mb-6">Recent Papers</h4>
              {recentPapers.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No papers published yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {recentPapers.map((p) => (
                    <div key={p.id} className="flex gap-4 items-center p-2 rounded-xl hover:bg-surface-container-low">
                      <div className="flex flex-col items-center justify-center bg-primary-fixed text-primary w-12 h-12 rounded-lg flex-shrink-0">
                        <span className="material-symbols-outlined">description</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm m-0 truncate">{p.title}</p>
                        <p className="text-xs text-on-surface-variant m-0">{p.subject} · {p.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        <aside className="lg:col-span-4 flex flex-col gap-6">
          <Card className="p-6">
            <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-6">Recent Opportunities</h4>
            {opportunities.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No opportunities posted yet.</p>
            ) : (
              <div className="flex flex-col gap-6 relative pl-3 border-l-2 border-outline-variant">
                {opportunities.slice(0, 4).map((o) => (
                  <div key={o.id} className="relative pl-4">
                    <div className={`absolute -left-[19px] top-0 w-[22px] h-[22px] rounded-full flex items-center justify-center border-4 border-surface-container-lowest ${o.status === 'Active' ? 'bg-secondary' : 'bg-outline'}`}>
                      <span className="material-symbols-outlined text-white text-xs">work</span>
                    </div>
                    <p className="text-sm m-0">{o.subject} · {o.location}</p>
                    <p className="text-[11px] text-on-surface-variant m-0">{o.status}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
