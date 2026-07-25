import { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Field';

const STATS = [
  ['#12', 'Global Ranking'], ['98%', 'Placement Rate'], ['45+', 'Partnerships'], ['24h', 'LMS Support'],
];

const COURSES = [
  { icon: 'business_center', title: 'Executive MBA', meta: '24 Months · Global Hybrid' },
  { icon: 'analytics', title: 'Data Science for Leaders', meta: '12 Months · Online Flex' },
  { icon: 'psychology', title: 'Behavioral Economics', meta: '6 Months · Campus-based' },
];

const BADGES = [
  { icon: 'military_tech', title: 'Gold Educator 2024' },
  { icon: 'public', title: 'Global Outreach' },
  { icon: 'bolt', title: 'Rapid Success' },
  { icon: 'verified_user', title: 'Trust Certified' },
];

const initialProfile = {
  name: 'Global Management Institute',
  location: 'London, United Kingdom',
  students: '15,000+ Students',
  about:
    'The Global Management Institute (GMI) is a world-renowned leader in executive education and career development. Founded in 1985, our mission is to empower the next generation of global leaders through innovative curriculum and strategic networking opportunities. We bridge the gap between traditional academia and the rapidly evolving corporate landscape.',
};

export default function InstituteProfile() {
  const [profile, setProfile] = useState(initialProfile);
  const [draft, setDraft] = useState(initialProfile);
  const [isEditing, setIsEditing] = useState(false);

  const f = isEditing ? draft : profile;
  const setField = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="max-w-7xl w-full mx-auto px-10 py-8 box-border">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 flex flex-col gap-5">
          <Card className="relative overflow-hidden">
            <div className="h-56 relative bg-gradient-to-br from-primary-container to-primary">
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
            </div>
            <div className="pt-20 px-10 pb-8 relative">
              <div className="absolute -top-16 left-10 w-32 h-32 bg-surface-container-lowest rounded-2xl shadow-lg border-4 border-surface-container-lowest flex items-center justify-center text-primary font-extrabold text-2xl">
                GMI
              </div>
              <div className="flex justify-between items-end gap-6 flex-wrap">
                {isEditing ? (
                  <div className="flex flex-col gap-2 flex-1 min-w-[260px] max-w-lg">
                    <Input value={draft.name} onChange={(e) => setField('name', e.target.value)} placeholder="Institute name" className="text-lg font-bold" />
                    <div className="flex gap-2">
                      <Input value={draft.location} onChange={(e) => setField('location', e.target.value)} placeholder="Location" />
                      <Input value={draft.students} onChange={(e) => setField('students', e.target.value)} placeholder="Student count" />
                    </div>
                  </div>
                ) : (
                  <div>
                    <h1 className="font-display text-2xl font-bold m-0 flex items-center gap-2">
                      {f.name}<span className="material-symbols-outlined text-primary text-xl">verified</span>
                    </h1>
                    <div className="flex items-center gap-5 mt-2 text-on-surface-variant text-sm">
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-base">location_on</span>{f.location}</span>
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-base">groups</span>{f.students}</span>
                    </div>
                  </div>
                )}
                <div className="flex gap-2.5">
                  <button className="px-5 py-2 border border-outline text-on-surface bg-transparent rounded-full text-sm font-semibold flex items-center gap-1.5 cursor-pointer">
                    <span className="material-symbols-outlined text-lg">share</span>Share
                  </button>
                  {!isEditing ? (
                    <Button pill icon="edit" onClick={() => { setDraft(profile); setIsEditing(true); }}>Edit Profile</Button>
                  ) : (
                    <>
                      <Button variant="outline" pill onClick={() => setIsEditing(false)}>Cancel</Button>
                      <Button variant="secondary" pill icon="check" onClick={() => { setProfile(draft); setIsEditing(false); }}>Save</Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8">
            <h2 className="text-xl font-semibold mb-4">About the Institute</h2>
            {isEditing ? (
              <Textarea rows={5} value={draft.about} onChange={(e) => setField('about', e.target.value)} className="w-full" />
            ) : (
              <p className="text-on-surface-variant leading-relaxed text-base m-0">{f.about}</p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {STATS.map(([val, label]) => (
                <div key={label} className="bg-surface-container-low rounded-xl p-4 text-center">
                  <div className="text-xl font-bold text-primary">{val}</div>
                  <div className="text-[11px] text-on-surface-variant uppercase tracking-wide mt-1">{label}</div>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card className="p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold m-0">Popular Courses</h2>
                <a href="#" className="text-primary text-sm font-semibold no-underline">View All</a>
              </div>
              <div className="space-y-4 flex flex-col gap-4">
                {COURSES.map((c) => (
                  <div key={c.title} className="flex items-center gap-4 p-3 bg-surface-container-low rounded-xl cursor-pointer hover:bg-surface-container-high">
                    <div className="w-14 h-14 rounded-xl bg-primary-fixed flex items-center justify-center text-primary flex-shrink-0">
                      <span className="material-symbols-outlined">{c.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold m-0">{c.title}</h4>
                      <p className="text-xs text-on-surface-variant m-0 mt-0.5">{c.meta}</p>
                    </div>
                    <span className="material-symbols-outlined text-outline">arrow_forward_ios</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 flex flex-col gap-4">
              <h2 className="text-lg font-semibold m-0">Academic Affiliation</h2>
              <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary-fixed flex items-center justify-center text-primary flex-shrink-0">
                  <span className="material-symbols-outlined">account_balance</span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold m-0">University of Cambridge</h3>
                  <p className="text-xs text-on-surface-variant m-0 mt-0.5 mb-2">Strategic Research &amp; Degree Partner</p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="bg-secondary-container text-on-secondary-container px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase">Accredited</span>
                    <span className="bg-primary-fixed text-primary px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase">Platinum Tier</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant italic m-0">
                "This partnership ensures our curriculum remains at the forefront of global research and ethical business practices."
              </p>
            </Card>
          </div>
        </div>

        <aside className="flex flex-col gap-5">
          <Card className="p-7 bg-gradient-to-br from-primary to-primary-container text-white border-none flex flex-col gap-5 sticky top-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] uppercase tracking-widest opacity-75">Current Plan</span>
                <h3 className="text-lg font-bold mt-1">Platinum Institutional</h3>
              </div>
              <span className="material-symbols-outlined text-3xl text-secondary-container">workspace_premium</span>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1.5"><span className="opacity-80">Remaining Credits</span><span className="font-bold">4,250 / 5,000</span></div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden"><div className="h-full w-[85%] bg-secondary-container" /></div>
            </div>
            <div className="flex justify-between py-3 border-y border-white/15">
              <div><p className="text-[10px] uppercase opacity-70 m-0">Expiry Date</p><p className="text-sm font-semibold m-0 mt-0.5">Oct 24, 2025</p></div>
              <div className="text-right"><p className="text-[10px] uppercase opacity-70 m-0">Status</p><p className="text-sm font-bold text-secondary-container m-0 mt-0.5">● Active</p></div>
            </div>
            <button className="w-full py-3.5 bg-white text-primary rounded-lg font-bold text-sm cursor-pointer border-none flex items-center justify-center gap-2">
              Upgrade Plan<span className="material-symbols-outlined text-lg">rocket_launch</span>
            </button>
            <p className="text-[10px] opacity-60 text-center m-0">Auto-renewal active. Manage in billing.</p>
          </Card>

          <Card className="p-5">
            <h4 className="text-sm font-semibold mb-4">Achievement Badges</h4>
            <div className="flex flex-wrap gap-3">
              {BADGES.map((b) => (
                <div key={b.title} title={b.title} className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">{b.icon}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 flex flex-col gap-3.5 bg-surface-container-high border-none">
            <div className="flex items-center gap-2.5"><span className="material-symbols-outlined text-primary">support_agent</span><span className="text-sm font-semibold">Account Manager</span></div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-outline-variant" />
              <div><p className="text-sm font-semibold m-0">Sarah Jenkins</p><p className="text-[11px] text-on-surface-variant m-0">Available Mon–Fri</p></div>
            </div>
            <button className="w-full py-2.5 bg-surface-container-lowest text-primary border border-primary rounded-lg text-sm font-semibold cursor-pointer">
              Schedule Call
            </button>
          </Card>
        </aside>
      </div>
    </div>
  );
}
