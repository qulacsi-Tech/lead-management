import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import DataTable, { RowAction } from '../../components/ui/DataTable';
import { Input, Label, FormGroup } from '../../components/ui/Field';
import { INSTITUTE_TYPES, AFFILIATION_OPTIONS, slugify } from '../../constants/taxonomy';
import StateCitySelect from '../../components/ui/StateCitySelect';
import { pagePath, pageDisplayUrl } from '../../utils/pageUrl';
import {
  ApiError,
  resolveAssetUrl,
  fetchPages,
  createPage,
  togglePageStatus,
  fetchPageAdmins,
  assignPageAdmin,
  revokePageAdmin,
  uploadPageMedia,
  fetchPageCourses,
  fetchPageOpportunities,
} from '../../Api/Api';




function affiliationConfig(type) {
  if (type === 'School') return { mode: 'select', label: 'Board' };
  if (type === 'College') return { mode: 'select', label: 'Affiliating University' };
  if (type === 'University') return { mode: 'select', label: 'Accreditation' };
  return { mode: 'na', label: 'Affiliation' };
}

const emptyForm = {
  name: '', type: 'Coaching', tagline: '', logoFile: null, logoPreview: null, banners: [],
  address: '', city: '', state: '', website: '', contact: '', affiliation: '', slug: '',
  adminEmail: '', adminName: '', adminPassword: '',
};

