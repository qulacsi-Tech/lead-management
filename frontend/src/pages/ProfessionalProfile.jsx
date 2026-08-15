import { useEffect, useRef, useState } from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Input, Textarea, FormGroup } from '../components/ui/Field';
import { useSession } from '../context/useSession';
import { ApiError } from '../Api/Api';
import PageHeader from './PageHeader';

// Account Setup (role/category switching) is paused per client feedback
// 12 Aug 2026 — see docs/CLIENT_FEEDBACK_2026-08-12.md, Section 1. Removed
// from the tab list; git history has the component if it comes back.
const TABS = [
  { key: 'overview', label: 'Overview', icon: 'person' },
  { key: 'experience', label: 'Experience & Skills', icon: 'work_history' },
  { key: 'resume', label: 'Resume & Contact', icon: 'description' },
];

const EDITABLE_FIELDS = ['name', 'phone', 'headline', 'about'];

function toFormState(profile) {
  const base = {};
  EDITABLE_FIELDS.forEach((f) => { base[f] = profile?.[f] || ''; });
  base.subjects = profile?.subjects || [];
  base.skills = profile?.skills || [];
  base.education = profile?.education || {};
  base.work_experience = profile?.work_experience || [];
  return base;
}

// Progressive disclosure: each field only appears once the one before it is
// filled, and Graduation/Post-Graduation are explicitly optional — someone
// who started working after 12th shouldn't be forced through them. See
// docs/CLIENT_FEEDBACK_2026-08-12.md, Section 3.
function EducationEditor({ value, onChange }) {
  const edu = value || {};
  const set = (patch) => onChange({ ...edu, ...patch });
  const hasGraduation = edu.graduation != null;
  const hasPostGraduation = edu.post_graduation != null;

  return (
    <div className="space-y-4">
      <FormGroup label="10th Passing Year">
        <Input
          className="max-w-[180px]"
          value={edu.tenth_year || ''}
          onChange={(e) => set({ tenth_year: e.target.value })}
          placeholder="e.g. 2010"
        />
      </FormGroup>

      {edu.tenth_year && (
        <FormGroup label="12th Passing Year">
          <Input
            className="max-w-[180px]"
            value={edu.twelfth_year || ''}
            onChange={(e) => set({ twelfth_year: e.target.value })}
            placeholder="e.g. 2012"
          />
        </FormGroup>
      )}

      {edu.twelfth_year && (
        <FormGroup label="Did you pursue graduation?">
          <div className="flex gap-2">
            <Button
              type="button" size="sm"
              variant={hasGraduation ? 'primary' : 'outline'}
              onClick={() => set({ graduation: edu.graduation || { college: '', course: '', year: '' } })}
            >
              Yes
            </Button>
            <Button
              type="button" size="sm"
              variant={!hasGraduation ? 'primary' : 'outline'}
              onClick={() => set({ graduation: null, post_graduation: null })}
            >
              No
            </Button>
          </div>
        </FormGroup>
      )}

      {hasGraduation && (
        <div className="pl-4 border-l-2 border-outline-variant space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <FormGroup label="College / University">
              <Input
                value={edu.graduation.college || ''}
                onChange={(e) => set({ graduation: { ...edu.graduation, college: e.target.value } })}
              />
            </FormGroup>
            <FormGroup label="Course">
              <Input
                value={edu.graduation.course || ''}
                onChange={(e) => set({ graduation: { ...edu.graduation, course: e.target.value } })}
                placeholder="e.g. B.Com"
              />
            </FormGroup>
          </div>
          <FormGroup label="Passing Year">
            <Input
              className="max-w-[180px]"
              value={edu.graduation.year || ''}
              onChange={(e) => set({ graduation: { ...edu.graduation, year: e.target.value } })}
              placeholder="e.g. 2015"
            />
          </FormGroup>

          {edu.graduation.year && (
            <FormGroup label="Did you pursue post-graduation?">
              <div className="flex gap-2">
                <Button
                  type="button" size="sm"
                  variant={hasPostGraduation ? 'primary' : 'outline'}
                  onClick={() => set({ post_graduation: edu.post_graduation || { college: '', course: '', year: '' } })}
                >
                  Yes
                </Button>
                <Button
                  type="button" size="sm"
                  variant={!hasPostGraduation ? 'primary' : 'outline'}
                  onClick={() => set({ post_graduation: null })}
                >
                  No
                </Button>
              </div>
            </FormGroup>
          )}

          {hasPostGraduation && (
            <div className="pl-4 border-l-2 border-outline-variant space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <FormGroup label="College / University">
                  <Input
                    value={edu.post_graduation.college || ''}
                    onChange={(e) => set({ post_graduation: { ...edu.post_graduation, college: e.target.value } })}
                  />
                </FormGroup>
                <FormGroup label="Course">
                  <Input
                    value={edu.post_graduation.course || ''}
                    onChange={(e) => set({ post_graduation: { ...edu.post_graduation, course: e.target.value } })}
                    placeholder="e.g. MBA"
                  />
                </FormGroup>
              </div>
              <FormGroup label="Passing Year">
                <Input
                  className="max-w-[180px]"
                  value={edu.post_graduation.year || ''}
                  onChange={(e) => set({ post_graduation: { ...edu.post_graduation, year: e.target.value } })}
                  placeholder="e.g. 2017"
                />
              </FormGroup>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function emptyExperience() {
  return {
    id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    company: '', designation: '', joining_date: '', leaving_date: '', location: '', industry: '', is_current: false,
  };
}

// A career doesn't have to be education-sector-only — this is a generic,
// repeatable work-history list (any industry), not a teaching-jobs-only
// field. See docs/CLIENT_FEEDBACK_2026-08-12.md, Sections 2 & 4.
function WorkExperienceEditor({ value, onChange }) {
  const list = value || [];
  const update = (id, patch) => onChange(list.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const remove = (id) => onChange(list.filter((x) => x.id !== id));
  const add = () => onChange([...list, emptyExperience()]);

  return (
    <div className="space-y-3">
      {list.length === 0 && (
        <p className="text-xs text-on-surface-variant mb-0">No work experience added yet.</p>
      )}
      {list.map((exp, idx) => (
        <Card key={exp.id} className="p-4 bg-surface-container-low">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-0">
              {idx === 0 ? 'Most Recent' : `Experience ${idx + 1}`}
            </p>
            <button
              type="button"
              onClick={() => remove(exp.id)}
              className="text-error text-xs font-semibold cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span> Remove
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <FormGroup label="Company / Organization">
              <Input value={exp.company} onChange={(e) => update(exp.id, { company: e.target.value })} />
            </FormGroup>
            <FormGroup label="Designation">
              <Input value={exp.designation} onChange={(e) => update(exp.id, { designation: e.target.value })} />
            </FormGroup>
            <FormGroup label="Industry">
              <Input
                value={exp.industry}
                onChange={(e) => update(exp.id, { industry: e.target.value })}
                placeholder="e.g. FMCG, IT, Education"
              />
            </FormGroup>
            <FormGroup label="Location">
              <Input value={exp.location} onChange={(e) => update(exp.id, { location: e.target.value })} />
            </FormGroup>
            <FormGroup label="Joining Date">
              <Input type="month" value={exp.joining_date} onChange={(e) => update(exp.id, { joining_date: e.target.value })} />
            </FormGroup>
            {!exp.is_current && (
              <FormGroup label="Leaving Date">
                <Input type="month" value={exp.leaving_date} onChange={(e) => update(exp.id, { leaving_date: e.target.value })} />
              </FormGroup>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm text-on-surface-variant">
            <input
              type="checkbox"
              className="w-4 h-4"
              checked={exp.is_current}
              onChange={(e) => update(exp.id, { is_current: e.target.checked, leaving_date: e.target.checked ? '' : exp.leaving_date })}
            />
            Currently working here
          </label>
        </Card>
      ))}
      <Button type="button" variant="soft" size="sm" icon="add" onClick={add}>Add Another Experience</Button>
    </div>
  );
}

function TagEditor({ values, onChange, placeholder }) {
  const [draft, setDraft] = useState('');
  const list = values || [];

  const add = () => {
    const v = draft.trim();
    if (v && !list.includes(v)) onChange([...list, v]);
    setDraft('');
  };

  return (
    <div>
      {list.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {list.map((v) => (
            <Badge key={v} tone="neutral">
              {v}
              <button
                type="button"
                onClick={() => onChange(list.filter((x) => x !== v))}
                className="ml-1 -mr-0.5 opacity-70 hover:opacity-100 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px] align-middle">close</span>
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); add(); }
          }}
          placeholder={placeholder}
        />
        <Button type="button" size="sm" variant="soft" onClick={add}>Add</Button>
      </div>
    </div>
  );
}

function UploadSlot({ label, kind, currentUrl, uploadFile, shape = 'circle', accept = 'image/*' }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pick = () => inputRef.current?.click();

  const onChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      await uploadFile(kind, file);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={pick}
        disabled={busy}
        className={`relative overflow-hidden border-2 border-dashed border-outline-variant hover:border-primary transition-colors cursor-pointer bg-surface-container-high flex items-center justify-center ${
          shape === 'circle' ? 'w-20 h-20 rounded-full' : 'w-full h-24 rounded-xl'
        }`}
      >
        {currentUrl ? (
          <img src={currentUrl} alt={label} className="w-full h-full object-cover" />
        ) : (
          <span className="material-symbols-outlined text-on-surface-variant">add_a_photo</span>
        )}
        {busy && (
          <span className="absolute inset-0 bg-on-surface/40 flex items-center justify-center">
            <span className="material-symbols-outlined text-white animate-spin">progress_activity</span>
          </span>
        )}
      </button>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={onChange} />
      {error && <p className="text-error text-[11px] mt-1 mb-0">{error}</p>}
    </div>
  );
}

export default function ProfessionalProfile() {
  const { profile, name, profilePhotoUrl, coverPhotoUrl, resumeUrl, updateProfile, uploadFile } = useSession();
  const [tab, setTab] = useState('overview');
  const [form, setForm] = useState(() => toFormState(profile));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedAt, setSavedAt] = useState(0);

  useEffect(() => {
    setForm(toFormState(profile));
  }, [profile?.email]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const dirty = EDITABLE_FIELDS.some((f) => (form[f] || '') !== (profile?.[f] || ''))
    || JSON.stringify(form.subjects) !== JSON.stringify(profile?.subjects || [])
    || JSON.stringify(form.skills) !== JSON.stringify(profile?.skills || [])
    || JSON.stringify(form.education) !== JSON.stringify(profile?.education || {})
    || JSON.stringify(form.work_experience) !== JSON.stringify(profile?.work_experience || []);

  const save = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await updateProfile(form);
      setSavedAt(Date.now());
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  const SaveBar = (
    <div className="flex items-center gap-3 mt-4">
      <Button size="sm" onClick={save} disabled={!dirty || saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
      {!saving && !dirty && savedAt > 0 && (
        <span className="text-xs text-secondary font-semibold flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">check_circle</span> Saved
        </span>
      )}
      {saveError && <span className="text-xs text-error">{saveError}</span>}
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Professional Profile"
        subtitle="Fully editable — update any field and it saves to your account."
      />

      <Card className="overflow-hidden mb-5">
        <div className="relative h-24 md:h-32 bg-gradient-to-r from-tertiary to-primary">
          {coverPhotoUrl && (
            <img src={coverPhotoUrl} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute bottom-2 right-2 w-28">
            <UploadSlot label="Cover" kind="cover" currentUrl={coverPhotoUrl} uploadFile={uploadFile} shape="rect" />
          </div>
        </div>
        <div className="p-5 pt-0">
          <div className="-mt-10 mb-3 w-20">
            <UploadSlot label="Profile photo" kind="photo" currentUrl={profilePhotoUrl} uploadFile={uploadFile} shape="circle" />
          </div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-[200px]">
              <h3 className="text-lg font-bold text-on-surface">{name}</h3>
              <p className="text-sm text-on-surface-variant mb-1">{form.headline || 'Add a headline in the Overview tab'}</p>
              {profile?.category && <Badge tone="primary">{profile.category}</Badge>}
            </div>
          </div>
        </div>
      </Card>

      <div className="flex gap-2 mb-5 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all cursor-pointer ${
              tab === t.key
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-transparent text-on-surface-variant border-outline-variant hover:bg-surface-container-low'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <Card className="p-5 max-w-2xl">
          <h4 className="text-sm font-bold text-on-surface mb-3">Overview</h4>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <FormGroup label="Full name">
              <Input value={form.name} onChange={set('name')} />
            </FormGroup>
            <FormGroup label="Headline">
              <Input value={form.headline} onChange={set('headline')} placeholder="e.g. Math Faculty | JEE & NEET | 15 Years Experience" />
            </FormGroup>
          </div>
          <FormGroup label="About">
            <Textarea rows={4} value={form.about} onChange={set('about')} placeholder="A short summary about you" />
          </FormGroup>
          {SaveBar}
        </Card>
      )}

      {tab === 'experience' && (
        <div className="max-w-2xl space-y-5">
          <Card className="p-5">
            <h4 className="text-sm font-bold text-on-surface mb-1">Education</h4>
            <p className="text-xs text-on-surface-variant mb-4">
              Graduation and Post-Graduation are optional — only fill them in if they apply to you.
            </p>
            <EducationEditor
              value={form.education}
              onChange={(v) => setForm((f) => ({ ...f, education: v }))}
            />
          </Card>

          <Card className="p-5">
            <h4 className="text-sm font-bold text-on-surface mb-1">Work Experience</h4>
            <p className="text-xs text-on-surface-variant mb-4">
              Any job counts — teaching or otherwise. Add every role, most recent first.
            </p>
            <WorkExperienceEditor
              value={form.work_experience}
              onChange={(v) => setForm((f) => ({ ...f, work_experience: v }))}
            />
          </Card>

          <Card className="p-5">
            <h4 className="text-sm font-bold text-on-surface mb-2">Subjects</h4>
            <div className="mb-4">
              <TagEditor
                values={form.subjects}
                onChange={(v) => setForm((f) => ({ ...f, subjects: v }))}
                placeholder="Type a subject, press Enter"
              />
            </div>
            <h4 className="text-sm font-bold text-on-surface mb-2">Skills</h4>
            <TagEditor
              values={form.skills}
              onChange={(v) => setForm((f) => ({ ...f, skills: v }))}
              placeholder="Type a skill, press Enter"
            />
          </Card>

          {SaveBar}
        </div>
      )}

      {tab === 'resume' && (
        <Card className="p-5 max-w-2xl">
          <h4 className="text-sm font-bold text-on-surface mb-3">Resume</h4>
          <div className="flex items-center gap-4 mb-6">
            {resumeUrl ? (
              <a href={resumeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary font-semibold">
                <span className="material-symbols-outlined">description</span> View current resume
              </a>
            ) : (
              <p className="text-sm text-on-surface-variant mb-0">No resume uploaded yet.</p>
            )}
            <UploadSlot label="Resume" kind="resume" currentUrl={null} uploadFile={uploadFile} shape="rect" accept="application/pdf" />
          </div>

          <h4 className="text-sm font-bold text-on-surface mb-3">Contact Details</h4>
          <FormGroup label="Phone">
            <Input value={form.phone} onChange={set('phone')} placeholder="+91-XXXXXXXXXX" />
          </FormGroup>
          {SaveBar}
        </Card>
      )}
    </div>
  );
}
