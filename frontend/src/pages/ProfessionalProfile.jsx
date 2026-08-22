import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input, Textarea, FormGroup } from '../components/ui/Field';
import { useSession } from '../context/useSession';
import { useFollows } from './useFollows';
import { mockPages } from './mockData';
import { ApiError, fetchMyOrganization, saveMyOrganization } from '../Api/Api';
import { isOrgAccount, isOrgRole } from '../constants/roles';
import { useMyPages } from '../hooks/useMyPages';
import PageHeader from './PageHeader';

// Account Setup (role/category switching) is paused per client feedback
// 12 Aug 2026 — see docs/CLIENT_FEEDBACK_2026-08-12.md, Section 1. Removed
// from the tab list; git history has the component if it comes back.
const TABS = [
  { key: 'overview', label: 'Overview', icon: 'person' },
  { key: 'organization', label: 'Organisation Details', icon: 'apartment' },
  { key: 'experience', label: 'Experience & Skills', icon: 'work_history' },
  { key: 'resume', label: 'Resume & Contact', icon: 'description' },
  { key: 'marketplace', label: 'My Network & Marketplace', icon: 'diversity_3' },
];

// Personal-history tabs: 10th passing year, work experience, skills, CV.
// They describe a *person*, so an organisation account never sees them — an
// institute has no schooling or resume of its own.
const INDIVIDUAL_ONLY_TABS = new Set(['experience', 'resume']);

/** The mirror image: only an organisation account maintains these. */
const ORG_ONLY_TABS = new Set(['organization']);

/** Organisation fields, matching what the Admin panel fills for an institute
 *  (minus the credentials — this account already has its own). */
const ORG_FIELDS = ['name', 'phone', 'city', 'state', 'district', 'block', 'programs', 'website', 'about'];

function toOrgFormState(org) {
  const base = {};
  ORG_FIELDS.forEach((f) => { base[f] = org?.[f] || ''; });
  return base;
}

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

