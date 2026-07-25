import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import ProgressRing from '../../components/ui/ProgressRing';
import Button from '../../components/ui/Button';

const BASE_KPIS = [
  { icon: 'download', iconBg: 'rgba(0,55,112,0.1)', iconColor: 'var(--color-primary)', label: 'Guess Papers', value: '24', trend: '+12%' },
  { icon: 'task_alt', iconBg: 'rgba(0,108,74,0.1)', iconColor: 'var(--color-secondary)', label: 'Papers Solved', value: '18', trend: '+5' },
  { icon: 'group', iconBg: 'rgba(0,75,164,0.1)', iconColor: 'var(--color-tertiary-container)', label: 'Mentors Following', value: '12' },
];

const CHART = [
  { day: 'Mon', h: 40 }, { day: 'Tue', h: 65 }, { day: 'Wed', h: 50 },
  { day: 'Thu', h: 85, highlight: true }, { day: 'Fri', h: 45 }, { day: 'Sat', h: 70 }, { day: 'Sun', h: 95 },
];

const EXAMS = [
  { name: 'Data Structures', when: 'In 2 days', tone: 'error', label: 'Critical' },
  { name: 'Network Security', when: 'In 1 week', tone: 'primary', label: 'Medium' },
];

export default function StudentDashboard() {
  const { displayName } = useAuth();
  const { leadsFor } = useData();
  const name = displayName || 'Student';
  const myLeads = leadsFor(displayName);
  const pointsTotal = myLeads.reduce((sum, l) => sum + l.points, 0);
  const KPIS = [
    ...BASE_KPIS,
    { icon: 'send', iconBg: 'rgba(186,26,26,0.1)', iconColor: 'var(--color-error)', label: 'Leads Posted', value: String(myLeads.length).padStart(2, '0') },
  ];

  return (
    <div className="max-w-7xl w-full mx-auto px-10 py-6 box-border">
      <div className="mb-6">
        <h2 className="font-display text-3xl font-bold text-primary m-0">Welcome Back, {name}!</h2>
        <p className="text-lg text-on-surface-variant m-0 mt-1">
          Ready for your next move? Your learning streak is looking strong today.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {KPIS.map((k) => (
          <StatCard key={k.label} {...k} />
        ))}
        <Card className="p-4 bg-gradient-to-br from-primary to-primary-container text-on-primary border-none">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center mb-3">
            <span className="material-symbols-outlined">stars</span>
          </div>
          <p className="text-xs opacity-80 m-0">Reward Points</p>
          <h3 className="text-2xl font-bold m-0">{pointsTotal} pts</h3>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="font-display text-xl font-semibold m-0">Learning Progress</h4>
                <p className="text-xs text-on-surface-variant m-0 mt-0.5">Activity tracked over the last 7 days</p>
              </div>
              <select className="bg-surface-container-low border-none rounded-lg text-xs py-1.5 px-3">
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
            </div>
            <div className="h-56 flex items-end justify-between gap-4 px-2">
              {CHART.map((c) => (
                <div key={c.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div
                    className={`w-full rounded-t-lg ${c.highlight ? 'bg-primary' : 'bg-primary/20'}`}
                    style={{ height: `${c.h}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 text-[10px] text-on-surface-variant uppercase font-bold tracking-wider px-2">
              {CHART.map((c) => <span key={c.day}>{c.day}</span>)}
            </div>
          </Card>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-display text-xl font-semibold m-0">Recommended for You</h4>
              <button className="bg-transparent border-none text-primary text-sm cursor-pointer hover:underline">View All</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Card className="overflow-hidden">
                <div className="h-32 bg-surface-container-highest relative">
                  <span className="absolute top-3 left-3 bg-white/90 px-2 py-1 rounded-md text-[10px] font-bold text-primary">
                    GUESS PAPER
                  </span>
                </div>
                <div className="p-4">
                  <h5 className="text-sm font-semibold m-0 mb-1">Advanced Macroeconomics 2024</h5>
                  <p className="text-xs text-on-surface-variant m-0 mb-4">By Prof. Sarah Miller · 150 Students</p>
                  <Button variant="soft" size="sm" className="w-full">Download PDF</Button>
                </div>
              </Card>
              <Card className="overflow-hidden">
                <div className="h-32 bg-secondary/10 relative">
                  <span className="absolute top-3 left-3 bg-secondary text-on-secondary px-2 py-1 rounded-md text-[10px] font-bold">
                    TOP MENTOR
                  </span>
                </div>
                <div className="p-4">
                  <h5 className="text-sm font-semibold m-0 mb-1">Dr. Michael Chen</h5>
                  <p className="text-xs text-on-surface-variant m-0 mb-4">Expert in Quantum Physics &amp; Maths</p>
                  <Button variant="secondary" size="sm" className="w-full">Follow Mentor</Button>
                </div>
              </Card>
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card className="p-6 text-center">
            <h4 className="text-sm text-on-surface-variant mb-6">Daily Learning Goal</h4>
            <div className="flex justify-center mb-3">
              <ProgressRing percent={75} />
            </div>
            <p className="text-xs text-on-surface-variant m-0">3h 45m of 5h goal</p>
          </Card>

          <Card className="p-6 flex items-center justify-between bg-gradient-to-r from-secondary to-secondary-container text-on-secondary border-none">
            <div>
              <p className="text-xs opacity-80 m-0 mb-1">Current Streak</p>
              <h4 className="font-display text-xl font-bold m-0">5 Days</h4>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">local_fire_department</span>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-error">event_upcoming</span>
              <h4 className="text-sm font-semibold m-0">Upcoming Exams</h4>
            </div>
            <div className="flex flex-col gap-4">
              {EXAMS.map((ex) => (
                <div
                  key={ex.name}
                  className={`flex items-center justify-between border-l-4 pl-3 ${
                    ex.tone === 'error' ? 'border-error' : 'border-primary'
                  }`}
                >
                  <div>
                    <p className="text-sm m-0">{ex.name}</p>
                    <p className="text-[10px] text-on-surface-variant m-0">{ex.when}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded ${
                      ex.tone === 'error'
                        ? 'bg-error-container text-on-error-container'
                        : 'bg-primary-fixed text-primary'
                    }`}
                  >
                    {ex.label}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h4 className="text-sm font-semibold mb-3">Recent Badges</h4>
            <div className="flex flex-wrap gap-3">
              {['military_tech', 'timer', 'auto_awesome'].map((icon) => (
                <div key={icon} className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">{icon}</span>
                </div>
              ))}
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-outline-variant flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">add</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
