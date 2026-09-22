import { useCallback, useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import DataTable, { RowAction } from '../../components/ui/DataTable';
import { Input, Select, Label, FormGroup } from '../../components/ui/Field';
import { useInstitute } from '../../context/InstituteContext';
import {
  fetchPageOpportunities,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  pushToTopOpportunity,
} from '../../Api/Api';
import { EMPLOYMENT_TYPES } from '../../constants/taxonomy';
import { upsertOpportunity, removeOpportunity } from '../mockData';
import AdCopyFields from '../../components/ui/AdCopyFields';

const TABS = ['All', 'Draft', 'Published', 'Expired', 'Closed'];

const CONFIG = {
  admission: {
    title: 'Admission Notices',
    subtitle:
      "Admission announcements for your institute. Published notices reach your followers' feeds and appear on your public page.",
    addLabel: 'Create Notice',
    icon: 'campaign',
    emptyTitle: 'No admission notices yet',
    emptyBody: 'Announce an open admission cycle — it becomes a Sell Lead visible to students following your page.',
    titleOf: (o) => o.title || o.session,
    blank: {
      type: 'admission', title: '', courseId: '', session: '', startDate: '', endDate: '',
      eligibility: '', description: '', applyUrl: '', status: 'Draft',
    },
  },
  job: {
    title: 'Job Vacancies',
    subtitle:
      'Teaching and staff openings at your institute. Published vacancies reach professionals looking for a role.',
    addLabel: 'Create Vacancy',
    icon: 'work',
    emptyTitle: 'No job vacancies yet',
    emptyBody: 'Post an opening — it becomes a Sell Lead visible to professionals on Connectedus.',
    titleOf: (o) => o.title || o.position,
    blank: {
      type: 'job', title: '', position: '', subject: '', department: '', employmentType: EMPLOYMENT_TYPES[0],
      location: '', experience: '', qualification: '', salary: '', skills: [], applyBefore: '',
      applyUrl: '', description: '', status: 'Draft',
    },
  },
};

export default function ManageOpportunities({ type }) {
  const cfg = CONFIG[type];
  const { page, commit } = useInstitute();
  const [tab, setTab] = useState('All');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [skillInput, setSkillInput] = useState('');
  const [opportunities, setOpportunities] = useState([]);

  const loadOpps = useCallback(async () => {
    if (!page?.id) return;
    try {
      const res = await fetchPageOpportunities(page.id);
      if (Array.isArray(res)) setOpportunities(res);
      else setOpportunities(page?.opportunities || []);
    } catch (err) {
      console.warn('Failed to fetch opportunities:', err);
      setOpportunities(page?.opportunities || []);
    }
  }, [page?.id, page?.opportunities]);


  useEffect(() => {
    loadOpps();
  }, [loadOpps]);

  if (!page) return null;

  const sourceOpps = opportunities.length > 0 ? opportunities : (page.opportunities || []);
  const all = sourceOpps.filter((o) => o.type === type);
  const filtered = all.filter((o) => {
    const status = o.status || 'Published';
    const matchesTab = tab === 'All' || status === tab;
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || (cfg.titleOf(o) || '').toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  const set = (key) => (e) => setEditing((f) => ({ ...f, [key]: e.target.value }));
  const openCreate = () => { setEditing({ ...cfg.blank }); setSkillInput(''); };
  const openEdit = (op) => { setEditing({ ...cfg.blank, ...op }); setSkillInput(''); };

  const persist = async (draft) => {
    if (page?.id) {
      try {
        const payload = {
          type: draft.type,
          title: draft.title || (draft.type === 'admission' ? 'Admission Notice' : 'Job Opening'),
          description: draft.description,
          status: draft.status || 'Draft',
          session: draft.session || undefined,
          start_date: draft.startDate || undefined,
          end_date: draft.endDate || undefined,
          eligibility: draft.eligibility || undefined,
          position: draft.position || undefined,
          subject: draft.subject || undefined,
          department: draft.department || undefined,
          employment_type: draft.employmentType || undefined,
          location: draft.location || undefined,
          experience: draft.experience || undefined,
          qualification: draft.qualification || undefined,
          salary: draft.salary || undefined,
          skills: draft.skills || [],
          apply_before: draft.applyBefore || undefined,
          apply_url: draft.applyUrl || undefined,
        };
        if (draft.id) {
          await updateOpportunity(page.id, draft.id, payload);
        } else {
          await createOpportunity(page.id, payload);
        }
        await loadOpps();
      } catch (err) {
        console.warn('Failed to save opportunity to server:', err);
      }
    }
    commit(() => upsertOpportunity(page, {
      ...draft,
      reach: draft.reach ?? 0,
      views: draft.views ?? 0,
      ranking: draft.ranking ?? all.length + 1,
    }));
    setEditing(null);
  };

  const save = (e) => { e.preventDefault(); persist(editing); };

  const savePublished = () => persist({
    ...editing,
    status: 'Published',
    publishedAt: editing.publishedAt || new Date().toISOString().slice(0, 10),
  });

  const setStatus = async (op, status) => {
    if (page?.id && op.id) {
      try {
        await updateOpportunity(page.id, op.id, { status });
        await loadOpps();
      } catch (err) {
        console.warn('Failed to update opportunity status:', err);
      }
    }
    commit(() => upsertOpportunity(page, { ...op, status }));
  };

  const pushToTop = async (op) => {
    if (page?.id && op.id) {
      try {
        await pushToTopOpportunity(page.id, op.id);
        await loadOpps();
      } catch (err) {
        console.warn('Failed to push opportunity to top:', err);
      }
    }
  };

  const remove = async (op) => {
    if (window.confirm(`Delete "${cfg.titleOf(op)}"?`)) {
      if (page?.id && op.id) {
        try {
          await deleteOpportunity(page.id, op.id);
          await loadOpps();
        } catch (err) {
          console.warn('Failed to delete opportunity:', err);
        }
      }
      commit(() => removeOpportunity(page, op.id));
    }
  };



  const addSkill = () => {
    const value = skillInput.trim();
    if (!value) return;
    setEditing((f) => ({ ...f, skills: f.skills.includes(value) ? f.skills : [...f.skills, value] }));
    setSkillInput('');
  };

  const columns = [
    {
      key: 'title',
      label: type === 'admission' ? 'Notice' : 'Position',
      render: (o) => (
        <div>
          <p className="font-bold text-on-surface m-0 text-sm">{cfg.titleOf(o) || 'Untitled'}</p>
          <p className="text-[11px] text-on-surface-variant m-0">
            {type === 'admission'
              ? `Session ${o.session || '—'}`
              : `${o.department || '—'} · ${o.employmentType || '—'}`}
          </p>
        </div>
      ),
    },
    {
      key: 'deadline',
      label: type === 'admission' ? 'Admission Window' : 'Apply Before',
      render: (o) => (
        <span className="text-xs text-on-surface">
          {type === 'admission' ? `${o.startDate || '—'} → ${o.endDate || '—'}` : o.applyBefore || '—'}
        </span>
      ),
    },
    {
      key: 'reach',
      label: 'Reach / Views',
      render: (o) => (
        <span className="text-xs text-on-surface-variant">
          {(o.reach ?? 0).toLocaleString()} / {(o.views ?? 0).toLocaleString()}
        </span>
      ),
    },
    { key: 'rank', label: 'Rank', render: (o) => <span className="text-xs text-on-surface">#{o.ranking ?? '—'}</span> },
    { key: 'status', label: 'Status', render: (o) => <StatusBadge status={o.status || 'Published'} /> },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (o) => (
        <div className="flex items-center justify-end gap-1">
          <RowAction icon="visibility" title="View details" onClick={() => setViewing(o)} />
          <RowAction icon="edit" title="Edit" onClick={() => openEdit(o)} />
          {(o.status || 'Published') === 'Published' ? (
            <>
              <RowAction icon="arrow_upward" title="Push to top" onClick={() => pushToTop(o)} />
              <RowAction
                icon={type === 'admission' ? 'event_busy' : 'do_not_disturb_on'}
                title={type === 'admission' ? 'Mark expired' : 'Close vacancy'}
                tone="warn"
                onClick={() => setStatus(o, type === 'admission' ? 'Expired' : 'Closed')}
              />
            </>
          ) : (
            <RowAction icon="publish" title="Publish" tone="good" onClick={() => setStatus(o, 'Published')} />
          )}
          <RowAction icon="delete" title="Delete" tone="danger" onClick={() => remove(o)} />
        </div>
      ),
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto flex-1 w-full box-border">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface m-0">{cfg.title}</h1>
          <p className="text-xs text-on-surface-variant m-0 mt-1 max-w-2xl">{cfg.subtitle}</p>
        </div>
        <Button icon="add" onClick={openCreate}>{cfg.addLabel}</Button>
      </div>

      <Card className="p-4 mb-6 border border-outline-variant flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-80 relative">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-base">search</span>
          <input
            type="text"
            placeholder={type === 'admission' ? 'Search notices...' : 'Search vacancies...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <div className="flex bg-surface-container-low p-1 rounded-lg border border-outline-variant flex-wrap">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1 text-xs font-semibold rounded-md border-none cursor-pointer transition-all ${
                tab === t ? 'bg-surface-container-lowest text-primary shadow-xs' : 'bg-transparent text-on-surface-variant'
              }`}
            >
              {t}
              {t !== 'All' && (
                <span className="ml-1 opacity-60">
                  {all.filter((o) => (o.status || 'Published') === t).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={filtered}
        empty={
          all.length === 0 ? (
            <EmptyState
              icon={cfg.icon}
              title={cfg.emptyTitle}
              description={cfg.emptyBody}
              actionLabel={cfg.addLabel}
              onAction={openCreate}
            />
          ) : (
            <EmptyState compact icon="search_off" title="Nothing matches this filter" />
          )
        }
      />

      {/* Create / Edit */}
      <Modal open={!!editing} onClose={() => setEditing(null)} width={560}>
        {editing && (
          <>
            <h2 className="text-lg font-bold text-on-surface m-0 mb-1">
              {editing.id ? `Edit ${type === 'admission' ? 'Notice' : 'Vacancy'}` : cfg.addLabel}
            </h2>
            <p className="text-xs text-on-surface-variant m-0 mb-5">
              Saved as a draft unless you publish it. Published items become Sell Leads on Connectedus.
            </p>
            <form onSubmit={save} className="space-y-4 max-h-[62vh] overflow-y-auto pr-1">
              {type === 'admission' ? (
                <>
                  <FormGroup label="Course / Programme">
                    <Select
                      value={editing.courseId || ''}
                      onChange={(e) => {
                        const course = page.courses.find((c) => c.id === e.target.value);
                        setEditing((f) => ({
                          ...f,
                          courseId: e.target.value,
                          eligibility: course?.eligibility || f.eligibility,
                        }));
                      }}
                    >
                      <option value="">Not linked to a course</option>
                      {page.courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                  </FormGroup>
                  <div className="grid grid-cols-3 gap-3">
                    <FormGroup label="Session">
                      <Input value={editing.session} onChange={set('session')} placeholder="2026-27" />
                    </FormGroup>
                    <FormGroup label="Starts">
                      <Input type="date" value={editing.startDate} onChange={set('startDate')} />
                    </FormGroup>
                    <FormGroup label="Ends">
                      <Input type="date" value={editing.endDate} onChange={set('endDate')} />
                    </FormGroup>
                  </div>
                  <FormGroup label="Eligibility">
                    <Input value={editing.eligibility} onChange={set('eligibility')} placeholder="e.g. Class 12 pass / appearing, PCM" />
                  </FormGroup>
                </>
              ) : (
                <>
                  <FormGroup label="Position">
                    <Input required value={editing.position} onChange={set('position')} placeholder="e.g. Physics Faculty" />
                  </FormGroup>
                  <div className="grid grid-cols-2 gap-3">
                    <FormGroup label="Subject">
                      <Input value={editing.subject} onChange={set('subject')} placeholder="Physics" />
                    </FormGroup>
                    <FormGroup label="Department">
                      <Input value={editing.department} onChange={set('department')} placeholder="Science" />
                    </FormGroup>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormGroup label="Employment Type">
                      <Select value={editing.employmentType} onChange={set('employmentType')}>
                        {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </Select>
                    </FormGroup>
                    <FormGroup label="Location">
                      <Input value={editing.location} onChange={set('location')} placeholder="Indore Campus" />
                    </FormGroup>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormGroup label="Experience">
                      <Input value={editing.experience} onChange={set('experience')} placeholder="3+ years" />
                    </FormGroup>
                    <FormGroup label="Qualification">
                      <Input value={editing.qualification} onChange={set('qualification')} placeholder="M.Sc Physics" />
                    </FormGroup>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormGroup label="Salary Range">
                      <Input value={editing.salary} onChange={set('salary')} placeholder="6,00,000 – 9,00,000 / yr" />
                    </FormGroup>
                    <FormGroup label="Apply Before">
                      <Input type="date" value={editing.applyBefore} onChange={set('applyBefore')} />
                    </FormGroup>
                  </div>
                  <FormGroup label="Skills">
                    <div className="flex gap-2">
                      <Input
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                        placeholder="Add a skill and press Enter"
                      />
                      <Button type="button" variant="outline" size="sm" onClick={addSkill}>Add</Button>
                    </div>
                    {editing.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {editing.skills.map((s) => (
                          <span key={s} className="inline-flex items-center gap-1 text-xs bg-surface-container-high px-2.5 py-1 rounded-lg text-on-surface-variant">
                            {s}
                            <button
                              type="button"
                              onClick={() => setEditing((f) => ({ ...f, skills: f.skills.filter((x) => x !== s) }))}
                              className="bg-transparent border-none cursor-pointer p-0 flex items-center text-on-surface-variant"
                              aria-label={`Remove ${s}`}
                            >
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </FormGroup>
                </>
              )}

              <AdCopyFields
                section={type}
                title={editing.title}
                description={editing.description}
                onTitleChange={(v) => setEditing((f) => ({ ...f, title: v }))}
                onDescriptionChange={(v) => setEditing((f) => ({ ...f, description: v }))}
                instituteName={page.name}
              />

              {/* Applications are taken on the page itself (see the Apply
                  dialog on the public institute page), so an external link is
                  only for institutes that must route elsewhere. Client
                  feedback 22 Sep 2026: do not redirect the applicant away. */}
              <FormGroup label="External application link (optional)">
                <Input value={editing.applyUrl} onChange={set('applyUrl')} placeholder="Leave blank — applicants apply on your page" />
              </FormGroup>

              <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                <Button type="submit" variant="soft">Save as Draft</Button>
                <Button type="button" onClick={savePublished}>
                  {editing.status === 'Published' ? 'Save & Keep Published' : 'Save & Publish'}
                </Button>
              </div>
            </form>
          </>
        )}
      </Modal>

      {/* Detail view */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} width={480}>
        {viewing && (
          <>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-on-surface m-0">{cfg.titleOf(viewing)}</h2>
                <p className="text-xs text-on-surface-variant m-0 mt-0.5">{page.name}</p>
              </div>
              <StatusBadge status={viewing.status || 'Published'} />
            </div>

            <div className="bg-surface-container-low rounded-2xl p-4 grid grid-cols-2 gap-3 mb-4 border border-outline-variant text-xs">
              {type === 'admission' ? (
                <>
                  <div><span className="text-on-surface-variant">Session</span><p className="font-semibold text-on-surface m-0">{viewing.session || '—'}</p></div>
                  <div><span className="text-on-surface-variant">Eligibility</span><p className="font-semibold text-on-surface m-0">{viewing.eligibility || '—'}</p></div>
                  <div><span className="text-on-surface-variant">Starts</span><p className="font-semibold text-on-surface m-0">{viewing.startDate || '—'}</p></div>
                  <div><span className="text-on-surface-variant">Ends</span><p className="font-semibold text-on-surface m-0">{viewing.endDate || '—'}</p></div>
                </>
              ) : (
                <>
                  <div><span className="text-on-surface-variant">Department</span><p className="font-semibold text-on-surface m-0">{viewing.department || '—'}</p></div>
                  <div><span className="text-on-surface-variant">Type</span><p className="font-semibold text-on-surface m-0">{viewing.employmentType || '—'}</p></div>
                  <div><span className="text-on-surface-variant">Location</span><p className="font-semibold text-on-surface m-0">{viewing.location || '—'}</p></div>
                  <div><span className="text-on-surface-variant">Experience</span><p className="font-semibold text-on-surface m-0">{viewing.experience || '—'}</p></div>
                  <div><span className="text-on-surface-variant">Qualification</span><p className="font-semibold text-on-surface m-0">{viewing.qualification || '—'}</p></div>
                  <div><span className="text-on-surface-variant">Salary</span><p className="font-semibold text-on-surface m-0">{viewing.salary || '—'}</p></div>
                </>
              )}
              <div><span className="text-on-surface-variant">Reach</span><p className="font-semibold text-on-surface m-0">{(viewing.reach ?? 0).toLocaleString()}</p></div>
              <div><span className="text-on-surface-variant">Views</span><p className="font-semibold text-on-surface m-0">{(viewing.views ?? 0).toLocaleString()}</p></div>
            </div>

            {viewing.skills?.length > 0 && (
              <div className="mb-4">
                <Label small>Skills</Label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {viewing.skills.map((s) => <Badge key={s} tone="tertiary">{s}</Badge>)}
                </div>
              </div>
            )}

            {viewing.description && (
              <div className="mb-4">
                <Label small>Description</Label>
                <p className="text-sm text-on-surface-variant m-0">{viewing.description}</p>
              </div>
            )}

            {viewing.applyUrl && (
              <div className="mb-4">
                <Label small>Apply via</Label>
                <p className="text-sm text-primary m-0">{viewing.applyUrl}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-outline-variant pt-4">
              <Button variant="outline" onClick={() => setViewing(null)}>Close</Button>
              <Button icon="edit" onClick={() => { openEdit(viewing); setViewing(null); }}>Edit</Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