// The marketplace lives inside Profile, gated by which Institute Pages this
// user follows or has selected as their own — Sell Leads (Admission
// Notices / Job Vacancies) from those pages show free; everyone else's Buy
// Leads stay credit-gated behind Search Connections. See
// docs/CLIENT_FEEDBACK_2026-08-16.md, Sections 3–4.
function MarketplaceTab() {
  const { followedSlugs, isFollowing, toggleFollow } = useFollows();

  // "Select pages during profile creation" — selecting one here is treated
  // as an affiliation *and* auto-follows the page, same as the client's own
  // example ("I study at X School, so I automatically follow its page").
  const toggleAffiliation = (slug) => toggleFollow(slug);

  const followedPages = mockPages.filter((p) => followedSlugs.includes(p.slug));
  const sellLeads = followedPages.flatMap((p) =>
    p.opportunities.map((op) => ({ ...op, pageName: p.name, pageSlug: p.slug }))
  );

  return (
    <div className="max-w-2xl space-y-5">
      <Card className="p-5">
        <h4 className="text-sm font-bold text-on-surface mb-1">Your Institutes</h4>
        <p className="text-xs text-on-surface-variant mb-4">
          Select the institutes you're affiliated with (e.g. where you study or teach) — you'll automatically
          follow their page, and their Admission Notices / Job Vacancies show up free below.
        </p>
        <div className="flex flex-wrap gap-2">
          {mockPages.map((p) => (
            <button
              key={p.slug}
              type="button"
              onClick={() => toggleAffiliation(p.slug)}
              className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                isFollowing(p.slug)
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-transparent text-on-surface-variant border-outline-variant hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {isFollowing(p.slug) ? 'check_circle' : 'add_circle'}
              </span>
              {p.name}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <Badge tone="success">Sell Lead — Free</Badge>
          <h4 className="text-sm font-bold text-on-surface mb-0">From institutes you follow</h4>
        </div>
        <p className="text-xs text-on-surface-variant mb-4">
          Admission Notices and Job Vacancies from your selected/followed pages — always free to view.
        </p>
        {sellLeads.length === 0 ? (
          <p className="text-sm text-on-surface-variant mb-0">
            Follow or select an institute above to see their opportunities here.
          </p>
        ) : (
          <div className="space-y-3">
            {sellLeads.map((lead) => (
              <div key={lead.id} className="p-3 rounded-xl border border-outline-variant">
                <div className="flex items-center justify-between mb-1">
                  <Badge tone={lead.type === 'admission' ? 'success' : 'tertiary'}>
                    {lead.type === 'admission' ? 'Admission Open Notice' : 'Job Vacancy'}
                  </Badge>
                  <Link to={`/${lead.pageSlug}`} className="text-xs text-primary font-semibold">
                    {lead.pageName}
                  </Link>
                </div>
                <p className="text-sm font-semibold text-on-surface mb-0">
                  {lead.type === 'admission' ? lead.course : lead.position}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <Badge tone="error">Buy Lead — Credit-gated</Badge>
          <h4 className="text-sm font-bold text-on-surface mb-0">Everyone else's enquiries</h4>
        </div>
        <p className="text-xs text-on-surface-variant mb-3">
          "Looking for a Job" / "Looking for Admission" posts from other users aren't free — search, filter,
          or save your desired criteria and unlock the ones you want with credits.
        </p>
        <Link to="/search">
          <Button size="sm" variant="soft" icon="travel_explore">Search Connections</Button>
        </Link>
      </Card>
    </div>
  );
}

export default function ProfessionalProfile() {
  const { role, profile, name, profilePhotoUrl, coverPhotoUrl, resumeUrl, updateProfile, uploadFile } = useSession();
  const isOrg = isOrgAccount(role, profile);
  // Real answer from page_admins, so the console link only appears to someone
  // who actually administers a page.
  const { pages: myPages, loading: myPagesLoading } = useMyPages();
  // An Admin-provisioned Institute account is an organisation by definition,
  // so it gets no toggle — only a self-registered account chooses.
  const canChooseKind = !isOrgRole(role) && role !== 'admin';
  const tabs = TABS.filter((t) =>
    isOrg ? !INDIVIDUAL_ONLY_TABS.has(t.key) : !ORG_ONLY_TABS.has(t.key),
  );
  const [tab, setTab] = useState('overview');
  const [form, setForm] = useState(() => toFormState(profile));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedAt, setSavedAt] = useState(0);

  // --- Account kind + organisation details ---
  const [kindSaving, setKindSaving] = useState(false);
  const [kindError, setKindError] = useState('');
  const [confirmOrgOpen, setConfirmOrgOpen] = useState(false);
  const [org, setOrg] = useState(null);
  const [orgForm, setOrgForm] = useState(() => toOrgFormState(null));
  const [orgSaving, setOrgSaving] = useState(false);
  const [orgError, setOrgError] = useState('');
  const [orgSavedAt, setOrgSavedAt] = useState(0);

  useEffect(() => {
    setForm(toFormState(profile));
  }, [profile?.email]);

  // Details are only fetched once the account actually is an organisation —
  // an individual has none to show.
  useEffect(() => {
    if (!isOrg) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchMyOrganization();
        if (cancelled) return;
        setOrg(data);
        setOrgForm(toOrgFormState(data));
      } catch {
        // Leaving the form blank is the right fallback — the user can still
        // fill it in and save.
      }
    })();
    return () => { cancelled = true; };
  }, [isOrg, profile?.email]);

  const setOrgField = (key) => (e) => setOrgForm((f) => ({ ...f, [key]: e.target.value }));

  const orgDirty = ORG_FIELDS.some((f) => (orgForm[f] || '') !== (org?.[f] || ''));

  const saveOrg = async () => {
    setOrgSaving(true);
    setOrgError('');
    try {
      const saved = await saveMyOrganization(orgForm);
      setOrg(saved);
      setOrgForm(toOrgFormState(saved));
      setOrgSavedAt(Date.now());
    } catch (err) {
      setOrgError(err instanceof ApiError ? err.message : 'Could not save organisation details.');
    } finally {
      setOrgSaving(false);
    }
  };

  // One-way by design, and enforced by the backend — the switch reshapes the
  // account, so there is no "off" path here at all.
  const confirmBecomeOrganization = async () => {
    setKindSaving(true);
    setKindError('');
    try {
      await updateProfile({ is_organization: true });
      setConfirmOrgOpen(false);
      setTab('organization');
    } catch (err) {
      setKindError(err instanceof ApiError ? err.message : 'Could not change the account type.');
    } finally {
      setKindSaving(false);
    }
  };

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
        {tabs.map((t) => (
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
        <div className="max-w-2xl space-y-5">
        {/* Sign-up always creates an individual account, so this is where a
            school, coaching centre or company says otherwise. It changes what
            the profile asks for — it grants no extra access. */}
        {canChooseKind && (
          <Card className="p-5">
            <h4 className="text-sm font-bold text-on-surface mb-1">Account Type</h4>
            <p className="text-xs text-on-surface-variant mb-4">
              Individual accounts keep a personal profile — schooling, work history and a CV.
              Organisation accounts swap all of that for the institute&apos;s own details.
            </p>
            <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-outline-variant">
              <div>
                <p className="text-sm font-semibold text-on-surface m-0">
                  This account represents an organisation
                </p>
                <p className="text-[11px] text-on-surface-variant m-0 mt-0.5">
                  A school, college, coaching centre or training institute — not a person.
                </p>
              </div>
              {/* Permanent once set, so the control is locked afterwards
                  rather than offering an "off" that the server would reject. */}
              <label
                className={`relative inline-flex items-center shrink-0 ${
                  isOrg ? 'cursor-not-allowed' : 'cursor-pointer'
                }`}
                title={isOrg ? 'Organisation accounts cannot be changed back' : undefined}
              >
                <input
                  type="checkbox"
                  checked={isOrg}
                  disabled={isOrg || kindSaving}
                  onChange={() => setConfirmOrgOpen(true)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-container-high rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-disabled:opacity-60" />
              </label>
            </div>
            {isOrg ? (
              <p className="text-[11px] text-on-surface-variant mt-3 mb-0 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">lock</span>
                This account is an organisation. That cannot be changed back.
              </p>
            ) : (
              <p className="text-[11px] text-amber-700 mt-3 mb-0 flex items-start gap-1.5">
                <span className="material-symbols-outlined text-[14px] mt-px">warning</span>
                Switching to an organisation is permanent — it cannot be undone.
              </p>
            )}
            {kindError && (
              <p className="text-xs text-error bg-error-container/40 rounded-lg px-3 py-2 mt-3 mb-0">{kindError}</p>
            )}
          </Card>
        )}

        <Card className="p-5">
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
        </div>
      )}

      {/* Same basic details the Admin panel records for an institute. Sign-in
          email and password are not here: the account already has both, and
          the password is changed from the account menu. */}
      {tab === 'organization' && isOrg && (
        <div className="max-w-2xl space-y-5">
          <Card className="p-5">
            <h4 className="text-sm font-bold text-on-surface mb-1">Organisation Details</h4>
            <p className="text-xs text-on-surface-variant mb-4">
              Basic information about the institute. Enquiries are matched to institutes by state,
              so filling in the location makes yours reachable.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <FormGroup label="Organisation name">
                <Input value={orgForm.name} onChange={setOrgField('name')} placeholder="e.g. Apex Institute of Technology" />
              </FormGroup>
              <FormGroup label="Contact number">
                <Input value={orgForm.phone} onChange={setOrgField('phone')} placeholder="+91-XXXXXXXXXX" />
              </FormGroup>
            </div>

            <FormGroup label="Sign-in email">
              <Input value={profile?.email || ''} disabled readOnly />
            </FormGroup>
            <p className="text-[11px] text-on-surface-variant -mt-2 mb-4">
              This is your account address — change it from the account menu, not here.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <FormGroup label="State">
                <Input value={orgForm.state} onChange={setOrgField('state')} placeholder="Madhya Pradesh" />
              </FormGroup>
              <FormGroup label="District">
                <Input value={orgForm.district} onChange={setOrgField('district')} placeholder="Indore" />
              </FormGroup>
              <FormGroup label="Block / Area">
                <Input value={orgForm.block} onChange={setOrgField('block')} placeholder="Vijay Nagar" />
              </FormGroup>
              <FormGroup label="City">
                <Input value={orgForm.city} onChange={setOrgField('city')} placeholder="Indore" />
              </FormGroup>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <FormGroup label="Courses offered">
                <Input value={orgForm.programs} onChange={setOrgField('programs')} placeholder="Comma separated" />
              </FormGroup>
              <FormGroup label="Website">
                <Input value={orgForm.website} onChange={setOrgField('website')} placeholder="www.example.com" />
              </FormGroup>
            </div>

            <FormGroup label="About the organisation">
              <Textarea rows={4} value={orgForm.about} onChange={setOrgField('about')} placeholder="What the institute does, who it teaches" />
            </FormGroup>

            {orgError && (
              <p className="text-xs text-error bg-error-container/40 rounded-lg px-3 py-2 mt-3 mb-0">{orgError}</p>
            )}

            <div className="flex items-center gap-3 mt-4">
              <Button size="sm" onClick={saveOrg} disabled={!orgDirty || orgSaving}>
                {orgSaving ? 'Saving...' : 'Save Details'}
              </Button>
              {!orgSaving && !orgDirty && orgSavedAt > 0 && (
                <span className="text-xs text-emerald-600 font-semibold">Saved</span>
              )}
            </div>
          </Card>

          {/* Where an organisation goes next: publish a public Institute Page,
              then manage its courses, notices and vacancies in the console. */}
          <Card className="p-5">
            <h4 className="text-sm font-bold text-on-surface mb-1">Institute Page</h4>
            {myPagesLoading ? (
              <p className="text-xs text-on-surface-variant m-0">Checking your institute pages…</p>
            ) : myPages.length > 0 ? (
              <>
                <p className="text-xs text-on-surface-variant mb-4">
                  You administer {myPages.length === 1 ? 'this institute page' : `${myPages.length} institute pages`}.
                  Courses, admission notices, vacancies and enquiries are managed in the console.
                </p>
                <ul className="list-none p-0 m-0 mb-4 space-y-2">
                  {myPages.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-outline-variant"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-on-surface m-0 truncate">{p.name}</p>
                        <p className="text-[11px] text-on-surface-variant m-0 font-mono truncate">
                          connectedus.in/{p.slug}
                        </p>
                      </div>
                      <Link to={`/${p.slug}`} className="shrink-0">
                        <Button size="sm" variant="outline" icon="open_in_new">View</Button>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link to="/institute">
                  <Button size="sm" icon="dashboard">Open Institute Console</Button>
                </Link>
              </>
            ) : (
              <>
                <p className="text-xs text-on-surface-variant mb-4">
                  You don&apos;t have a public Institute Page yet. Create one to start posting
                  admission notices and job vacancies.
                </p>
                <Link to="/create-page">
                  <Button size="sm" icon="add_business">Create Institute Page</Button>
                </Link>
              </>
            )}
          </Card>
        </div>
      )}

      {tab === 'experience' && !isOrg && (
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

      {tab === 'resume' && !isOrg && (
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

      {tab === 'marketplace' && <MarketplaceTab />}

      {/* Deliberately a blocking confirmation rather than an instant toggle:
          the change is permanent and rewrites what the profile collects. */}
      <Modal open={confirmOrgOpen} onClose={() => !kindSaving && setConfirmOrgOpen(false)} width={420}>
        <div className="flex items-start gap-3 mb-4">
          <span className="material-symbols-outlined text-amber-600">warning</span>
          <div>
            <h2 className="text-lg font-bold text-on-surface m-0 mb-1">Switch to an organisation account?</h2>
            <p className="text-xs text-on-surface-variant m-0">
              <strong className="text-on-surface">This cannot be undone.</strong> You will not be able
              to switch back to an individual account afterwards.
            </p>
          </div>
        </div>

        <ul className="list-none p-0 m-0 mb-5 space-y-2 text-xs text-on-surface-variant">
          <li className="flex items-start gap-2">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">remove</span>
            Experience &amp; Skills and Resume &amp; Contact are removed from your profile.
          </li>
          <li className="flex items-start gap-2">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">add</span>
            You get an Organisation Details tab and can publish an Institute Page.
          </li>
        </ul>

        {kindError && (
          <p className="text-xs text-error bg-error-container/40 rounded-lg px-3 py-2 mb-4 mt-0">{kindError}</p>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => setConfirmOrgOpen(false)} disabled={kindSaving}>
            Cancel
          </Button>
          <Button type="button" onClick={confirmBecomeOrganization} disabled={kindSaving}>
            {kindSaving ? 'Switching…' : 'Yes, this is an organisation'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
