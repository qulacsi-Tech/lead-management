import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input, Label } from '../../components/ui/Field';
import { mockPages, addPage, INSTITUTE_TYPES } from '../mockData';

const BOARD_OPTIONS = ['CBSE', 'ICSE', 'State Board', 'IB', 'Other'];

function affiliationConfig(type) {
  if (type === 'School') return { mode: 'board', label: 'Board' };
  if (type === 'College') return { mode: 'university', label: 'Affiliating University' };
  return { mode: 'na', label: 'Affiliation' };
}

const emptyForm = {
  name: '', type: 'Coaching', tagline: '', logoUrl: null, banners: [],
  address: '', website: '', contact: '', affiliation: '',
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
  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const affiliation = affiliationConfig(form.type);

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
    addPage({ ...form, courses: [] });
    setPages([...mockPages]);
    closeCreate();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex-1 w-full box-border">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface m-0">Institute Pages</h1>
          <p className="text-xs text-on-surface-variant m-0 mt-1">
            Create and manage Institute/School/Coaching pages directly — each gets its own live URL as soon as it's created.
          </p>
        </div>
        <Button icon="add_business" onClick={() => setCreateOpen(true)}>
          Create Page
        </Button>
      </div>

      <Card className="p-0 overflow-hidden border border-outline-variant">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant text-xs text-on-surface-variant uppercase tracking-wider">
                <th className="py-3.5 px-5">Page</th>
                <th className="py-3.5 px-5">Type</th>
                <th className="py-3.5 px-5">URL</th>
                <th className="py-3.5 px-5">Followers</th>
                <th className="py-3.5 px-5">Opportunities</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-sm">
              {pages.map((p) => (
                <tr key={p.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary font-bold overflow-hidden shrink-0">
                        {p.logoUrl ? <img src={p.logoUrl} alt={p.name} className="w-full h-full object-cover" /> : p.logo}
                      </div>
                      <p className="font-bold text-on-surface m-0 text-sm">{p.name}</p>
                    </div>
                  </td>
                  <td className="py-4 px-5"><Badge tone="primary">{p.type}</Badge></td>
                  <td className="py-4 px-5 text-xs font-mono text-on-surface-variant">connectedus.in/{p.slug}</td>
                  <td className="py-4 px-5 text-xs font-medium text-on-surface">{p.followers.toLocaleString()}</td>
                  <td className="py-4 px-5 text-xs font-medium text-on-surface">{p.opportunities.length}</td>
                  <td className="py-4 px-5 text-right">
                    <Link to={`/${p.slug}`}>
                      <Button variant="ghost" size="sm" icon="open_in_new">View</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

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
            {affiliation.mode === 'board' && (
              <select
                value={form.affiliation}
                onChange={set('affiliation')}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer mt-1.5"
              >
                <option value="" disabled>Select a board</option>
                {BOARD_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            )}
            {affiliation.mode === 'university' && (
              <Input value={form.affiliation} onChange={set('affiliation')} placeholder="e.g. Devi Ahilya Vishwavidyalaya" />
            )}
            {affiliation.mode === 'na' && (
              <p className="text-xs text-on-surface-variant mb-0 mt-1.5">Not applicable for {form.type} pages.</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeCreate}>Cancel</Button>
            <Button type="submit">Create Page</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
