import { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ProgressRing from '../../components/ui/ProgressRing';
import { Input, Textarea, Select } from '../../components/ui/Field';

const SUBJECTS = ['Advanced Calculus', 'Quantum Physics', 'Machine Learning Foundations', 'Linear Algebra', 'Data Engineering', 'Probability Theory'];

const CLASSES = [
  { icon: 'science', title: 'Intro to Particle Physics', meta: 'Undergraduate Level · 12 Weeks' },
  { icon: 'data_object', title: 'Data Structures & Algorithms', meta: 'Graduate Level · Intensive Boot Camp' },
];

const initialProfile = {
  name: 'Dr. Aris Thorne',
  title: 'Ph.D. in Theoretical Physics & Data Science',
  location: 'San Francisco, CA',
  about:
    'With over 12 years of experience in both academia and the private sector, I specialize in bridging the gap between complex mathematical theory and practical data science applications. My teaching philosophy focuses on intuitive understanding and first-principles thinking, ensuring students not only learn the formulas but master the underlying logic. I have mentored over 500+ professionals and students globally.',
};

export default function MentorProfile() {
  const [profile, setProfile] = useState(initialProfile);
  const [draft, setDraft] = useState(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState('Available for Private Tuition');
  const [following, setFollowing] = useState(false);

  const f = isEditing ? draft : profile;
  const setField = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="max-w-7xl w-full mx-auto px-10 pb-10 box-border">
      <section className="relative mb-6">
        <div className="h-56 w-full rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-primary-container relative">
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
          <button className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-lg text-xs font-semibold border border-outline-variant flex items-center gap-1.5 cursor-pointer">
            <span className="material-symbols-outlined text-base">edit_square</span>Edit Cover
          </button>
          <div className="absolute -bottom-14 left-10">
            <div className="relative">
              <div className="w-28 h-28 rounded-full border-4 border-surface shadow-lg bg-primary-fixed flex items-center justify-center text-primary text-3xl font-bold">
                AT
              </div>
              <div className="absolute bottom-1 right-1 bg-secondary-container text-on-secondary-container p-1 rounded-full border-2 border-surface flex">
                <span className="material-symbols-outlined text-base">verified</span>
              </div>
            </div>
          </div>
        </div>
        <div className="pt-16 flex items-start justify-between gap-6 flex-wrap">
          {isEditing ? (
            <div className="flex flex-col gap-2 flex-1 min-w-[260px] max-w-md">
              <Input value={draft.name} onChange={(e) => setField('name', e.target.value)} placeholder="Full name" className="text-lg font-bold" />
              <Input value={draft.title} onChange={(e) => setField('title', e.target.value)} placeholder="Title" />
              <Input value={draft.location} onChange={(e) => setField('location', e.target.value)} placeholder="Location" />
            </div>
          ) : (
            <div>
              <h2 className="font-display text-2xl font-bold m-0">{f.name}</h2>
              <p className="text-primary m-0 mt-0.5">{f.title}</p>
              <div className="flex items-center gap-1.5 text-on-surface-variant mt-1">
                <span className="material-symbols-outlined text-base">location_on</span>
                <span className="text-sm">{f.location}</span>
              </div>
            </div>
          )}
          <div className="flex gap-3">
            {!isEditing ? (
              <Button variant="soft" icon="edit" onClick={() => { setDraft(profile); setIsEditing(true); }}>
                Edit Profile
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button icon="check" onClick={() => { setProfile(draft); setIsEditing(false); }}>Save</Button>
              </>
            )}
            <button className="p-3 bg-surface-container-lowest border border-outline-variant rounded-xl cursor-pointer">
              <span className="material-symbols-outlined">share</span>
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <Card className="p-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">person_search</span>
              <h3 className="font-display text-xl font-semibold m-0">About Me</h3>
            </div>
            {isEditing ? (
              <Textarea rows={5} value={draft.about} onChange={(e) => setField('about', e.target.value)} className="w-full" />
            ) : (
              <p className="text-on-surface-variant leading-relaxed m-0">{f.about}</p>
            )}
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-8 bg-primary text-white border-none flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider opacity-80 m-0">Experience</h4>
                <div className="font-display text-4xl font-bold mt-2">12+ <span className="text-lg">Years</span></div>
              </div>
              <p className="mt-4 opacity-90 text-sm m-0">Expertise across Quantum Mechanics, Statistical Modeling, and Neural Networks.</p>
            </Card>
            <Card className="p-8 bg-secondary-container text-on-secondary-container border-none flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider opacity-80 m-0">Students Taught</h4>
                <div className="font-display text-4xl font-bold mt-2">5.2k</div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <span className="material-symbols-outlined">grade</span>
                <span className="text-sm font-semibold">4.9/5.0 Average Rating</span>
              </div>
            </Card>
          </div>

          <Card className="p-8">
            <h3 className="font-display text-xl font-semibold mb-5">Subject Expertise</h3>
            <div className="flex flex-wrap gap-3">
              {SUBJECTS.map((s) => (
                <span key={s} className="px-4 py-2 bg-primary-fixed border border-outline-variant rounded-lg text-sm font-semibold">
                  {s}
                </span>
              ))}
            </div>
            <h3 className="font-display text-xl font-semibold mt-8 mb-5">Classes Taught</h3>
            <div className="flex flex-col gap-3">
              {CLASSES.map((c) => (
                <div key={c.title} className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl hover:border-primary border border-outline-variant">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary-fixed text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined">{c.icon}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold m-0">{c.title}</p>
                      <p className="text-xs text-on-surface-variant m-0">{c.meta}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-outline">chevron_right</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card className="p-6 text-center">
            <h4 className="text-sm font-semibold text-on-surface-variant mb-6">Profile Completion</h4>
            <div className="flex justify-center mb-4">
              <ProgressRing percent={85} />
            </div>
            <p className="text-xs text-on-surface-variant mb-3">
              Complete your "Awards" section to reach 100% visibility.
            </p>
            <button className="bg-transparent border-none text-primary font-semibold text-sm cursor-pointer">
              Complete Profile
            </button>
          </Card>

          <Card className="p-6">
            <h4 className="text-sm font-semibold text-on-surface-variant mb-4">Current Status</h4>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>Available for Private Tuition</option>
              <option>In-Person Sessions Only</option>
              <option>Consultation Bookings Full</option>
              <option>On Academic Sabbatical</option>
            </Select>
            <div className="flex items-center gap-2 bg-secondary-container/30 text-on-secondary-container px-3 py-2.5 rounded-lg mt-3 text-sm font-semibold">
              <span className="material-symbols-outlined text-base">circle</span>Replies within 2 hours
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h4 className="text-2xl font-bold m-0">2.4k</h4>
                <p className="text-xs text-on-surface-variant m-0">Followers</p>
              </div>
              <div className="flex -space-x-2">
                <div className="w-10 h-10 rounded-full border-2 border-surface-container-lowest bg-surface-container-highest" />
                <div className="w-10 h-10 rounded-full border-2 border-surface-container-lowest bg-primary-fixed" />
                <div className="w-10 h-10 rounded-full border-2 border-surface-container-lowest bg-primary text-white text-[10px] font-bold flex items-center justify-center">+2k</div>
              </div>
            </div>
            <Button
              variant={following ? 'secondary' : 'primary'}
              icon={following ? 'check' : 'person_add'}
              className="w-full"
              onClick={() => setFollowing((v) => !v)}
            >
              {following ? 'Following' : 'Follow Mentor'}
            </Button>
          </Card>

          <Card className="p-6">
            <h4 className="text-sm font-semibold text-on-surface-variant mb-6">Career Highlights</h4>
            <div className="flex flex-col gap-6 relative pl-3 border-l-2 border-outline-variant">
              <div className="relative pl-4">
                <div className="absolute -left-[19px] top-0.5 w-3.5 h-3.5 rounded-full bg-primary border-2 border-surface-container-lowest" />
                <p className="text-sm font-semibold m-0">Senior Research Lead</p>
                <p className="text-xs text-primary m-0 my-0.5">Nexus Intellect Corp · 2021–Present</p>
                <p className="text-xs text-on-surface-variant m-0">Leading data strategy for global education platforms.</p>
              </div>
              <div className="relative pl-4">
                <div className="absolute -left-[19px] top-0.5 w-3.5 h-3.5 rounded-full bg-outline border-2 border-surface-container-lowest" />
                <p className="text-sm font-semibold m-0">Assistant Professor</p>
                <p className="text-xs text-on-surface-variant m-0 my-0.5">Stanford University · 2018–2021</p>
                <p className="text-xs text-on-surface-variant m-0">Taught Graduate Quantum Mechanics and Applied Algebra.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
