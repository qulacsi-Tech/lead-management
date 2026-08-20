import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import DataTable, { RowAction } from '../../components/ui/DataTable';
import { Input, Label, FormGroup } from '../../components/ui/Field';
import {
  mockPages,
  addPage,
  INSTITUTE_TYPES,
  AFFILIATION_OPTIONS,
  slugify,
  findPageBySlug,
  assignPageAdmin,
  removePageAdmin,
} from '../mockData';

function affiliationConfig(type) {
  if (type === 'School') return { mode: 'select', label: 'Board' };
  if (type === 'College') return { mode: 'select', label: 'Affiliating University' };
  if (type === 'University') return { mode: 'select', label: 'Accreditation' };
  return { mode: 'na', label: 'Affiliation' };
}

const emptyForm = {
  name: '', type: 'Coaching', tagline: '', logoUrl: null, banners: [],
  address: '', website: '', contact: '', affiliation: '', slug: '',
  adminName: '', adminEmail: '',
};

// Bulk page-creation tool for Admin — built per client's explicit priority
// request, 16 Aug 2026: "give me an admin panel where I (and 2-3 free team
// members) can start creating institute/school/coaching pages ourselves,
// while the rest of the concept is still being built." See
// docs/CLIENT_FEEDBACK_2026-08-16.md, Section 5.
export default function ManagePages() {
  const [pages, setPages] = useState(mockPages);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [adminsFor, setAdminsFor] = useState(null); // page whose admins are being managed
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '' });
  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const affiliation = affiliationConfig(form.type);
  const affiliationChoices = AFFILIATION_OPTIONS[form.type] || [];

  const refresh = () => setPages([...mockPages]);

  // PLATFORM-OWNED action: enabling/disabling an institute's public page.
  const toggleEnabled = (page) => {
    page.enabled = !page.enabled;
    refresh();
  };

  const addAdmin = (e) => {
    e.preventDefault();
    if (!newAdmin.email) return;
    assignPageAdmin(adminsFor, {
      name: newAdmin.name,
      email: newAdmin.email,
      role: adminsFor.admins.length === 0 ? 'Owner / Primary Admin' : 'Admin',
    });
    setNewAdmin({ name: '', email: '' });
    refresh();
    setAdminsFor(findPageBySlug(adminsFor.slug));
  };

  const revokeAdmin = (email) => {
    if (!window.confirm(`Remove ${email} as an admin of ${adminsFor.name}?`)) return;
    removePageAdmin(adminsFor, email);
    refresh();
    setAdminsFor(findPageBySlug(adminsFor.slug));
  };

  // Slug auto-fills from the name until the admin types their own.
  const previewSlug = slugify(form.slug || form.name) || 'institute-name';

  const setLogo = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setForm((f) => ({ ...f, logoUrl: URL.createObjectURL(file) }));
  };

  const addBanner = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setForm((f) => ({ ...f, banners: [...f.banners, URL.createObjectURL(file)].slice(0, 3) }));
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setForm(emptyForm);
  };

  const submit = (e) => {
    e.preventDefault();
    const page = addPage({ ...form, courses: [] });
    // Assigning the first Institute Admin is part of institute creation — the
    // platform establishes the entity and hands it to someone to run.
    if (form.adminEmail) {
      assignPageAdmin(page, {
        name: form.adminName,
        email: form.adminEmail,
        role: 'Owner / Primary Admin',
      });
    }
    refresh();
    closeCreate();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex-1 w-full box-border">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface m-0">Institute Pages</h1>
          <p className="text-xs text-on-surface-variant m-0 mt-1 max-w-3xl">
            Create the institute, set its public identity and hand it to an Institute Admin. Courses,
            notices, vacancies and enquiries are then managed by that admin in their own console —
            the platform team does not maintain each institute's day-to-day content.
          </p>
        </div>
        <Button icon="add_business" onClick={() => setCreateOpen(true)}>
          Create Institute
        </Button>
      </div>

      <DataTable
        rows={pages}
        columns={[
          {
            key: 'page',
            label: 'Institute',
            render: (p) => (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary font-bold overflow-hidden shrink-0">
                  {p.logoUrl ? <img src={p.logoUrl} alt={p.name} className="w-full h-full object-cover" /> : p.logo}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-on-surface m-0 text-sm">{p.name}</p>
                  <p className="text-[11px] text-on-surface-variant m-0 font-mono">connectedus.in/{p.slug}</p>
                </div>
              </div>
            ),
          },
          { key: 'type', label: 'Type', render: (p) => <Badge tone="primary">{p.type}</Badge> },
          {
            key: 'location',
            label: 'Location',
            render: (p) => <span className="text-xs text-on-surface">{p.address || '—'}</span>,
          },
          {
            key: 'admin',
            label: 'Institute Admin',
            render: (p) =>
              p.admins.length > 0 ? (
                <div>
                  <p className="text-xs font-medium text-on-surface m-0">{p.admins[0].name}</p>
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
                {p.courses.length} courses · {p.opportunities.length} leads
              </span>
            ),
          },
          {
            key: 'status',
            label: 'Page',
            render: (p) => <StatusBadge status={p.enabled === false ? 'Disabled' : 'Active'} />,
          },
          {
            key: 'actions',
            label: 'Actions',
            align: 'right',
            render: (p) => (
              <div className="flex items-center justify-end gap-1">
                <Link to={`/${p.slug}`} title="Open public page">
                  <RowAction icon="open_in_new" title="Open public page" />
                </Link>
                <RowAction icon="manage_accounts" title="Manage admins" onClick={() => setAdminsFor(p)} />
                <RowAction
                  icon={p.enabled === false ? 'check_circle' : 'block'}
                  title={p.enabled === false ? 'Enable page' : 'Disable page'}
                  tone={p.enabled === false ? 'good' : 'warn'}
                  onClick={() => toggleEnabled(p)}
                />
              </div>
            ),
          },
        ]}
        empty={
          <EmptyState
            icon="storefront"
            title="No institutes yet"
            description="Create the first Institute Page — it goes live at its own URL immediately."
            actionLabel="Create Institute"
            onAction={() => setCreateOpen(true)}
          />
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
              connectedus.in/{previewSlug}
              {findPageBySlug(previewSlug) && (
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
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined">add_photo_alternate</span>
                )}
              </button>
              <Button type="button" variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>
                {form.logoUrl ? 'Change Logo' : 'Upload Logo'}
              </Button>
            </div>
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={setLogo} />
          </div>

          <div>
            <Label>Header Banner Images (2–3)</Label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {form.banners.map((src, i) => (
                <div key={i} className="relative w-20 h-14 rounded-lg overflow-hidden border border-outline-variant">
                  <img src={src} alt={`Banner ${i + 1}`} className="w-full h-full object-cover" />
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Address</Label>
              <Input value={form.address} onChange={set('address')} placeholder="City, State" />
            </div>
            <div>
              <Label>Website</Label>
              <Input value={form.website} onChange={set('website')} placeholder="www.example.com" />
            </div>
          </div>
          <div>
            <Label>Contact Number</Label>
            <Input value={form.contact} onChange={set('contact')} placeholder="+91-XXXXXXXXXX" />
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
            <Label>Assign Institute Admin</Label>
            <p className="text-[11px] text-on-surface-variant mt-0 mb-2">
              They manage this institute's courses, notices, vacancies and enquiries from their own
              console. You can add more admins later.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Input value={form.adminName} onChange={set('adminName')} placeholder="Admin name" />
              <Input type="email" value={form.adminEmail} onChange={set('adminEmail')} placeholder="admin@institute.in" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={closeCreate}>Cancel</Button>
            <Button type="submit">Create Institute</Button>
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
                    key={a.email}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-outline-variant"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-on-surface m-0 truncate">{a.name}</p>
                      <p className="text-[11px] text-on-surface-variant m-0 truncate">{a.email}</p>
                      {a.assignedAt && (
                        <p className="text-[10px] text-on-surface-variant m-0">Assigned {a.assignedAt}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge tone="neutral">{a.role.includes('Owner') ? 'Owner' : 'Admin'}</Badge>
                      <RowAction icon="person_remove" title="Revoke access" tone="danger" onClick={() => revokeAdmin(a.email)} />
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
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={newAdmin.name}
                    onChange={(e) => setNewAdmin((a) => ({ ...a, name: e.target.value }))}
                    placeholder="Name"
                  />
                  <Input
                    type="email"
                    required
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin((a) => ({ ...a, email: e.target.value }))}
                    placeholder="admin@institute.in"
                  />
                </div>
              </FormGroup>
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
