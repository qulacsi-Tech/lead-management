import { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Input, FormGroup } from '../components/ui/Field';
import {
  mockDesiredJob,
  mockGuessPapers,
  mockAdmissionLeads,
} from './mockData';
import PageHeader from './PageHeader';
import { useSession } from '../context/useSession';

const ALL_TABS = [
  { key: 'account', label: 'My Account', icon: 'person' },
  { key: 'job', label: 'Looking for Job?', icon: 'work', professionalOnly: true },
  { key: 'expert', label: 'Expert Opinion', icon: 'psychology', professionalOnly: true },
  { key: 'admission', label: 'Looking for Admission?', icon: 'school' },
];

function ManageRow({ item, primaryLabel }) {
  return (
    <div className="flex items-center justify-between border-b border-outline-variant last:border-0 py-3 flex-wrap gap-2">
      <div>
        <p className="text-sm font-semibold text-on-surface mb-0.5">{primaryLabel}</p>
        <p className="text-xs text-on-surface-variant mb-0">Last updated: {item.updatedOn || item.postedOn}</p>
      </div>
      <div className="flex items-center gap-3 text-xs text-on-surface-variant">
        <span>Reach {item.reach}</span>
        <span>Views {item.views}</span>
        <Badge tone="primary">Rank #{item.ranking}</Badge>
        <Button variant="ghost" size="sm" icon="edit">Edit</Button>
        <Button variant="ghost" size="sm" icon="arrow_upward">Push to top</Button>
      </div>
    </div>
  );
}

function AccountTab() {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {[
        { icon: 'manage_accounts', label: 'Manage Profile', desc: 'Edit your profile details, photo and headline.' },
        { icon: 'workspace_premium', label: 'Our Membership', desc: 'View / upgrade your membership plan.' },
        { icon: 'history', label: 'Desired History', desc: 'History of your desired job / admission posts.' },
        { icon: 'redeem', label: 'Referral Code', desc: 'Share your referral code and earn credits.' },
      ].map((c) => (
        <Card key={c.label} className="p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined">{c.icon}</span>
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface mb-0.5">{c.label}</p>
            <p className="text-xs text-on-surface-variant mb-0">{c.desc}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

function JobTab() {
  const j = mockDesiredJob;
  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h4 className="text-sm font-bold text-on-surface mb-3">Desired Job Details</h4>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-on-surface-variant mb-0.5">Role</p>
            <p className="text-on-surface font-semibold mb-0">{j.role}</p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant mb-0.5">Stream</p>
            <p className="text-on-surface font-semibold mb-0">{j.stream}</p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant mb-0.5">Preferred / Desired Location</p>
            <p className="text-on-surface font-semibold mb-0">{j.preferredLocation}</p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant mb-0.5">Expected Salary</p>
            <p className="text-on-surface font-semibold mb-0">{j.expectedSalary}</p>
          </div>
        </div>
        <p className="text-xs text-on-surface-variant mt-3 mb-0">
          Institutes searching for candidates in "{j.preferredLocation}" will see this as a matching lead in
          their Search Connections section.
        </p>
        <Button className="mt-3" size="sm" icon="edit">Update Desired Job Details</Button>
      </Card>

      <Card className="p-5">
        <h4 className="text-sm font-bold text-on-surface mb-1">Manage Post</h4>
        <ManageRow item={j} primaryLabel={`${j.role} — ${j.stream}`} />
      </Card>
    </div>
  );
}

function ExpertTab() {
  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-on-surface">Manage Paper</h4>
          <Button size="sm" icon="upload">Upload Guess Paper</Button>
        </div>
        {mockGuessPapers.map((gp) => (
          <ManageRow key={gp.id} item={gp} primaryLabel={gp.title} />
        ))}
      </Card>
    </div>
  );
}

function AdmissionTab() {
  const [form, setForm] = useState({ stream: '', course: '' });
  const [shared, setShared] = useState(false);
  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h4 className="text-sm font-bold text-on-surface mb-3">Desired (My) Admission Details</h4>
        <p className="text-xs text-on-surface-variant mb-3">
          Post an enquiry for any coaching crash course or stream — for yourself.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <FormGroup label="Stream / Course">
            <Input placeholder="e.g. MBA Admission" />
          </FormGroup>
          <FormGroup label="Preferred Location">
            <Input placeholder="e.g. Indore, Bhopal" />
          </FormGroup>
        </div>
        <Button className="mt-3" size="sm" icon="add">Post Admission Enquiry</Button>
      </Card>

      <Card className="p-5">
        <h4 className="text-sm font-bold text-on-surface mb-2">Post Admission Lead for a Friend</h4>
        <p className="text-xs text-on-surface-variant mb-3">
          Build an enquiry form you can share with your students — they check the box and submit.
        </p>
        {shared ? (
          <Badge tone="success">Shareable form link generated</Badge>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              setShared(true);
            }}
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <FormGroup label="Stream">
                <Input
                  value={form.stream}
                  onChange={(e) => setForm((f) => ({ ...f, stream: e.target.value }))}
                  placeholder="e.g. B.Tech Admission"
                />
              </FormGroup>
              <FormGroup label="Course">
                <Input
                  value={form.course}
                  onChange={(e) => setForm((f) => ({ ...f, course: e.target.value }))}
                  placeholder="e.g. Computer Science"
                />
              </FormGroup>
            </div>
            <label className="flex items-center gap-2 text-sm text-on-surface-variant">
              <input type="checkbox" className="w-4 h-4" defaultChecked />
              Include contact details field in the shared form
            </label>
            <Button type="submit" size="sm" icon="share">Generate Shareable Form</Button>
          </form>
        )}
      </Card>

      <Card className="p-5">
        <h4 className="text-sm font-bold text-on-surface mb-1">Manage Lead</h4>
        {mockAdmissionLeads.map((l) => (
          <ManageRow
            key={l.id}
            item={l}
            primaryLabel={`${l.stream} — ${l.course} (${l.type === 'self' ? 'Self' : 'For Friend'})`}
          />
        ))}
      </Card>
    </div>
  );
}

export default function ProfessionalDashboard() {
  const { role } = useSession();
  const isStudent = role === 'student';
  const TABS = ALL_TABS.filter((t) => !(t.professionalOnly && isStudent));
  const [tab, setTab] = useState('account');

  return (
    <div>
      <PageHeader
        title={isStudent ? 'Student Dashboard' : 'Professional Dashboard'}
        subtitle={
          isStudent
            ? 'My Account · Looking for Admission — Job posting and Expert Opinion are Professional-only features.'
            : 'My Account · Looking for Job · Expert Opinion · Looking for Admission'
        }
      />

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

      {tab === 'account' && <AccountTab />}
      {tab === 'job' && <JobTab />}
      {tab === 'expert' && <ExpertTab />}
      {tab === 'admission' && <AdmissionTab />}
    </div>
  );
}
