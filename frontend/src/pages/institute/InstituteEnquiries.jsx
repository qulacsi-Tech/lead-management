import { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import DataTable, { RowAction } from '../../components/ui/DataTable';
import { Textarea, Select, Label, FormGroup } from '../../components/ui/Field';
import { useInstitute } from '../../context/InstituteContext';
import { enquiriesForPage, updateEnquiry, ENQUIRY_STATUSES } from '../mockData';

const TABS = ['All', ...ENQUIRY_STATUSES];

/**
 * INSTITUTE-OWNED. Enquiries raised on this institute's public page. The Main
 * Admin's /admin/enquiries screen is a platform-wide read-only view; responding
 * to an enquiry belongs to the institute it was addressed to.
 */
export default function InstituteEnquiries() {
  const { page, commit, revision } = useInstitute();
  const [tab, setTab] = useState('All');
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState(null);
  const [draftNote, setDraftNote] = useState('');
  const [draftStatus, setDraftStatus] = useState('New');

  if (!page) return null;

  // eslint-disable-next-line no-unused-expressions
  revision; // re-read the mock list after each commit
  const all = enquiriesForPage(page.slug);

  const filtered = all.filter((e) => {
    const matchesTab = tab === 'All' || e.status === tab;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q || e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q) ||
      (e.course || '').toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  const openEnquiry = (e) => {
    setViewing(e);
    setDraftNote(e.note || '');
    setDraftStatus(e.status);
  };

  const saveResponse = () => {
    commit(() => updateEnquiry(viewing.id, { note: draftNote, status: draftStatus }));
    setViewing(null);
  };

  const quickStatus = (enquiry, status) => commit(() => updateEnquiry(enquiry.id, { status }));

  const columns = [
    {
      key: 'name',
      label: 'Enquirer',
      render: (e) => (
        <div>
          <p className="font-bold text-on-surface m-0 text-sm">{e.name}</p>
          <p className="text-[11px] text-on-surface-variant m-0">{e.email}</p>
        </div>
      ),
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (e) => (
        <div className="text-xs text-on-surface-variant">
          <p className="m-0 text-on-surface font-medium">{e.phone}</p>
          <p className="m-0">{e.city}</p>
        </div>
      ),
    },
    {
      key: 'course',
      label: 'Interested In',
      render: (e) => (
        <div>
          <p className="text-xs font-medium text-on-surface m-0">{e.course}</p>
          {e.specialization && (
            <p className="text-[11px] text-on-surface-variant m-0">{e.specialization}</p>
          )}
        </div>
      ),
    },
    { key: 'date', label: 'Received', render: (e) => <span className="text-xs text-on-surface-variant">{e.submittedAt}</span> },
    { key: 'status', label: 'Status', render: (e) => <StatusBadge status={e.status} /> },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (e) => (
        <div className="flex items-center justify-end gap-1">
          <RowAction icon="visibility" title="Open enquiry" onClick={() => openEnquiry(e)} />
          {e.status === 'New' && (
            <RowAction icon="call" title="Mark contacted" tone="good" onClick={() => quickStatus(e, 'Contacted')} />
          )}
          {e.status !== 'Closed' && (
            <RowAction icon="task_alt" title="Close enquiry" tone="warn" onClick={() => quickStatus(e, 'Closed')} />
          )}
        </div>
      ),
    },
  ];

  const newCount = all.filter((e) => e.status === 'New').length;

  return (
    <div className="p-8 max-w-7xl mx-auto flex-1 w-full box-border">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface m-0">Enquiries</h1>
          <p className="text-xs text-on-surface-variant m-0 mt-1 max-w-2xl">
            Students and parents who submitted an enquiry on your public page. These are your
            institute's leads — the platform team does not respond on your behalf.
          </p>
        </div>
        {newCount > 0 && <Badge tone="tertiary">{newCount} new</Badge>}
      </div>

      <Card className="p-4 mb-6 border border-outline-variant flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-80 relative">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-base">search</span>
          <input
            type="text"
            placeholder="Search by name, email or course..."
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
              {t !== 'All' && <span className="ml-1 opacity-60">{all.filter((e) => e.status === t).length}</span>}
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
              icon="forum"
              title="No enquiries yet"
              description="When someone submits the enquiry form on your public Institute Page, it appears here."
            />
          ) : (
            <EmptyState compact icon="search_off" title="No enquiries match this filter" />
          )
        }
      />

      <Modal open={!!viewing} onClose={() => setViewing(null)} width={480}>
        {viewing && (
          <>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-on-surface m-0">{viewing.name}</h2>
                <p className="text-xs text-on-surface-variant m-0 mt-0.5">Received {viewing.submittedAt}</p>
              </div>
              <StatusBadge status={viewing.status} />
            </div>

            <div className="bg-surface-container-low rounded-2xl p-4 grid grid-cols-2 gap-3 mb-4 border border-outline-variant text-xs">
              <div><span className="text-on-surface-variant">Email</span><p className="font-semibold text-on-surface m-0 break-all">{viewing.email}</p></div>
              <div><span className="text-on-surface-variant">Phone</span><p className="font-semibold text-on-surface m-0">{viewing.phone}</p></div>
              <div><span className="text-on-surface-variant">City</span><p className="font-semibold text-on-surface m-0">{viewing.city || '—'}</p></div>
              <div><span className="text-on-surface-variant">State</span><p className="font-semibold text-on-surface m-0">{viewing.state || '—'}</p></div>
              <div className="col-span-2">
                <span className="text-on-surface-variant">Interested in</span>
                <p className="font-semibold text-on-surface m-0">
                  {viewing.course}{viewing.specialization ? ` · ${viewing.specialization}` : ''}
                </p>
              </div>
            </div>

            <FormGroup label="Status">
              <Select value={draftStatus} onChange={(e) => setDraftStatus(e.target.value)}>
                {ENQUIRY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </FormGroup>

            <div className="mt-3">
              <Label small>Internal note / response log</Label>
              <Textarea
                rows={3}
                value={draftNote}
                onChange={(e) => setDraftNote(e.target.value)}
                placeholder="What you told them, what they asked for, next follow-up"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-outline-variant pt-4 mt-4">
              <Button variant="outline" onClick={() => setViewing(null)}>Cancel</Button>
              <Button onClick={saveResponse} icon="save">Save</Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
