import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Input, Textarea, FormGroup } from '../components/ui/Field';
import { INSTITUTE_TYPES } from './mockData';
import PageHeader from './PageHeader';

const BOARD_OPTIONS = ['CBSE', 'ICSE', 'State Board', 'IB', 'Other'];

// Affiliation is conditional on institute type, per client feedback
// 12 Aug 2026 — see docs/CLIENT_FEEDBACK_2026-08-12.md, Section 6.3.
function affiliationConfig(type) {
  if (type === 'School') return { mode: 'board', label: 'Board' };
  if (type === 'College') return { mode: 'university', label: 'Affiliating University' };
  return { mode: 'na', label: 'Affiliation' };
}

export default function CreateInstitutePage() {
  const navigate = useNavigate();
  const [type, setType] = useState(null);
  const [form, setForm] = useState({ name: '', about: '', address: '', website: '', contact: '', affiliation: '' });
  const [created, setCreated] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const affiliation = type ? affiliationConfig(type) : null;

  if (created) {
    return (
      <div>
        <PageHeader title="Institute Page Created" />
        <Card className="p-6 text-center">
          <span className="material-symbols-outlined text-secondary text-[48px]">check_circle</span>
          <h3 className="text-lg font-bold text-on-surface mt-2">"{form.name || 'Your Institute'}" page is live</h3>
          <p className="text-sm text-on-surface-variant mb-4">
            You are now the Admin of this page. You can add more admins and start posting Admission
            Notices or Job Vacancies.
          </p>
          <Button onClick={() => navigate('/page')}>Go to Institute Page</Button>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Create Institute Page"
        subtitle="वह चुनेंगे: School / Coaching / College / University / Training Institute — फिर Page create करेंगे। उसके बाद वही व्यक्ति उस Page का Admin बन जाएगा, बिल्कुल Facebook Page की तरह।"
      />

      <Card className="p-5 mb-5">
        <p className="text-sm font-semibold text-on-surface mb-3">Step 1 — Choose type</p>
        <div className="flex flex-wrap gap-2">
          {INSTITUTE_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setType(t); setForm((f) => ({ ...f, affiliation: '' })); }}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all cursor-pointer ${
                type === t
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-transparent text-on-surface-variant border-outline-variant hover:bg-surface-container-low'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </Card>

      {type && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <p className="text-sm font-semibold text-on-surface">Step 2 — Page details</p>
            <Badge tone="primary">{type}</Badge>
          </div>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setCreated(true);
            }}
          >
            <FormGroup label="Page / Institute Name">
              <Input required value={form.name} onChange={set('name')} placeholder="e.g. Bright Future Coaching Institute" />
            </FormGroup>
            <FormGroup label="About">
              <Textarea rows={3} value={form.about} onChange={set('about')} placeholder="Short description of the institute" />
            </FormGroup>
            <div className="grid sm:grid-cols-2 gap-4">
              <FormGroup label="Address">
                <Input value={form.address} onChange={set('address')} placeholder="City, State" />
              </FormGroup>
              <FormGroup label="Website">
                <Input value={form.website} onChange={set('website')} placeholder="www.example.com" />
              </FormGroup>
            </div>
            <FormGroup label="Contact Number">
              <Input value={form.contact} onChange={set('contact')} placeholder="+91-XXXXXXXXXX" />
            </FormGroup>

            <FormGroup label={affiliation.label}>
              {affiliation.mode === 'board' && (
                <select
                  required
                  value={form.affiliation}
                  onChange={set('affiliation')}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                >
                  <option value="" disabled>Select a board</option>
                  {BOARD_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              )}
              {affiliation.mode === 'university' && (
                <Input
                  required
                  value={form.affiliation}
                  onChange={set('affiliation')}
                  placeholder="e.g. Devi Ahilya Vishwavidyalaya"
                />
              )}
              {affiliation.mode === 'na' && (
                <p className="text-xs text-on-surface-variant mb-0">
                  Not applicable for {type} pages.
                </p>
              )}
            </FormGroup>

            <Button type="submit" icon="add_business">Create Page</Button>
          </form>
        </Card>
      )}
    </div>
  );
}
