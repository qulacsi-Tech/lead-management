import { useCallback, useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import DataTable, { RowAction } from '../../components/ui/DataTable';
import { Textarea, Select, Label, FormGroup } from '../../components/ui/Field';
import { useInstitute } from '../../context/InstituteContext';
import {
  ApiError,
  fetchPageApplications,
  fetchPageOpportunities,
  updateApplication,
} from '../../Api/Api';

const STATUSES = ['New', 'Shortlisted', 'Contacted', 'Rejected', 'Closed'];
const TABS = ['All', ...STATUSES];

/**
 * INSTITUTE-OWNED. People who clicked Apply on one of this institute's
 * admission notices or job vacancies.
 *
 * Separate from Enquiries because the two are different: an enquiry is an
 * open-ended question, an application is addressed to one specific post and
 * carries the applicant's qualification and experience. They have different
 * status vocabularies and are worked by different people, so they get
 * different screens — the same split the backend makes between
 * `page_enquiries` and `opportunity_applications`.
 */
export default function InstituteApplications() {
  const { page } = useInstitute();
  const [applications, setApplications] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [tab, setTab] = useState('All');
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState(null);
  const [draftNote, setDraftNote] = useState('');
  const [draftStatus, setDraftStatus] = useState('New');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!page?.id) return;
    setLoading(true);
    try {
      const [apps, ops] = await Promise.allSettled([
        fetchPageApplications(page.id),
        fetchPageOpportunities(page.id),
      ]);
      // A failed request means "we do not know", and the only safe reading of
      // that is an empty list — never a fixture.
      setApplications(apps.status === 'fulfilled' && Array.isArray(apps.value) ? apps.value : []);
      setOpportunities(ops.status === 'fulfilled' && Array.isArray(ops.value) ? ops.value : []);
      setError(apps.status === 'rejected' ? 'Could not load applications.' : '');
    } finally {
      setLoading(false);
    }
  }, [page?.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!page) return null;

  const titleOf = (app) =>
    opportunities.find((o) => o.id === app.opportunity_id)?.title || 'Removed post';
  const typeOf = (app) => opportunities.find((o) => o.id === app.opportunity_id)?.type;

  const filtered = applications.filter((a) => {
    const matchesTab = tab === 'All' || (a.status || 'New') === tab;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (a.name || '').toLowerCase().includes(q) ||
      (a.email || '').toLowerCase().includes(q) ||
      titleOf(a).toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  const open = (app) => {
    setViewing(app);
    setDraftNote(app.note || '');
    setDraftStatus(app.status || 'New');
  };

  const save = async () => {
    try {
      await updateApplication(page.id, viewing.id, { status: draftStatus, note: draftNote });
      await load();
      setViewing(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update that application.');
    }
  };

  const setStatus = async (app, status) => {
    try {
      await updateApplication(page.id, app.id, { status });
      setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, status } : a)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update that application.');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex-1 w-full box-border">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-on-surface m-0">Applications</h1>
        <p className="text-xs text-on-surface-variant m-0 mt-1 max-w-3xl">
          People who applied to your admission notices and job vacancies, straight from your public
          page. Every applicant has a Connectedus profile — it is created as they apply.
        </p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-error-container text-on-error-container text-sm">{error}</div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-5">
        {TABS.map((t) => {
          const count = t === 'All'
            ? applications.length
            : applications.filter((a) => (a.status || 'New') === t).length;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3.5 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                tab === t
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-transparent text-on-surface-variant border-outline-variant hover:bg-surface-container-low'
              }`}
            >
              {t} {count > 0 && <span className="opacity-70">({count})</span>}
            </button>
          );
        })}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email or post"
          className="ml-auto bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface outline-none min-w-52"
        />
      </div>

      <DataTable
        rows={filtered}
        columns={[
          {
            key: 'applicant',
            label: 'Applicant',
            render: (a) => (
              <div className="min-w-0">
                <p className="text-sm font-bold text-on-surface m-0 truncate">{a.name}</p>
                <p className="text-[11px] text-on-surface-variant m-0 truncate">{a.email}</p>
              </div>
            ),
          },
          {
            key: 'post',
            label: 'Applied to',
            render: (a) => (
              <div className="min-w-0">
                <Badge tone={typeOf(a) === 'job' ? 'tertiary' : 'success'}>
                  {typeOf(a) === 'job' ? 'Vacancy' : 'Notice'}
                </Badge>
                <p className="text-[11px] text-on-surface-variant m-0 mt-1 truncate">{titleOf(a)}</p>
              </div>
            ),
          },
          {
            key: 'detail',
            label: 'Qualification / Experience',
            render: (a) => (
              <span className="text-xs text-on-surface-variant">
                {[a.qualification, a.experience].filter(Boolean).join(' · ') || '—'}
              </span>
            ),
          },
          {
            key: 'received',
            label: 'Received',
            render: (a) => (
              <span className="text-xs text-on-surface-variant">
                {a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}
              </span>
            ),
          },
          {
            key: 'status',
            label: 'Status',
            render: (a) => <StatusBadge status={a.status || 'New'} />,
          },
          {
            key: 'actions',
            label: 'Actions',
            align: 'right',
            render: (a) => (
              <div className="flex items-center justify-end gap-1">
                <RowAction icon="visibility" title="Open application" onClick={() => open(a)} />
                <RowAction
                  icon="star"
                  title="Shortlist"
                  tone="good"
                  onClick={() => setStatus(a, 'Shortlisted')}
                />
                <RowAction
                  icon="call"
                  title="Mark contacted"
                  onClick={() => setStatus(a, 'Contacted')}
                />
              </div>
            ),
          },
        ]}
        empty={
          loading ? (
            <p className="text-center text-xs text-on-surface-variant py-12 m-0">Loading applications…</p>
          ) : applications.length === 0 ? (
            <EmptyState
              icon="how_to_reg"
              title="No applications yet"
              description="When someone clicks Apply on one of your published notices or vacancies, they appear here."
            />
          ) : (
            <EmptyState compact icon="search_off" title="No applications match this filter" />
          )
        }
      />

      <Modal open={!!viewing} onClose={() => setViewing(null)} width={480}>
        {viewing && (
          <>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-on-surface m-0">{viewing.name}</h2>
                <p className="text-xs text-on-surface-variant m-0 mt-0.5">
                  Applied to {titleOf(viewing)}
                </p>
              </div>
              <StatusBadge status={viewing.status || 'New'} />
            </div>

            <div className="bg-surface-container-low rounded-2xl p-4 grid grid-cols-2 gap-3 mb-4 border border-outline-variant text-xs">
              <div><span className="text-on-surface-variant">Email</span><p className="font-semibold text-on-surface m-0 break-all">{viewing.email}</p></div>
              <div><span className="text-on-surface-variant">Phone</span><p className="font-semibold text-on-surface m-0">{viewing.phone || '—'}</p></div>
              <div><span className="text-on-surface-variant">City</span><p className="font-semibold text-on-surface m-0">{viewing.city || '—'}</p></div>
              <div><span className="text-on-surface-variant">State</span><p className="font-semibold text-on-surface m-0">{viewing.state || '—'}</p></div>
              <div><span className="text-on-surface-variant">Qualification</span><p className="font-semibold text-on-surface m-0">{viewing.qualification || '—'}</p></div>
              <div><span className="text-on-surface-variant">Experience</span><p className="font-semibold text-on-surface m-0">{viewing.experience || '—'}</p></div>
              {viewing.current_institute && (
                <div className="col-span-2">
                  <span className="text-on-surface-variant">Current institute</span>
                  <p className="font-semibold text-on-surface m-0">{viewing.current_institute}</p>
                </div>
              )}
              {viewing.message && (
                <div className="col-span-2">
                  <span className="text-on-surface-variant">Message</span>
                  <p className="font-semibold text-on-surface m-0">{viewing.message}</p>
                </div>
              )}
            </div>

            <FormGroup label="Status">
              <Select value={draftStatus} onChange={(e) => setDraftStatus(e.target.value)}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </FormGroup>

            <div className="mt-3">
              <Label small>Internal note</Label>
              <Textarea
                rows={3}
                value={draftNote}
                onChange={(e) => setDraftNote(e.target.value)}
                placeholder="Interview scheduled, documents requested, next follow-up"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-outline-variant pt-4 mt-4">
              <Button variant="outline" onClick={() => setViewing(null)}>Cancel</Button>
              <Button onClick={save} icon="save">Save</Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
