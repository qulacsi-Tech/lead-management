import { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Input, FormGroup } from '../components/ui/Field';
import {
  mockGuessPapers,
  mockAdmissionLeads,
} from './mockData';
import { useDesiredCriteria } from './useDesiredCriteria';
import PageHeader from './PageHeader';

// Role-based branching is paused per client feedback 12 Aug 2026 — see
// docs/CLIENT_FEEDBACK_2026-08-12.md, Section 1. Every signed-in user sees
// all four tabs now, regardless of stored role.
const TABS = [
  { key: 'account', label: 'My Account', icon: 'person' },
  { key: 'job', label: 'Looking for Job?', icon: 'work' },
  { key: 'expert', label: 'Expert Opinion', icon: 'psychology' },
  { key: 'admission', label: 'Looking for Admission?', icon: 'school' },
];

// Audited 16 Aug 2026 (docs/CLIENT_FEEDBACK_2026-08-16.md, Section 2) — Edit
// and Push to top used to be decorative (no handlers at all). Now wired:
// Push to top moves the item to rank #1 immediately, Edit toggles an inline
// form for that row's key fields.
function ManageRow({ item, primaryLabel, onPushToTop, editing, onToggleEdit, editForm }) {
  return (
    <div className="border-b border-outline-variant last:border-0 py-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-sm font-semibold text-on-surface mb-0.5">{primaryLabel}</p>
          <p className="text-xs text-on-surface-variant mb-0">Last updated: {item.updatedOn || item.postedOn}</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-on-surface-variant">
          <span>Reach {item.reach}</span>
          <span>Views {item.views}</span>
          <Badge tone="primary">Rank #{item.ranking}</Badge>
          <Button variant="ghost" size="sm" icon="edit" onClick={onToggleEdit}>Edit</Button>
          <Button variant="ghost" size="sm" icon="arrow_upward" onClick={onPushToTop} disabled={item.ranking === 1}>
            Push to top
          </Button>
        </div>
      </div>
      {editing && <div className="mt-3 pt-3 border-t border-outline-variant">{editForm}</div>}
    </div>
  );
}

function pushToTop(list, id) {
  const target = list.find((x) => x.id === id);
  if (!target) return list;
  return list.map((x) => {
    if (x.id === id) return { ...x, ranking: 1 };
    if (x.ranking <= target.ranking) return { ...x, ranking: x.ranking + 1 };
    return x;
  });
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

// Fixed 16 Aug 2026 — this used to be a read-only display of hardcoded mock
// data with a dead "Update" button. It's a real editable form now.
function JobTab() {
  const { desiredJob: job, setDesiredJob: setJob } = useDesiredCriteria();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(job);

  const startEdit = () => {
    setDraft(job);
    setEditing(true);
  };

  const save = (e) => {
    e.preventDefault();
    setJob((j) => ({ ...j, ...draft }));
    setEditing(false);
  };

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h4 className="text-sm font-bold text-on-surface mb-3">Desired Job Details</h4>

        {editing ? (
          <form onSubmit={save} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <FormGroup label="Role">
                <Input value={draft.role} onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))} placeholder="e.g. Senior Math Faculty" />
              </FormGroup>
              <FormGroup label="Stream">
                <Input value={draft.stream} onChange={(e) => setDraft((d) => ({ ...d, stream: e.target.value }))} placeholder="e.g. JEE / NEET" />
              </FormGroup>
              <FormGroup label="Preferred Location">
                <Input value={draft.preferredLocation} onChange={(e) => setDraft((d) => ({ ...d, preferredLocation: e.target.value }))} placeholder="e.g. Indore, Bhopal" />
              </FormGroup>
              <FormGroup label="Expected Salary">
                <Input value={draft.expectedSalary} onChange={(e) => setDraft((d) => ({ ...d, expectedSalary: e.target.value }))} placeholder="e.g. ₹60,000 - ₹80,000/month" />
              </FormGroup>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm">Save</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </form>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-on-surface-variant mb-0.5">Role</p>
                <p className="text-on-surface font-semibold mb-0">{job.role}</p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant mb-0.5">Stream</p>
                <p className="text-on-surface font-semibold mb-0">{job.stream}</p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant mb-0.5">Preferred / Desired Location</p>
                <p className="text-on-surface font-semibold mb-0">{job.preferredLocation}</p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant mb-0.5">Expected Salary</p>
                <p className="text-on-surface font-semibold mb-0">{job.expectedSalary}</p>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant mt-3 mb-0">
              Institutes searching for candidates in "{job.preferredLocation}" will see this as a matching lead in
              their Search Connections section.
            </p>
            <Button className="mt-3" size="sm" icon="edit" onClick={startEdit}>Update Desired Job Details</Button>
          </>
        )}
      </Card>

      <Card className="p-5">
        <h4 className="text-sm font-bold text-on-surface mb-1">Manage Post</h4>
        <ManageRow
          item={job}
          primaryLabel={`${job.role} — ${job.stream}`}
          onPushToTop={() => setJob((j) => ({ ...j, ranking: 1 }))}
          editing={editing}
          onToggleEdit={editing ? () => setEditing(false) : startEdit}
          editForm={null}
        />
      </Card>
    </div>
  );
}

