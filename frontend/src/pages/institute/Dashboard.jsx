import Card from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

const BASE_KPIS = [
  { icon: 'person_search', label: 'Candidate Profiles', value: '452', trend: '+5%', up: true },
  { icon: 'favorite', label: 'Total Likes', value: '8.2k', trend: '-2%', up: false },
  { icon: 'visibility', label: 'Profile Views', value: '15.4k', trend: '+24%', up: true },
];

const MONTHS = [
  { m: 'Jan', h: 45 }, { m: 'Feb', h: 60 }, { m: 'Mar', h: 55 },
  { m: 'Apr', h: 85 }, { m: 'May', h: 70 }, { m: 'Jun', h: 95, active: true },
];

const ACTIVITIES = [
  { bold: '50 New Leads', rest: 'purchased for Engineering block', time: '2 hours ago', icon: 'shopping_cart', tone: 'bg-primary text-white' },
  { bold: 'New Candidate', rest: 'profile view: Sarah Jenkins', time: '4 hours ago', icon: 'person_add', tone: 'bg-secondary-container text-on-secondary-container' },
  { bold: 'Verification Successful', rest: 'for Institutional ID', time: 'Yesterday, 11:30 AM', icon: 'verified', tone: 'bg-primary-fixed text-primary' },
  { bold: 'Email Campaign', rest: "'Autumn Intake' sent to 200 leads", time: 'Yesterday, 09:15 AM', icon: 'mail', tone: 'bg-surface-container-highest text-on-surface-variant' },
  { bold: 'Wallet Recharged', rest: 'with $500 credits', time: 'Oct 12, 2023', icon: 'account_balance_wallet', tone: 'bg-error-container text-on-error-container' },
];

export default function InstituteDashboard() {
  const { displayName } = useAuth();
  const { unlockedLeadsFor } = useData();
  const purchased = unlockedLeadsFor(displayName);
  const converted = purchased.filter((l) => l.status === 'converted').length;
  const KPIS = [
    { icon: 'sell', label: 'Total Purchased Leads', value: String(purchased.length), trend: purchased.length ? `${converted} converted` : '', up: true },
    ...BASE_KPIS,
  ];
  return (
    <div className="max-w-7xl w-full mx-auto px-10 py-8 box-border">
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {KPIS.map((k) => (
          <Card key={k.label} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-primary/10 rounded-xl text-primary">
                <span className="material-symbols-outlined">{k.icon}</span>
              </div>
              <span className={`flex items-center gap-0.5 font-semibold text-xs ${k.up ? 'text-secondary' : 'text-error'}`}>
                {k.trend}<span className="material-symbols-outlined text-base">{k.up ? 'trending_up' : 'trending_down'}</span>
              </span>
            </div>
            <h3 className="text-xs text-on-surface-variant uppercase tracking-wide m-0 mb-2">{k.label}</h3>
            <p className="text-3xl font-bold text-primary m-0">{k.value}</p>
          </Card>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-lg font-semibold m-0">Monthly Growth</h2>
                <p className="text-sm text-on-surface-variant m-0 mt-1">Acquisition trend over the last 6 months</p>
              </div>
              <select className="bg-surface-container-low border border-outline-variant rounded-lg text-xs py-2 px-3">
                <option>Last 6 Months</option><option>Last Year</option>
              </select>
            </div>
            <div className="h-56 flex items-end justify-between gap-3 px-2">
              {MONTHS.map((m) => (
                <div key={m.m} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className={`w-full rounded-t-lg ${m.active ? 'bg-primary shadow-lg' : 'bg-primary-fixed'}`}
                    style={{ height: `${m.h}%` }}
                  />
                  <span className={`text-xs ${m.active ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>{m.m}</span>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 flex flex-col items-center">
              <h3 className="text-lg font-semibold w-full m-0 mb-5">Lead Status</h3>
              <div className="relative w-44 h-44 mb-5">
                <svg width="176" height="176" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r="16" fill="transparent" stroke="var(--color-surface-container-highest)" strokeWidth="4" />
                  <circle cx="18" cy="18" r="16" fill="transparent" stroke="var(--color-primary)" strokeDasharray="60,100" strokeWidth="4" />
                  <circle cx="18" cy="18" r="16" fill="transparent" stroke="var(--color-secondary)" strokeDasharray="25,100" strokeDashoffset="-60" strokeWidth="4" />
                  <circle cx="18" cy="18" r="16" fill="transparent" stroke="var(--color-error)" strokeDasharray="15,100" strokeDashoffset="-85" strokeWidth="4" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">82%</span>
                  <span className="text-[11px] text-on-surface-variant uppercase">Conversion</span>
                </div>
              </div>
              <div className="w-full flex flex-col gap-2.5 text-sm">
                {[['Qualified', 'bg-primary', '60%'], ['Enrolled', 'bg-secondary', '25%'], ['Lost', 'bg-error', '15%']].map(([label, dot, pct]) => (
                  <div key={label} className="flex justify-between">
                    <span className="flex items-center gap-2"><span className={`w-2.5 h-2.5 rounded-full ${dot}`} />{label}</span>
                    <span>{pct}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="relative overflow-hidden min-h-[280px] flex flex-col justify-end bg-gradient-to-br from-primary to-primary-container">
              <div className="p-6 relative z-10">
                <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-semibold inline-block mb-3">
                  Top Candidate
                </span>
                <h4 className="text-white text-xl font-semibold m-0 mb-1">Alex Rivera</h4>
                <p className="text-primary-fixed text-sm m-0 mb-4">Masters in Data Science Potential</p>
                <button className="w-full bg-white text-primary py-2.5 rounded-lg font-semibold text-sm cursor-pointer border-none">
                  View Full Profile
                </button>
              </div>
            </Card>
          </div>
        </div>

        <aside className="lg:col-span-4 flex flex-col gap-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold m-0">Recent Activities</h2>
              <button className="bg-transparent border-none text-primary font-semibold text-sm cursor-pointer">View All</button>
            </div>
            <div className="flex flex-col gap-5 relative pl-3 border-l-2 border-outline-variant">
              {ACTIVITIES.map((a) => (
                <div key={a.bold} className="relative pl-4">
                  <div className={`absolute -left-[19px] top-0 w-[22px] h-[22px] rounded-full flex items-center justify-center border-4 border-surface-container-lowest ${a.tone}`}>
                    <span className="material-symbols-outlined text-xs">{a.icon}</span>
                  </div>
                  <p className="text-sm m-0"><strong>{a.bold}</strong> {a.rest}</p>
                  <p className="text-[11px] text-outline m-0 mt-0.5">{a.time}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-primary text-white border-none">
            <h4 className="text-lg font-semibold m-0 mb-2">Premium Perks</h4>
            <p className="text-primary-fixed text-sm m-0 mb-4">Unlock advanced analytics and bulk export features.</p>
            <button className="w-full bg-white text-primary py-2.5 rounded-lg font-semibold text-sm cursor-pointer border-none">
              Learn More
            </button>
          </Card>
        </aside>
      </div>
    </div>
  );
}
