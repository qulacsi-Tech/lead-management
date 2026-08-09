import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Input, Textarea, FormGroup } from '../components/ui/Field';
import { PROFESSIONAL_CATEGORIES } from './mockData';
import { useSession } from '../context/useSession';
import { ApiError } from '../Api/Api';
import PageHeader from './PageHeader';

const TABS = [
  { key: 'overview', label: 'Overview', icon: 'person' },
  { key: 'experience', label: 'Experience & Skills', icon: 'work_history' },
  { key: 'resume', label: 'Resume & Contact', icon: 'description' },
  { key: 'account', label: 'Account Setup', icon: 'settings_account_box' },
];

const EDITABLE_FIELDS = [
  'name', 'phone', 'headline', 'about', 'qualification', 'experience', 'current_institute',
];

function toFormState(profile) {
  const base = {};
  EDITABLE_FIELDS.forEach((f) => { base[f] = profile?.[f] || ''; });
  base.subjects = profile?.subjects || [];
  base.skills = profile?.skills || [];
  base.previous_institutes = profile?.previous_institutes || [];
  return base;
}

function ChipGroup({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-3.5 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
            value === opt
              ? 'bg-primary text-on-primary border-primary'
              : 'bg-transparent text-on-surface-variant border-outline-variant hover:bg-surface-container-low'
          }`}
        >
          {opt}
        </button>
      ))}
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

function AccountSetupTab({ role, category, updateProfile }) {
  const [busy, setBusy] = useState(false);

  const setRole = async (nextRole) => {
    setBusy(true);
    try {
      await updateProfile({
        role: nextRole,
        category: nextRole === 'professional' ? (category || PROFESSIONAL_CATEGORIES[0]) : null,
      });
    } finally {
      setBusy(false);
    }
  };

  const setCategory = async (c) => {
    setBusy(true);
    try {
      await updateProfile({ category: c });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined text-primary">settings_account_box</span>
        <h4 className="text-sm font-bold text-on-surface mb-0">Account Setup</h4>
        {!role && <Badge tone="error">Action needed</Badge>}
        {busy && <span className="material-symbols-outlined text-[16px] text-on-surface-variant animate-spin">progress_activity</span>}
      </div>
      <p className="text-xs text-on-surface-variant mb-4">
        Changes here save immediately and persist to your account.
      </p>

      <FormGroup label="I am">
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <button
            type="button"
            onClick={() => setRole('professional')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer text-left ${
              role === 'professional'
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-transparent text-on-surface-variant border-outline-variant hover:bg-surface-container-low'
            }`}
          >
            <span className="material-symbols-outlined block mb-1">badge</span>
            Professional
          </button>
          <button
            type="button"
            onClick={() => setRole('student')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer text-left ${
              role === 'student'
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-transparent text-on-surface-variant border-outline-variant hover:bg-surface-container-low'
            }`}
          >
            <span className="material-symbols-outlined block mb-1">school</span>
            Student
          </button>
        </div>
      </FormGroup>

      {role === 'professional' && (
        <div className="mt-4">
          <FormGroup label="Professional category">
            <ChipGroup options={PROFESSIONAL_CATEGORIES} value={category} onChange={setCategory} />
          </FormGroup>
        </div>
      )}

      {role === 'professional' && (
        <div className="mt-4 pt-4 border-t border-outline-variant flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs text-on-surface-variant mb-0">Want to create an Institute Page too?</p>
          <Link to="/create-page">
            <Button size="sm" variant="soft" icon="add_business">Create Institute Page</Button>
          </Link>
        </div>
      )}

      {role === 'student' && (
        <p className="text-xs text-on-surface-variant mt-3 mb-0">
          As a Student you won't see "Looking for a Job" or "Expert Opinion", and can't create a Page.
        </p>
      )}
    </Card>
  );
}

export default function ProfessionalProfile() {
  const { profile, role, name, profilePhotoUrl, coverPhotoUrl, resumeUrl, updateProfile, uploadFile } = useSession();
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
    || JSON.stringify(form.previous_institutes) !== JSON.stringify(profile?.previous_institutes || []);

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
        <Card className="p-5 max-w-2xl">
          <h4 className="text-sm font-bold text-on-surface mb-3">Experience & Skills</h4>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <FormGroup label="Qualification">
              <Input value={form.qualification} onChange={set('qualification')} placeholder="e.g. M.Sc Mathematics, B.Ed" />
            </FormGroup>
            <FormGroup label="Experience">
              <Input value={form.experience} onChange={set('experience')} placeholder="e.g. 15 Years" />
            </FormGroup>
            <FormGroup label="Current Institute">
              <Input value={form.current_institute} onChange={set('current_institute')} />
            </FormGroup>
          </div>
          <div className="mb-4">
            <FormGroup label="Previous Institutes">
              <TagEditor
                values={form.previous_institutes}
                onChange={(v) => setForm((f) => ({ ...f, previous_institutes: v }))}
                placeholder="Type an institute name, press Enter"
              />
            </FormGroup>
          </div>
          <div className="mb-4">
            <FormGroup label="Subjects">
              <TagEditor
                values={form.subjects}
                onChange={(v) => setForm((f) => ({ ...f, subjects: v }))}
                placeholder="Type a subject, press Enter"
              />
            </FormGroup>
          </div>
          <FormGroup label="Skills">
            <TagEditor
              values={form.skills}
              onChange={(v) => setForm((f) => ({ ...f, skills: v }))}
              placeholder="Type a skill, press Enter"
            />
          </FormGroup>
          {SaveBar}
        </Card>
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

      {tab === 'account' && (
        <AccountSetupTab role={role} category={profile?.category} updateProfile={updateProfile} />
      )}
    </div>
  );
}
