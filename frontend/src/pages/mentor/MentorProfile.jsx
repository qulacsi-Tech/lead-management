import { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ProgressRing from '../../components/ui/ProgressRing';
import { Input, Textarea, Select } from '../../components/ui/Field';
import { fetchMyMentorProfile, updateMyMentorProfile, fetchMyMentorStats, ApiError } from '../../Api/Api';

const emptyProfile = {
  name: '', title: '', location: '', about: '',
  subjects: [], classes_taught: [], highlights: [],
};

function initialsOf(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'M';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function MentorProfile() {
  const [profile, setProfile] = useState(emptyProfile);
  const [draft, setDraft] = useState(emptyProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState('Available for Private Tuition');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [newSubject, setNewSubject] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [data, statsData] = await Promise.all([fetchMyMentorProfile(), fetchMyMentorStats()]);
        const loaded = {
          name: data.name || '',
          title: data.title || '',
          location: data.location || '',
          about: data.about || '',
          subjects: data.subjects || [],
          classes_taught: data.classes_taught || [],
          highlights: data.highlights || [],
        };
        setProfile(loaded);
        setDraft(loaded);
        setStatus(data.status || 'Available for Private Tuition');
        setExperienceLevel(data.experience_level || '');
        setStats(statsData);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const f = isEditing ? draft : profile;
  const setField = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));

  const addSubject = () => {
    const s = newSubject.trim();
    if (!s || draft.subjects.includes(s)) return;
    setField('subjects', [...draft.subjects, s]);
    setNewSubject('');
  };
  const removeSubject = (s) => setField('subjects', draft.subjects.filter((x) => x !== s));

  const addClass = () => setField('classes_taught', [...draft.classes_taught, { title: '', meta: '' }]);
  const updateClass = (idx, key, value) =>
    setField('classes_taught', draft.classes_taught.map((c, i) => (i === idx ? { ...c, [key]: value } : c)));
  const removeClass = (idx) => setField('classes_taught', draft.classes_taught.filter((_, i) => i !== idx));

  const addHighlight = () => setField('highlights', [...draft.highlights, { title: '', org_period: '', description: '' }]);
  const updateHighlight = (idx, key, value) =>
    setField('highlights', draft.highlights.map((h, i) => (i === idx ? { ...h, [key]: value } : h)));
  const removeHighlight = (idx) => setField('highlights', draft.highlights.filter((_, i) => i !== idx));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const updated = await updateMyMentorProfile(draft);
      const saved = {
        name: updated.name,
        title: updated.title || '',
        location: updated.location || '',
        about: updated.about || '',
        subjects: updated.subjects || [],
        classes_taught: updated.classes_taught || [],
        highlights: updated.highlights || [],
      };
      setProfile(saved);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (value) => {
    setStatus(value);
    try {
      await updateMyMentorProfile({ status: value });
    } catch {
      /* status is non-critical; local change already reflected */
    }
  };

  if (loading) {
    return <div className="max-w-7xl w-full mx-auto px-10 pb-10 box-border text-on-surface-variant">Loading profile...</div>;
  }

  const completionChecks = [
    !!profile.name, !!profile.title, !!profile.location, !!profile.about,
    profile.subjects.length > 0, profile.classes_taught.length > 0, profile.highlights.length > 0,
  ];
  const completionPercent = Math.round((completionChecks.filter(Boolean).length / completionChecks.length) * 100);

  return (
    <div className="max-w-7xl w-full mx-auto px-10 pb-10 box-border">
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-error-container text-on-error-container text-sm">{error}</div>
      )}
      <section className="relative mb-6">
        <div className="h-56 w-full rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-primary-container relative">
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
          <div className="absolute -bottom-14 left-10">
            <div className="relative">
              <div className="w-28 h-28 rounded-full border-4 border-surface shadow-lg bg-primary-fixed flex items-center justify-center text-primary text-3xl font-bold">
                {initialsOf(profile.name)}
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
                <Button variant="outline" onClick={() => { setDraft(profile); setIsEditing(false); }}>Cancel</Button>
                <Button icon="check" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
              </>
            )}
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
              <Textarea rows={5} value={draft.about} onChange={(e) => setField('about', e.target.value)} className="w-full" placeholder="Tell students about your background..." />
            ) : (
              <p className="text-on-surface-variant leading-relaxed m-0">{f.about || 'No bio added yet.'}</p>
            )}
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-8 bg-primary text-white border-none flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider opacity-80 m-0">Experience Level</h4>
                <div className="font-display text-2xl font-bold mt-2">{experienceLevel || 'Not set'}</div>
              </div>
              <p className="mt-4 opacity-90 text-sm m-0">{stats?.total_papers || 0} paper{stats?.total_papers === 1 ? '' : 's'} published so far.</p>
            </Card>
            <Card className="p-8 bg-secondary-container text-on-secondary-container border-none flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider opacity-80 m-0">Students Reached</h4>
                <div className="font-display text-4xl font-bold mt-2">{stats?.distinct_students_reached || 0}</div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <span className="material-symbols-outlined">download</span>
                <span className="text-sm font-semibold">{stats?.total_attempts || 0} total attempts</span>
              </div>
            </Card>
          </div>

          <Card className="p-8">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-xl font-semibold m-0">Subject Expertise</h3>
            </div>
            <div className="flex flex-wrap gap-3 mb-2">
              {f.subjects.length === 0 && !isEditing && (
                <p className="text-sm text-on-surface-variant m-0">No subjects added yet.</p>
              )}
              {f.subjects.map((s) => (
                <span key={s} className="px-4 py-2 bg-primary-fixed border border-outline-variant rounded-lg text-sm font-semibold flex items-center gap-2">
                  {s}
                  {isEditing && (
                    <button type="button" onClick={() => removeSubject(s)} className="bg-transparent border-none cursor-pointer text-primary flex items-center">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  )}
                </span>
              ))}
            </div>
            {isEditing && (
              <div className="flex gap-2 mt-3">
                <Input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="Add a subject" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubject(); } }} />
                <Button type="button" variant="outline" onClick={addSubject}>Add</Button>
              </div>
            )}

            <div className="flex items-center justify-between mt-8 mb-5">
              <h3 className="font-display text-xl font-semibold m-0">Classes Taught</h3>
              {isEditing && <Button type="button" variant="outline" onClick={addClass}>Add Class</Button>}
            </div>
            <div className="flex flex-col gap-3">
              {f.classes_taught.length === 0 && !isEditing && (
                <p className="text-sm text-on-surface-variant m-0">No classes added yet.</p>
              )}
              {f.classes_taught.map((c, idx) =>
                isEditing ? (
                  <div key={idx} className="flex gap-2 items-center p-3 bg-surface-container-low rounded-xl border border-outline-variant">
                    <Input value={c.title} onChange={(e) => updateClass(idx, 'title', e.target.value)} placeholder="Class title" className="flex-1" />
                    <Input value={c.meta} onChange={(e) => updateClass(idx, 'meta', e.target.value)} placeholder="e.g. Grade 12 · 12 Weeks" className="flex-1" />
                    <button type="button" onClick={() => removeClass(idx)} className="p-2 bg-transparent border-none text-error rounded-lg cursor-pointer">
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                ) : (
                  <div key={idx} className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl hover:border-primary border border-outline-variant">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary-fixed text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined">school</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold m-0">{c.title}</p>
                        <p className="text-xs text-on-surface-variant m-0">{c.meta}</p>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card className="p-6 text-center">
            <h4 className="text-sm font-semibold text-on-surface-variant mb-6">Profile Completion</h4>
            <div className="flex justify-center mb-4">
              <ProgressRing percent={completionPercent} />
            </div>
            <p className="text-xs text-on-surface-variant mb-3">
              {completionPercent === 100
                ? 'Your profile is fully complete!'
                : 'Add subjects, classes, and highlights to increase your visibility.'}
            </p>
          </Card>

          <Card className="p-6">
            <h4 className="text-sm font-semibold text-on-surface-variant mb-4">Current Status</h4>
            <Select value={status} onChange={(e) => handleStatusChange(e.target.value)}>
              <option>Available for Private Tuition</option>
              <option>In-Person Sessions Only</option>
              <option>Consultation Bookings Full</option>
              <option>On Academic Sabbatical</option>
            </Select>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-on-surface-variant m-0">Career Highlights</h4>
              {isEditing && <Button type="button" variant="outline" onClick={addHighlight}>Add</Button>}
            </div>
            {f.highlights.length === 0 && !isEditing && (
              <p className="text-xs text-on-surface-variant m-0">No highlights added yet.</p>
            )}
            {isEditing ? (
              <div className="flex flex-col gap-3">
                {f.highlights.map((h, idx) => (
                  <div key={idx} className="p-3 bg-surface-container-low rounded-xl border border-outline-variant flex flex-col gap-2">
                    <Input value={h.title} onChange={(e) => updateHighlight(idx, 'title', e.target.value)} placeholder="Role title" />
                    <Input value={h.org_period} onChange={(e) => updateHighlight(idx, 'org_period', e.target.value)} placeholder="Organization · Period" />
                    <Textarea rows={2} value={h.description} onChange={(e) => updateHighlight(idx, 'description', e.target.value)} placeholder="Description" />
                    <button type="button" onClick={() => removeHighlight(idx)} className="self-end p-1.5 bg-transparent border-none text-error rounded-lg cursor-pointer text-xs font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">delete</span>Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-6 relative pl-3 border-l-2 border-outline-variant">
                {f.highlights.map((h, idx) => (
                  <div key={idx} className="relative pl-4">
                    <div className={`absolute -left-[19px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-surface-container-lowest ${idx === 0 ? 'bg-primary' : 'bg-outline'}`} />
                    <p className="text-sm font-semibold m-0">{h.title}</p>
                    <p className="text-xs text-primary m-0 my-0.5">{h.org_period}</p>
                    <p className="text-xs text-on-surface-variant m-0">{h.description}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
