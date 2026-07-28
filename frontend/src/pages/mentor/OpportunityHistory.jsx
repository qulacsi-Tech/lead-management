import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { fetchMyOpportunities, updateOpportunity, ApiError } from '../../Api/Api';

const TONE_CLASSES = {
  success: 'bg-secondary-container text-on-secondary-container',
  primary: 'bg-primary-fixed text-primary',
  neutral: 'bg-surface-container-highest text-on-surface-variant',
};

function statusMeta(status) {
  if (status === 'verified') return { label: 'Verified', tone: 'success', icon: 'check_circle' };
  if (status === 'converted') return { label: 'Converted', tone: 'success', icon: 'check_circle' };
  if (status === 'hot' || status === 'interested') return { label: 'Under Review', tone: 'primary', icon: 'pending' };
  return { label: 'Pending', tone: 'primary', icon: 'pending' };
}

export default function OpportunityHistory() {
  const { displayName } = useAuth();
  const { leadsFor } = useData();
  const referrals = leadsFor(displayName);

  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchMyOpportunities();
      setOpportunities(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load job postings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleToggleStatus = async (o) => {
    try {
      const nextStatus = o.status === 'Active' ? 'Closed' : 'Active';
      await updateOpportunity(o.id, { status: nextStatus });
      setOpportunities((prev) => prev.map((p) => (p.id === o.id ? { ...p, status: nextStatus } : p)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update status.');
    }
  };

  return (
    <div className="max-w-4xl w-full mx-auto px-10 py-8 box-border">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-primary m-0">Opportunity Status History</h2>
        <p className="text-on-surface-variant m-0 mt-1">Full history of your job posts and college referrals.</p>
      </div>

      {referrals.length > 0 && (
        <Card className="overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-outline-variant">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wide m-0">Your College Referrals</h3>
          </div>
          {referrals.map((r) => {
            const meta = statusMeta(r.status);
            return (
              <div key={r.id} className="px-6 py-4 flex items-center justify-between border-t border-outline-variant">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${TONE_CLASSES[meta.tone]}`}>
                    <span className="material-symbols-outlined">{meta.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold m-0">{r.name} · {r.course}</p>
                    <p className="text-xs text-on-surface-variant m-0">Submitted {new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full ${TONE_CLASSES[meta.tone]}`}>
                  {meta.label}
                </span>
              </div>
            );
          })}
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant">
          <h3 className="text-xs font-bold text-primary uppercase tracking-wide m-0">Job Postings</h3>
        </div>
        {loading ? (
          <p className="px-6 py-4 text-sm text-on-surface-variant m-0">Loading...</p>
        ) : error ? (
          <p className="px-6 py-4 text-sm text-error m-0">{error}</p>
        ) : opportunities.length === 0 ? (
          <p className="px-6 py-4 text-sm text-on-surface-variant m-0">No job postings yet.</p>
        ) : (
          opportunities.map((o) => (
            <div key={o.id} className="px-6 py-4 flex items-center justify-between border-t border-outline-variant">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${o.status === 'Active' ? TONE_CLASSES.success : TONE_CLASSES.neutral}`}>
                  <span className="material-symbols-outlined">{o.status === 'Active' ? 'check_circle' : 'cancel'}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold m-0">{o.subject}</p>
                  <p className="text-xs text-on-surface-variant m-0">{o.location} · {o.employment_type} · Posted {new Date(o.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full ${o.status === 'Active' ? TONE_CLASSES.success : TONE_CLASSES.neutral}`}>
                  {o.status}
                </span>
                <Button variant="outline" onClick={() => handleToggleStatus(o)}>
                  {o.status === 'Active' ? 'Close' : 'Reopen'}
                </Button>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
