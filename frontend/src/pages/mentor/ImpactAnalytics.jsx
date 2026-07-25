import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Card from '../../components/ui/Card';

const MONTHS = [
  { m: 'Jan', h: 45 }, { m: 'Feb', h: 60 }, { m: 'Mar', h: 55 },
  { m: 'Apr', h: 85 }, { m: 'May', h: 70 }, { m: 'Jun', h: 95, active: true },
];

export default function ImpactAnalytics() {
  const { displayName } = useAuth();
  const { leadsFor } = useData();
  const referrals = leadsFor(displayName);
  const verified = referrals.filter((r) => r.status === 'verified' || r.status === 'converted').length;
  const impactScore = Math.min(100, 60 + verified * 8);

  return (
    <div className="max-w-4xl w-full mx-auto px-10 py-8 box-border">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-primary m-0">Mentor Impact Analytics</h2>
        <p className="text-on-surface-variant m-0 mt-1">How your postings and referrals are performing over time.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-6 bg-primary text-white border-none">
          <h4 className="text-xs font-semibold opacity-80 mb-2">Impact Score</h4>
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-extrabold">{impactScore}</span><span className="text-sm opacity-70">/ 100</span>
          </div>
        </Card>
        <Card className="p-6">
          <h4 className="text-xs font-semibold text-on-surface-variant mb-2 uppercase">Referrals Submitted</h4>
          <span className="text-3xl font-bold text-primary">{referrals.length}</span>
        </Card>
        <Card className="p-6">
          <h4 className="text-xs font-semibold text-on-surface-variant mb-2 uppercase">Verified / Converted</h4>
          <span className="text-3xl font-bold text-secondary">{verified}</span>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-lg font-semibold m-0">Monthly Profile Growth</h3>
        </div>
        <div className="h-56 flex items-end justify-between gap-2 px-2 border-b border-outline-variant pb-6">
          {MONTHS.map((m) => (
            <div key={m.m} className="flex-1 flex flex-col items-center gap-2">
              <div
                className={`w-full rounded-t-lg ${m.active ? 'bg-primary' : 'bg-surface-container-highest'}`}
                style={{ height: `${m.h}px` }}
              />
              <span className={`text-[10px] font-bold ${m.active ? 'text-on-surface' : 'text-on-surface-variant'}`}>{m.m}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