function ExpertTab() {
  const [papers, setPapers] = useState(mockGuessPapers);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const upload = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setPapers((prev) => [
      { id: `gp-${Date.now()}`, title: title.trim(), updatedOn: new Date().toISOString().slice(0, 10), reach: 0, views: 0, ranking: prev.length + 1 },
      ...prev,
    ]);
    setTitle('');
    setUploading(false);
  };

  const saveEdit = (id) => {
    setPapers((prev) => prev.map((p) => (p.id === id ? { ...p, title: editTitle } : p)));
    setEditingId(null);
  };

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-on-surface">Manage Paper</h4>
          <Button size="sm" icon="upload" onClick={() => setUploading((u) => !u)}>Upload Guess Paper</Button>
        </div>

        {uploading && (
          <form onSubmit={upload} className="flex gap-2 mb-4">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Paper title, e.g. JEE Main 2026 - Physics Guess Paper Set B" />
            <Button type="submit" size="sm">Add</Button>
          </form>
        )}

        {papers.map((gp) => (
          <ManageRow
            key={gp.id}
            item={gp}
            primaryLabel={gp.title}
            onPushToTop={() => setPapers((prev) => pushToTop(prev, gp.id))}
            editing={editingId === gp.id}
            onToggleEdit={() => {
              if (editingId === gp.id) { setEditingId(null); return; }
              setEditTitle(gp.title);
              setEditingId(gp.id);
            }}
            editForm={
              <div className="flex gap-2">
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                <Button size="sm" onClick={() => saveEdit(gp.id)}>Save</Button>
              </div>
            }
          />
        ))}
      </Card>
    </div>
  );
}

// Fixed 16 Aug 2026 — "Desired (My) Admission Details" used to be
// uncontrolled inputs with a dead submit button. Real form now, feeding a
// real (locally-mutable) admission-leads list, same as the friend flow.
function AdmissionTab() {
  const [leads, setLeads] = useState(mockAdmissionLeads);
  const [selfForm, setSelfForm] = useState({ stream: '', course: '' });
  const [selfPosted, setSelfPosted] = useState(false);

  const [friendForm, setFriendForm] = useState({ stream: '', course: '' });
  const [shared, setShared] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ stream: '', course: '' });

  const submitSelf = (e) => {
    e.preventDefault();
    if (!selfForm.stream.trim()) return;
    setLeads((prev) => [
      { id: `al-${Date.now()}`, type: 'self', stream: selfForm.stream, course: selfForm.course, postedOn: new Date().toISOString().slice(0, 10), reach: 0, views: 0, ranking: prev.length + 1 },
      ...prev,
    ]);
    setSelfPosted(true);
  };

  const submitFriend = (e) => {
    e.preventDefault();
    setLeads((prev) => [
      { id: `al-${Date.now()}`, type: 'friend', stream: friendForm.stream, course: friendForm.course, postedOn: new Date().toISOString().slice(0, 10), reach: 0, views: 0, ranking: prev.length + 1 },
      ...prev,
    ]);
    setShared(true);
  };

  const saveEdit = (id) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...editForm } : l)));
    setEditingId(null);
  };

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h4 className="text-sm font-bold text-on-surface mb-3">Desired (My) Admission Details</h4>
        <p className="text-xs text-on-surface-variant mb-3">
          Post an enquiry for any coaching crash course or stream — for yourself.
        </p>
        {selfPosted ? (
          <Badge tone="success">Enquiry posted — see it below in Manage Lead</Badge>
        ) : (
          <form onSubmit={submitSelf} className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-4">
              <FormGroup label="Stream / Course">
                <Input
                  required
                  value={selfForm.stream}
                  onChange={(e) => setSelfForm((f) => ({ ...f, stream: e.target.value }))}
                  placeholder="e.g. MBA Admission"
                />
              </FormGroup>
              <FormGroup label="Preferred Location">
                <Input
                  value={selfForm.course}
                  onChange={(e) => setSelfForm((f) => ({ ...f, course: e.target.value }))}
                  placeholder="e.g. Indore, Bhopal"
                />
              </FormGroup>
            </div>
            <Button type="submit" size="sm" icon="add">Post Admission Enquiry</Button>
          </form>
        )}
      </Card>

      <Card className="p-5">
        <h4 className="text-sm font-bold text-on-surface mb-2">Post Admission Lead for a Friend</h4>
        <p className="text-xs text-on-surface-variant mb-3">
          Build an enquiry form you can share with your students — they check the box and submit.
        </p>
        {shared ? (
          <Badge tone="success">Shareable form link generated</Badge>
        ) : (
          <form onSubmit={submitFriend} className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-4">
              <FormGroup label="Stream">
                <Input
                  value={friendForm.stream}
                  onChange={(e) => setFriendForm((f) => ({ ...f, stream: e.target.value }))}
                  placeholder="e.g. B.Tech Admission"
                />
              </FormGroup>
              <FormGroup label="Course">
                <Input
                  value={friendForm.course}
                  onChange={(e) => setFriendForm((f) => ({ ...f, course: e.target.value }))}
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
        {leads.map((l) => (
          <ManageRow
            key={l.id}
            item={l}
            primaryLabel={`${l.stream} — ${l.course} (${l.type === 'self' ? 'Self' : 'For Friend'})`}
            onPushToTop={() => setLeads((prev) => pushToTop(prev, l.id))}
            editing={editingId === l.id}
            onToggleEdit={() => {
              if (editingId === l.id) { setEditingId(null); return; }
              setEditForm({ stream: l.stream, course: l.course });
              setEditingId(l.id);
            }}
            editForm={
              <div className="grid sm:grid-cols-2 gap-2">
                <Input value={editForm.stream} onChange={(e) => setEditForm((f) => ({ ...f, stream: e.target.value }))} placeholder="Stream" />
                <Input value={editForm.course} onChange={(e) => setEditForm((f) => ({ ...f, course: e.target.value }))} placeholder="Course" />
                <Button size="sm" className="w-fit" onClick={() => saveEdit(l.id)}>Save</Button>
              </div>
            }
          />
        ))}
      </Card>
    </div>
  );
}

export default function ProfessionalDashboard() {
  const [tab, setTab] = useState('account');

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="My Account · Looking for Job · Expert Opinion · Looking for Admission"
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