/** Two-letter monogram, shown when an institute has not uploaded a logo. */
function initials(name) {
  return (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function locationOf(page) {
  return [page.address, page.city, page.state].filter(Boolean).join(', ');
}

// Bulk page-creation tool for Admin — built per client's explicit priority
// request, 16 Aug 2026: "give me an admin panel where I (and 2-3 free team
// members) can start creating institute/school/coaching pages ourselves,
// while the rest of the concept is still being built." See
// docs/CLIENT_FEEDBACK_2026-08-16.md, Section 5.
//
// Every row here is read from /api/pages — nothing on this screen is seeded
// client-side.
export default function ManagePages() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [adminsFor, setAdminsFor] = useState(null); // page whose admins are being managed
  const [newAdmin, setNewAdmin] = useState({ email: '', role: 'ADMIN', name: '', password: '' });

  const [adminError, setAdminError] = useState('');
  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  // Overlapping callers share one round-trip — otherwise StrictMode's
  // double-invoked mount effect fetches the whole page list twice.
  const inFlight = useRef(null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const affiliation = affiliationConfig(form.type);
  const affiliationChoices = AFFILIATION_OPTIONS[form.type] || [];

  // The list endpoint returns the page records only; admins and content counts
  // are page-scoped resources, so each row is enriched alongside the others.
  const load = useCallback(() => {
    if (inFlight.current) return inFlight.current;
    inFlight.current = (async () => {
      setLoading(true);
      try {
        const list = await fetchPages();
        setError('');
        const enriched = await Promise.all(
          list.map(async (p) => {
            const [admins, courses, opportunities] = await Promise.allSettled([
              fetchPageAdmins(p.id),
              fetchPageCourses(p.id),
              fetchPageOpportunities(p.id),
            ]);
            return {
              ...p,
              admins: admins.status === 'fulfilled' ? admins.value : [],
              coursesCount: courses.status === 'fulfilled' ? courses.value.length : 0,
              opportunitiesCount: opportunities.status === 'fulfilled' ? opportunities.value.length : 0,
            };
          }),
        );
        setPages(enriched);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not load institute pages.');
        setPages([]);
      } finally {
        setLoading(false);
        inFlight.current = null;
      }
    })();
    return inFlight.current;
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // PLATFORM-OWNED action: enabling/disabling an institute's public page.
  const toggleEnabled = async (page) => {
    try {
      const updated = await togglePageStatus(page.id, !page.is_enabled);
      setPages((prev) => prev.map((p) => (p.id === page.id ? { ...p, ...updated } : p)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update the page.');
    }
  };


  const addAdmin = async (e) => {
    e.preventDefault();
    if (!newAdmin.email) return;
    setAdminError('');
    try {
      const admins = await assignPageAdmin(adminsFor.id, newAdmin);
      setNewAdmin({ email: '', role: 'ADMIN', name: '', password: '' });
      setAdminsFor((p) => ({ ...p, admins }));
      setPages((prev) => prev.map((p) => (p.id === adminsFor.id ? { ...p, admins } : p)));
    } catch (err) {
      setAdminError(err instanceof ApiError ? err.message : 'Could not assign that admin.');
    }
  };

  const revokeAdmin = async (admin) => {
    if (!window.confirm(`Remove ${admin.email} as an admin of ${adminsFor.name}?`)) return;
    setAdminError('');
    try {
      const admins = await revokePageAdmin(adminsFor.id, admin.user_id);
      setAdminsFor((p) => ({ ...p, admins }));
      setPages((prev) => prev.map((p) => (p.id === adminsFor.id ? { ...p, admins } : p)));
    } catch (err) {
      setAdminError(err instanceof ApiError ? err.message : 'Could not revoke that admin.');
    }
  };

  // Slug auto-fills from the name until the admin types their own.
  const previewSlug = slugify(form.slug || form.name) || 'institute-name';
  const previewUrl = pageDisplayUrl({
    slug: previewSlug,
    type: form.type,
    city: form.city,
  });
  // Uniqueness is scoped to type + city, matching the backend — two "paras"
  // coaching centres in different cities are two different URLs and neither
  // needs a suffix. Comparing globally here would warn about a clash that
  // will not happen.
  const slugTaken = pages.some(
    (p) =>
      p.slug === previewSlug &&
      p.type === form.type &&
      slugify(p.city || '') === slugify(form.city || ''),
  );

  const setLogo = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setForm((f) => ({ ...f, logoFile: file, logoPreview: URL.createObjectURL(file) }));
  };

  const addBanner = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setForm((f) => ({
      ...f,
      banners: [...f.banners, { file, preview: URL.createObjectURL(file) }].slice(0, 3),
    }));
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setForm(emptyForm);
    setFormError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      // The record is created first because media uploads are page-scoped.
      const page = await createPage({
        name: form.name,
        type: form.type,
        slug: form.slug || undefined,
        tagline: form.tagline || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        website: form.website || undefined,
        contact: form.contact || undefined,
        affiliation: form.affiliation || undefined,
        admin_email: form.adminEmail || undefined,
        // Ignored by the backend when the email already has an account.
        admin_name: form.adminName || undefined,
        admin_password: form.adminPassword || undefined,
      });

      if (form.logoFile) await uploadPageMedia(page.id, 'logo', form.logoFile);
      for (const banner of form.banners) {
        await uploadPageMedia(page.id, 'banner', banner.file);
      }

      closeCreate();
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not create the institute.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex-1 w-full box-border">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface m-0">Institute Pages</h1>
          <p className="text-xs text-on-surface-variant m-0 mt-1 max-w-3xl">
            Create the institute, set its public identity and hand it to an Institute Admin. Courses,
            notices, vacancies and enquiries are then managed by that admin in their own console —
            the platform team does not maintain each institute&apos;s day-to-day content.
          </p>
        </div>
        <Button icon="add_business" onClick={() => setCreateOpen(true)}>
          Create Institute
        </Button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-error-container text-on-error-container text-sm">{error}</div>
      )}

      <DataTable
        rows={pages}
        columns={[
          {
            key: 'page',
            label: 'Institute',
            render: (p) => (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary font-bold overflow-hidden shrink-0">
                  {p.logo_url ? (
                    <img src={resolveAssetUrl(p.logo_url)} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    initials(p.name)
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-on-surface m-0 text-sm">{p.name}</p>
                  <p className="text-[11px] text-on-surface-variant m-0 font-mono">{pageDisplayUrl(p)}</p>
                </div>
              </div>
            ),
          },
          { key: 'type', label: 'Type', render: (p) => <Badge tone="primary">{p.type}</Badge> },
          {
            key: 'location',
            label: 'Location',
            render: (p) => <span className="text-xs text-on-surface">{locationOf(p) || '—'}</span>,
          },
          {
            key: 'admin',
            label: 'Institute Admin',
            render: (p) =>
              p.admins.length > 0 ? (
                <div>
                  <p className="text-xs font-medium text-on-surface m-0">{p.admins[0].name || p.admins[0].email}</p>
                  <p className="text-[11px] text-on-surface-variant m-0">
                    {p.admins.length > 1 ? `+${p.admins.length - 1} more` : p.admins[0].email}
                  </p>
                </div>
              ) : (
                <Badge tone="error">Unassigned</Badge>
              ),
          },
          {
            key: 'content',
            label: 'Content',
            render: (p) => (
              <span className="text-xs text-on-surface-variant">
                {p.coursesCount} courses · {p.opportunitiesCount} leads
              </span>
            ),
          },
          {
            key: 'status',
            label: 'Page',
            render: (p) => <StatusBadge status={p.is_enabled ? 'Active' : 'Disabled'} />,
          },
          {
            key: 'actions',
            label: 'Actions',
            align: 'right',
            render: (p) => (
              <div className="flex items-center justify-end gap-1">
                <Link to={`/admin/pages/${p.id}`} title="View & edit full institute info">
                  <RowAction icon="visibility" title="View & edit full institute info" />
                </Link>
                <Link to={pagePath(p)} title="Open public page">
                  <RowAction icon="open_in_new" title="Open public page" />
                </Link>
                <RowAction
                  icon="manage_accounts"
                  title="Manage admins"
                  onClick={() => { setAdminError(''); setAdminsFor(p); }}
                />
                <RowAction
                  icon={p.is_enabled ? 'block' : 'check_circle'}
                  title={p.is_enabled ? 'Disable page' : 'Enable page'}
                  tone={p.is_enabled ? 'warn' : 'good'}
                  onClick={() => toggleEnabled(p)}
                />
              </div>

            ),
          },
        ]}
        empty={
          loading ? (
            <p className="text-center text-xs text-on-surface-variant py-12 m-0">Loading institutes…</p>
          ) : (
            <EmptyState
              icon="storefront"
              title="No institutes yet"
              description="Create the first Institute Page — it goes live at its own URL immediately."
              actionLabel="Create Institute"
              onAction={() => setCreateOpen(true)}
            />
          )
        }
      />

      <Modal open={createOpen} onClose={closeCreate} width={480}>
        <h2 className="text-lg font-bold text-on-surface m-0 mb-1">Create Institute Page</h2>
        <p className="text-xs text-on-surface-variant m-0 mb-5">
          It goes live immediately at its own URL — deeper content (Why Choose Us, Achievements, etc.) can be filled in later.
        </p>
        <form onSubmit={submit} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          <div>
            <Label>Type</Label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {INSTITUTE_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t, affiliation: '' }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    form.type === t
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-transparent text-on-surface-variant border-outline-variant hover:bg-surface-container-low'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Institute Name</Label>
            <Input required value={form.name} onChange={set('name')} placeholder="e.g. Apex Institute of Technology" />
          </div>
          <div>
            <Label>Page URL (slug)</Label>
            <Input
              value={form.slug}
              onChange={set('slug')}
              placeholder="auto-generated from the name"
            />
            <p className="text-[11px] text-on-surface-variant mt-1 mb-0 font-mono">
              {previewUrl}
              {slugTaken && (
                <span className="text-error font-sans ml-2">taken — a suffix will be added</span>
              )}
            </p>
          </div>
          <div>
            <Label>Tagline</Label>
            <Input value={form.tagline} onChange={set('tagline')} placeholder="e.g. Where Ambition Meets Achievement" />
          </div>

          <div>
            <Label>Logo</Label>
            <div className="flex items-center gap-3 mt-1.5">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="w-14 h-14 rounded-xl border-2 border-dashed border-outline-variant hover:border-primary flex items-center justify-center text-on-surface-variant cursor-pointer overflow-hidden shrink-0"
              >
                {form.logoPreview ? (
                  <img src={form.logoPreview} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined">add_photo_alternate</span>
                )}
              </button>
              <Button type="button" variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>
                {form.logoPreview ? 'Change Logo' : 'Upload Logo'}
              </Button>
            </div>
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={setLogo} />
          </div>

          <div>
            <Label>Header Banner Images (2–3)</Label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {form.banners.map((b, i) => (
                <div key={b.preview} className="relative w-20 h-14 rounded-lg overflow-hidden border border-outline-variant">
                  <img src={b.preview} alt={`Banner ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, banners: f.banners.filter((_, idx) => idx !== i) }))}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-on-surface/60 text-white flex items-center justify-center cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[11px]">close</span>
                  </button>
                </div>
              ))}
              {form.banners.length < 3 && (
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  className="w-20 h-14 rounded-lg border-2 border-dashed border-outline-variant hover:border-primary flex items-center justify-center text-on-surface-variant cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
                </button>
              )}
            </div>
            <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={addBanner} />
          </div>

          <div>
            <Label>Address</Label>
            <Input value={form.address} onChange={set('address')} placeholder="Street / area" />
          </div>
          <StateCitySelect
            state={form.state}
            city={form.city}
            onChange={({ state, city }) => setForm((f) => ({ ...f, state, city }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Website</Label>
              <Input value={form.website} onChange={set('website')} placeholder="www.example.com" />
            </div>
            <div>
              <Label>Contact Number</Label>
              <Input value={form.contact} onChange={set('contact')} placeholder="+91-XXXXXXXXXX" />
            </div>
          </div>

          <div>
            <Label>{affiliation.label}</Label>
            {affiliation.mode === 'select' && (
              <select
                value={form.affiliation}
                onChange={set('affiliation')}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer mt-1.5"
              >
                <option value="">Select {affiliation.label.toLowerCase()}</option>
                {affiliationChoices.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            )}
            {affiliation.mode === 'na' && (
              <p className="text-xs text-on-surface-variant mb-0 mt-1.5">Not applicable for {form.type} pages.</p>
            )}
          </div>

          <div className="pt-3 border-t border-outline-variant">
            <Label>Institute Admin login</Label>
            <p className="text-[11px] text-on-surface-variant mt-0 mb-2">
              They manage this institute&apos;s courses, notices, vacancies and enquiries from their own
              console. If this email already has an account it is linked as-is; otherwise a new login
              is created with the name and password below. You can add more admins later.
            </p>
            <Input
              type="email"
              value={form.adminEmail}
              onChange={set('adminEmail')}
              placeholder="admin@institute.in"
            />
            {form.adminEmail && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <Label small>Admin name</Label>
                  <Input
                    value={form.adminName}
                    onChange={set('adminName')}
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <Label small>Temporary password</Label>
                  <Input
                    type="text"
                    value={form.adminPassword}
                    onChange={set('adminPassword')}
                    placeholder="Min. 6 characters"
                  />
                </div>
              </div>
            )}
          </div>

          {formError && (
            <p className="text-xs text-error bg-error-container/40 rounded-lg px-3 py-2 m-0">{formError}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={closeCreate}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create Institute'}</Button>
          </div>
        </form>
      </Modal>

      {/* PLATFORM-OWNED: assigning who administers an institute */}
      <Modal open={!!adminsFor} onClose={() => setAdminsFor(null)} width={440}>
        {adminsFor && (
          <>
            <h2 className="text-lg font-bold text-on-surface m-0 mb-1">Institute Admins</h2>
            <p className="text-xs text-on-surface-variant m-0 mb-5">
              Who can manage <strong className="text-on-surface">{adminsFor.name}</strong>. Admins see
              only this institute in their console — never the platform.
            </p>

            {adminsFor.admins.length > 0 ? (
              <ul className="space-y-2 list-none p-0 m-0 mb-5">
                {adminsFor.admins.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-outline-variant"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-on-surface m-0 truncate">{a.name || a.email}</p>
                      <p className="text-[11px] text-on-surface-variant m-0 truncate">{a.email}</p>
                      {a.assigned_at && (
                        <p className="text-[10px] text-on-surface-variant m-0">
                          Assigned {new Date(a.assigned_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge tone="neutral">{a.role === 'OWNER' ? 'Owner' : 'Admin'}</Badge>
                      <RowAction icon="person_remove" title="Revoke access" tone="danger" onClick={() => revokeAdmin(a)} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                compact
                icon="person_off"
                title="No admin assigned"
                description="This institute has no one managing its content yet."
              />
            )}

            <form onSubmit={addAdmin} className="space-y-3 pt-4 border-t border-outline-variant">
              <FormGroup label="Assign a new admin">
                <p className="text-[11px] text-on-surface-variant mt-0 mb-2">
                  An existing account is linked as-is. To create a new login, add a name and
                  password as well.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="email"
                    required
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin((a) => ({ ...a, email: e.target.value }))}
                    placeholder="admin@institute.in"
                  />
                  <select
                    value={newAdmin.role}
                    onChange={(e) => setNewAdmin((a) => ({ ...a, role: e.target.value }))}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2.5 text-sm text-on-surface cursor-pointer"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="OWNER">Owner / Primary Admin</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Input
                    value={newAdmin.name}
                    onChange={(e) => setNewAdmin((a) => ({ ...a, name: e.target.value }))}
                    placeholder="Name (new account only)"
                  />
                  <Input
                    type="text"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin((a) => ({ ...a, password: e.target.value }))}
                    placeholder="Password (new account only)"
                  />
                </div>
              </FormGroup>
              {adminError && (
                <p className="text-xs text-error bg-error-container/40 rounded-lg px-3 py-2 m-0">{adminError}</p>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setAdminsFor(null)}>Done</Button>
                <Button type="submit" size="sm" icon="person_add">Assign Admin</Button>
              </div>
            </form>
          </>
        )}
      </Modal>
    </div>
  );
}

