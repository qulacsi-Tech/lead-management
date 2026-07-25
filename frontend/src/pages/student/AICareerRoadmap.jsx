import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const STEPS = [
  { icon: 'check_circle', label: 'Current', value: 'Class 12', tone: 'done' },
  { icon: 'school', label: 'Active Goal', value: 'Engineering', tone: 'active' },
  { icon: 'rocket_launch', label: 'Path', value: 'JEE Entrance', tone: 'upcoming' },
  { icon: 'location_on', label: 'Target', value: 'Top Colleges', tone: 'upcoming' },
];

const COLLEGES = [
  { name: 'Indian Institute of Technology (IIT) Delhi', meta: 'Global Rank #174 · Engineering Focus' },
  { name: 'BITS Pilani', meta: 'Premier Private · Innovation Hub' },
];

const MILESTONES = [
  { label: 'Class 12 Boards', status: 'Completed', pct: 100, tone: 'done' },
  { label: 'JEE Main Phase 1', status: 'In Progress (45%)', pct: 45, tone: 'active' },
  { label: 'University Admission', status: 'Upcoming', pct: 0, tone: 'upcoming' },
];

export default function AICareerRoadmap() {
  return (
    <div className="max-w-7xl w-full mx-auto px-10 py-10 box-border">
      <section className="mb-12 flex justify-between items-end gap-6 flex-wrap">
        <div>
          <span className="text-primary font-bold tracking-wider text-xs uppercase mb-2 block">
            Career Architecture
          </span>
          <h2 className="font-display text-4xl font-bold text-primary m-0">
            Your Personalized AI Career Roadmap
          </h2>
          <p className="text-on-surface-variant text-lg max-w-2xl mt-4">
            Strategically engineered milestones designed by Nexus Intellect AI based on your current
            academic performance and engineering aspirations.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="soft">Download PDF</Button>
          <Button>Share Roadmap</Button>
        </div>
      </section>

      <Card className="p-8 mb-6 backdrop-blur">
        <h3 className="font-display text-2xl font-semibold mb-12 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">auto_graph</span>
          Academic Journey Pipeline
        </h3>
        <div className="relative flex items-center justify-between px-8 py-8">
          <div className="absolute left-0 right-0 h-1 bg-surface-container-highest rounded-full -z-10" />
          <div className="absolute left-0 w-1/2 h-1 bg-gradient-to-r from-secondary to-primary rounded-full -z-10" />
          {STEPS.map((s) => (
            <div key={s.label} className={`flex flex-col items-center gap-4 ${s.tone === 'upcoming' ? 'opacity-60' : ''}`}>
              <div
                className={`w-14 h-14 flex items-center justify-center rounded-full text-white shadow-lg ${
                  s.tone === 'done'
                    ? 'bg-secondary'
                    : s.tone === 'active'
                    ? 'bg-primary border-4 border-surface'
                    : 'bg-surface-container-highest border-2 border-outline-variant !text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined">{s.icon}</span>
              </div>
              <div className="text-center">
                <p className="text-[11px] font-semibold uppercase m-0 text-on-surface-variant">{s.label}</p>
                <p className="text-lg font-semibold m-0 mt-0.5">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <Card className="p-6 flex gap-6 items-start">
            <div className="w-24 h-24 rounded-xl bg-surface-container-high flex-shrink-0 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-4xl">domain</span>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start gap-3 flex-wrap">
                <div>
                  <h4 className="text-xl font-semibold m-0 mb-1">Premier Coaching Centers</h4>
                  <p className="text-on-surface-variant m-0">Recommended based on your location and JEE target score.</p>
                </div>
                <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold uppercase">
                  AI Top Match
                </span>
              </div>
              <div className="mt-4 flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[180px] border border-outline-variant rounded-lg p-3 cursor-pointer hover:border-primary">
                  <p className="font-bold m-0">Elite Engineering Academy</p>
                  <p className="text-xs text-on-surface-variant m-0">Success rate: 82% · 2km away</p>
                </div>
                <div className="flex-1 min-w-[180px] border border-outline-variant rounded-lg p-3 cursor-pointer hover:border-primary">
                  <p className="font-bold m-0">Nexus Prep Institute</p>
                  <p className="text-xs text-on-surface-variant m-0">Success rate: 79% · Online</p>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined">menu_book</span>
                </div>
                <h4 className="text-lg font-semibold mb-2">Subject Mastery</h4>
                <p className="text-sm text-on-surface-variant mb-4">
                  Your Physics score is 15% below target. Focus on Electromagnetism.
                </p>
              </div>
              <Button variant="secondary" icon="play_circle" size="sm">Take a Physics Mock Test</Button>
            </Card>
            <Card className="p-6 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-tertiary-container/10 text-tertiary flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined">psychology</span>
                </div>
                <h4 className="text-lg font-semibold mb-2">Aptitude Profile</h4>
                <p className="text-sm text-on-surface-variant mb-4">
                  Strong logical reasoning. Suitable for Computer Science &amp; Robotics.
                </p>
              </div>
              <Button variant="outline" size="sm">View Aptitude Report</Button>
            </Card>
          </div>

          <Card className="p-6">
            <h4 className="text-lg font-semibold mb-6">Target Engineering Colleges</h4>
            <div className="flex flex-col gap-4">
              {COLLEGES.map((c) => (
                <div key={c.name} className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg hover:bg-surface-container-high">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-surface-container-lowest rounded border border-outline-variant flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">domain</span>
                    </div>
                    <div>
                      <p className="font-bold m-0 text-sm">{c.name}</p>
                      <p className="text-[11px] text-on-surface-variant uppercase font-medium m-0 mt-0.5">{c.meta}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-outline">chevron_right</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <aside className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-primary p-6 rounded-2xl text-white relative overflow-hidden cursor-pointer">
            <h4 className="text-lg font-semibold mb-2">Start JEE Preparation</h4>
            <p className="text-sm opacity-80 mb-6">Access personalized curriculum and high-yield question banks instantly.</p>
            <div className="flex items-center gap-2 text-sm font-semibold">
              Begin Now <span className="material-symbols-outlined text-base">arrow_forward</span>
            </div>
          </div>

          <Card className="p-6 cursor-pointer">
            <div className="w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center mb-6">
              <span className="material-symbols-outlined">groups</span>
            </div>
            <h4 className="text-lg font-semibold mb-2">Find Mentors</h4>
            <p className="text-sm text-on-surface-variant mb-4">Connect with IIT alumni and professional career consultants.</p>
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full border-2 border-white bg-surface-container-highest" />
              <div className="w-8 h-8 rounded-full border-2 border-white bg-outline-variant" />
              <div className="w-8 h-8 rounded-full border-2 border-white bg-primary text-[10px] flex items-center justify-center text-white">+12</div>
            </div>
          </Card>

          <div className="bg-secondary p-6 rounded-2xl text-white relative overflow-hidden cursor-pointer">
            <h4 className="text-lg font-semibold mb-2">View Scholarships</h4>
            <p className="text-sm opacity-80 mb-6">You are eligible for 4 merit-based scholarships worth up to $10,000.</p>
            <div className="flex items-center gap-2 text-sm font-semibold">
              Check Eligibility <span className="material-symbols-outlined text-base">arrow_forward</span>
            </div>
          </div>

          <Card className="p-6">
            <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-4">Milestone Tracking</h4>
            <div className="flex flex-col gap-6">
              {MILESTONES.map((m) => (
                <div key={m.label} className={m.tone === 'upcoming' ? 'opacity-40' : ''}>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="font-bold">{m.label}</span>
                    <span className={m.tone === 'done' ? 'text-secondary' : 'text-primary'}>{m.status}</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                    <div
                      className={`h-full ${m.tone === 'done' ? 'bg-secondary' : 'bg-primary'}`}
                      style={{ width: `${m.pct}%` }}
                    />
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
