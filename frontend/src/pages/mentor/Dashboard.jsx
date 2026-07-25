import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const KPIS = [
  { icon: 'group', label: 'Total Followers', value: '12,842', trend: '12%' },
  { icon: 'history_edu', label: 'Guess Papers', value: '156', trend: '8%' },
  { icon: 'download', label: 'Downloads', value: '45.2k', trend: '24%' },
  { icon: 'verified_user', label: 'Reputation', value: '9.8/10', trend: '+0.4' },
];

const SUB_STATS = [
  { icon: 'edit_note', label: 'Practice Papers', value: '324' },
  { icon: 'favorite', label: 'Likes Received', value: '8.1k' },
  { icon: 'visibility', label: 'Profile Views', value: '112k' },
];

const MONTHS = [
  { m: 'JAN', h: 96 }, { m: 'FEB', h: 128 }, { m: 'MAR', h: 192 },
  { m: 'APR', h: 224, active: true }, { m: 'MAY', h: 160 }, { m: 'JUN', h: 208 },
];

const QUICK_ACTIONS = [
  { icon: 'upload_file', label: 'Upload Resource' },
  { icon: 'campaign', label: 'Post Notice' },
  { icon: 'mail', label: 'Direct Message' },
  { icon: 'analytics', label: 'Report Generation' },
];

const CALENDAR = [
  { date: '14', month: 'May', title: 'Science Fair Evaluation', meta: '09:00 AM · Main Hall' },
  { date: '18', month: 'May', title: 'Department Meeting', meta: '02:30 PM · Conference Rm 4' },
];

const ACTIVITY = [
  { icon: 'check_circle', title: 'Physics Paper Approved', time: '2 hours ago' },
  { icon: 'upload', title: 'New Opportunity Posted', time: '5 hours ago' },
  { icon: 'person_add', title: 'Started Following Sarah J.', time: 'Yesterday' },
];

export default function MentorDashboard() {
  const navigate = useNavigate();
  return (
    <div className="max-w-7xl w-full mx-auto px-10 py-6 box-border">
      <div className="flex justify-between items-end gap-6 flex-wrap mb-6">
        <div>
          <h2 className="font-display text-3xl font-bold m-0">Mentor Command Center</h2>
          <p className="text-on-surface-variant m-0 mt-1 max-w-xl">
            Overview of your academic influence, content performance, and upcoming institutional events.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" icon="add_circle">New Test</Button>
          <Button icon="share">Profile Link</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {KPIS.map((k) => (
          <Card key={k.label} className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <span className="material-symbols-outlined">{k.icon}</span>
              </div>
              <span className="text-secondary font-bold text-xs flex items-center gap-0.5">
                <span className="material-symbols-outlined text-base">trending_up</span>{k.trend}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant m-0">{k.label}</p>
            <h3 className="text-2xl font-bold m-0 mt-0.5">{k.value}</h3>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {SUB_STATS.map((s) => (
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
                <h4 className="text-lg font-semibold m-0">Monthly Profile Growth</h4>
                <select className="bg-surface-container-low border-none rounded-lg text-xs py-1.5 px-3">
                  <option>Last 6 Months</option>
                  <option>Last Year</option>
                </select>
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
            <Card className="md:col-span-4 p-6 bg-primary text-white border-none flex flex-col">
              <h4 className="text-lg font-semibold mb-1">Download Trend</h4>
              <p className="opacity-80 text-sm mb-6">Real-time engagement across all resources.</p>
              <div className="flex flex-col gap-4 flex-1">
                {[
                  ['Physics Mock', '+1.2k'],
                  ['Chemistry Notes', '+840'],
                  ['Math Formulae', '+2.4k'],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between items-end border-b border-white/20 pb-2">
                    <span className="text-sm">{label}</span>
                    <span className="font-bold text-secondary-container">{val}</span>
                  </div>
                ))}
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
              <h4 className="text-lg font-semibold mb-6">Academic Calendar</h4>
              <div className="flex flex-col gap-3">
                {CALENDAR.map((c) => (
                  <div key={c.title} className="flex gap-4 items-center p-2 rounded-xl hover:bg-surface-container-low">
                    <div className="flex flex-col items-center justify-center bg-primary-fixed text-primary w-12 h-12 rounded-lg flex-shrink-0">
                      <span className="text-[10px] font-bold uppercase">{c.month}</span>
                      <span className="text-lg font-bold">{c.date}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm m-0">{c.title}</p>
                      <p className="text-xs text-on-surface-variant m-0">{c.meta}</p>
                    </div>
                    <span className="material-symbols-outlined text-outline">chevron_right</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        <aside className="lg:col-span-4 flex flex-col gap-6">
          <Card className="p-6">
            <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-6">Recent Activity</h4>
            <div className="flex flex-col gap-6 relative pl-3 border-l-2 border-outline-variant">
              {ACTIVITY.map((a) => (
                <div key={a.title} className="relative pl-4">
                  <div className="absolute -left-[19px] top-0 w-[22px] h-[22px] rounded-full bg-secondary flex items-center justify-center border-4 border-surface-container-lowest">
                    <span className="material-symbols-outlined text-white text-xs">{a.icon}</span>
                  </div>
                  <p className="text-sm m-0">{a.title}</p>
                  <p className="text-[11px] text-on-surface-variant m-0">{a.time}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-6">Achievements</h4>
            <div className="flex gap-4">
              {['workspace_premium', 'military_tech', 'verified'].map((icon) => (
                <div key={icon} className="w-16 h-16 bg-primary-fixed rounded-2xl flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-2xl">{icon}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-6">Suggested for You</h4>
            <div className="flex flex-col gap-4">
              {[
                { title: 'Guest Lecture Request', meta: 'Oxford International · STEM Wing', tag: 'HIGH PRIORITY' },
                { title: 'Curriculum Design', meta: 'EduFuture Global Inc.', tag: 'FLEXIBLE' },
              ].map((s) => (
                <div key={s.title} className="p-4 bg-surface-container-low rounded-xl">
                  <p className="text-primary font-semibold text-sm m-0 mb-1">{s.title}</p>
                  <p className="text-sm m-0 mb-3">{s.meta}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container-highest px-2 py-0.5 rounded">
                      {s.tag}
                    </span>
                    <button className="bg-transparent border-none text-primary font-bold text-sm cursor-pointer">Review</button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
