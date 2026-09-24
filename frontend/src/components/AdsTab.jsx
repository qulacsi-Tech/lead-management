import { useCallback, useEffect, useRef, useState } from 'react';
import Button from './ui/Button';
import Badge from './ui/Badge';
import StatusBadge from './ui/StatusBadge';
import EmptyState from './ui/EmptyState';
import { Input, Select, FormGroup } from './ui/Field';
import { useAuth } from '../context/AuthContext';
import { EMPLOYMENT_TYPES } from '../constants/taxonomy';
import AdCopyFields from './ui/AdCopyFields';
import {
  fetchPageOpportunities,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  pushToTopOpportunity,
  fetchPagePapers,
  createPaper,
  updatePaper,
  deletePaper,
  pushToTopPaper,
  uploadPaperFile,
  resolveAssetUrl,
} from '../Api/Api';

/**
 * One ad type of the Platform Admin's institute editor.
 *
 * Rendered three times, once per tab — Ads · Notice, Ads · Hiring and Guess
 * Papers each get their own tab rather than sharing one scrolling screen, so
 * an admin working on vacancies is not scrolling past admission notices to
 * reach them.
 *
 * `section` selects which: 'admission' | 'job' | 'paper'. The first two are
 * Opportunities and share an endpoint; the third is a StudyPaper. They are one
 * component because the list, the row chrome, the save/delete/reorder plumbing
 * and the visibility control are identical — only the form fields differ.
 *
 * Unlike every other tab in this editor, nothing here is part of the parent's
 * "Save Changes" payload. These are their own entities with their own
 * endpoints and authorization, so each action commits on its own and the list
 * reloads from the server. Folding them into the page's `content` blob would
 * make a draft vacancy vanish if the admin navigated away without saving.
 */

const PAPER_KINDS = ['Guess Paper', 'Study Material', 'Previous Year Paper', 'Notes', 'Syllabus'];

const SECTIONS = {
  admission: {
    icon: 'campaign',
    label: 'Admission Notice',
    blurb: "Admission announcements. Published notices reach followers' feeds and the public page.",
    addLabel: 'New Notice',
    empty: 'No admission notices yet.',
    noun: 'admission notice',
  },
  job: {
    icon: 'work',
    label: 'We Are Hiring',
    blurb: 'Teaching and staff vacancies, shown to professionals looking for a role.',
    addLabel: 'New Vacancy',
    empty: 'No vacancies yet.',
    noun: 'vacancy',
  },
  paper: {
    icon: 'description',
    label: 'Guess Paper / Study Material',
    blurb:
      'Download-only. Readers take the file without an enquiry form — you get the download count, never their contact details.',
    addLabel: 'Upload Paper',
    empty: 'No papers uploaded yet.',
    noun: 'paper',
  },
};

/** "2458" -> "2,458". The client asked for the count in this exact shape. */
function formatCount(n) {
  return Number(n || 0).toLocaleString('en-IN');
}

function formatBytes(bytes) {
  if (!bytes) return null;
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Where the ad runs.
 *
 * Platform-wide is Main Admin only, and the server enforces that
 * independently — an institute admin promoting themselves onto every
 * competitor's page for free is the thing being prevented, so the disabled
 * state here is a courtesy, not the control.
 */
function VisibilityControl({ value, onChange, canGoPlatformWide, noun }) {
  const options = [
    {
      key: 'page',
      icon: 'account_balance',
      title: 'This institute only',
      hint: `Shows on this institute's own page and in the feed.`,
    },
    {
      key: 'platform',
      icon: 'public',
      title: 'Every institute page',
      hint: 'Also runs as a sponsored ad across other institutes on Connectedus.',
    },
  ];

  return (
    <div>
      <p className="text-xs font-semibold text-on-surface m-0 mb-1.5">Where should this {noun} show?</p>
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt) => {
          const active = (value || 'page') === opt.key;
          const locked = opt.key === 'platform' && !canGoPlatformWide;
          return (
            <button
              key={opt.key}
              type="button"
              disabled={locked}
              onClick={() => onChange(opt.key)}
              className={`text-left p-3 rounded-xl border transition-colors bg-transparent ${
                active ? 'border-primary bg-primary-container/10' : 'border-outline-variant'
              } ${locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary'}`}
            >
              <span className="flex items-center gap-2 mb-0.5">
                <span className="material-symbols-outlined text-[16px] text-primary">{opt.icon}</span>
                <span className="text-xs font-bold text-on-surface">{opt.title}</span>
                {active && (
                  <span className="material-symbols-outlined text-[15px] text-primary ml-auto">
                    check_circle
                  </span>
                )}
              </span>
              <span className="block text-[11px] text-on-surface-variant leading-snug">
                {locked ? 'Main Admin only.' : opt.hint}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** A row in the list — same chrome for all three types, with the per-type
 *  detail supplied by `meta` and `trailing`. */
function AdRow({ title, meta, status, visibility, onEdit, onDelete, onPushToTop, trailing, busy }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant bg-surface-container-low">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-on-surface truncate">{title || 'Untitled'}</span>
          <StatusBadge status={status || 'Draft'} />
          {visibility === 'platform' && (
            <Badge tone="tertiary">
              <span className="material-symbols-outlined text-[12px] align-middle mr-0.5">public</span>
              All institutes
            </Badge>
          )}
        </div>
        {meta && <p className="text-xs text-on-surface-variant m-0 mt-0.5 truncate">{meta}</p>}
      </div>
      {trailing}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          title="Push to top"
          onClick={onPushToTop}
          disabled={busy}
          className="text-on-surface-variant hover:bg-surface-container-high p-2 rounded-lg cursor-pointer border-none bg-transparent disabled:opacity-40"
        >
          <span className="material-symbols-outlined text-[18px]">vertical_align_top</span>
        </button>
        <button
          type="button"
          title="Edit"
          onClick={onEdit}
          disabled={busy}
          className="text-on-surface-variant hover:bg-surface-container-high p-2 rounded-lg cursor-pointer border-none bg-transparent disabled:opacity-40"
        >
          <span className="material-symbols-outlined text-[18px]">edit</span>
        </button>
        <button
          type="button"
          title="Delete"
          onClick={onDelete}
          disabled={busy}
          className="text-error hover:bg-error-container/20 p-2 rounded-lg cursor-pointer border-none bg-transparent disabled:opacity-40"
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>
    </div>
  );
}

export default function AdsTab({ pageId, pageName, section }) {
  const cfg = SECTIONS[section];
  const isPaper = section === 'paper';
  const isJob = section === 'job';

  const { role } = useAuth();
  const canGoPlatformWide = role === 'admin';

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [editing, setEditing] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const fileInputRef = useRef(null);

  const load = useCallback(async () => {
    if (!pageId) return;
    setLoading(true);
    setError('');
    try {
      if (isPaper) {
        const res = await fetchPagePapers(pageId);
        setRows(Array.isArray(res) ? res : []);
      } else {
        const res = await fetchPageOpportunities(pageId);
        setRows(Array.isArray(res) ? res.filter((o) => o.type === section) : []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'These ads could not be loaded.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [pageId, section, isPaper]);

  useEffect(() => {
    load();
  }, [load]);

  // Switching tabs must not carry a half-typed vacancy into the papers form.
  useEffect(() => {
    setEditing(null);
    setPendingFile(null);
  }, [section]);

  const flash = (message) => {
    setNotice(message);
    setTimeout(() => setNotice(''), 2500);
  };

  /** Every mutation funnels through here so one `catch` surfaces the error and
   *  the list is always refetched rather than patched optimistically. */
  const run = async (fn, successMessage) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      await load();
      if (successMessage) flash(successMessage);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That action could not be completed.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const blank = isPaper
    ? {
        title: '', kind: 'Guess Paper', description: '', subject: '', class_level: '',
        exam: '', session: '', status: 'Draft', visibility: 'page',
      }
    : { type: section, title: '', description: '', status: 'Draft', visibility: 'page' };

  const openEditor = (row) => {
    setPendingFile(null);
    setEditing(row ? { ...blank, ...row } : { ...blank });
  };

  const setField = (key) => (e) => setEditing((prev) => ({ ...prev, [key]: e.target.value }));
  const setVisibility = (v) => setEditing((prev) => ({ ...prev, visibility: v }));

  const saveOpportunity = async () => {
    const d = editing;
    const payload = {
      type: section,
      title:
        (isJob ? d.title || d.position : d.title || d.session) ||
        (isJob ? 'Job Opening' : 'Admission Notice'),
      description: d.description || undefined,
      status: d.status || 'Draft',
      visibility: d.visibility || 'page',
      session: d.session || undefined,
      start_date: d.start_date || undefined,
      end_date: d.end_date || undefined,
      eligibility: d.eligibility || undefined,
      position: d.position || undefined,
      subject: d.subject || undefined,
      department: d.department || undefined,
      employment_type: d.employment_type || undefined,
      location: d.location || undefined,
      experience: d.experience || undefined,
      qualification: d.qualification || undefined,
      salary: d.salary || undefined,
      apply_before: d.apply_before || undefined,
      apply_url: d.apply_url || undefined,
    };
    const ok = await run(
      () => (d.id ? updateOpportunity(pageId, d.id, payload) : createOpportunity(pageId, payload)),
      d.id ? 'Ad updated.' : 'Ad created.',
    );
    if (ok) setEditing(null);
  };

  const savePaper = async () => {
    const d = editing;
    const meta = {
      title: d.title,
      kind: d.kind || 'Guess Paper',
      description: d.description || undefined,
      subject: d.subject || undefined,
      class_level: d.class_level || undefined,
      exam: d.exam || undefined,
      session: d.session || undefined,
      visibility: d.visibility || 'page',
    };

    const ok = await run(async () => {
      let paperId = d.id;

      if (paperId) {
        await updatePaper(pageId, paperId, meta);
      } else {
        // Create as a Draft first: the backend refuses to publish a paper with
        // no file, so the status is applied after the upload below.
        const created = await createPaper(pageId, { ...meta, status: 'Draft' });
        paperId = created.id;
      }

      if (pendingFile) await uploadPaperFile(pageId, paperId, pendingFile);

      // Applied last, once the file is definitely attached.
      const wanted = d.status || 'Draft';
      if (wanted !== 'Draft') await updatePaper(pageId, paperId, { status: wanted });
    }, d.id ? 'Paper updated.' : 'Paper uploaded.');

    if (ok) {
      setEditing(null);
      setPendingFile(null);
    }
  };

  if (!pageId) {
    return (
      <EmptyState
        icon={cfg.icon}
        title="Save the institute first"
        description="Ads attach to a saved institute page. Create the page, then come back to publish notices, vacancies and study material."
      />
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-on-surface m-0 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">{cfg.icon}</span>
            {cfg.label}
            <Badge tone="primary">{rows.length}</Badge>
          </h3>
          <p className="text-xs text-on-surface-variant m-0 mt-0.5">{cfg.blurb}</p>
        </div>
        <Button size="sm" icon="add" onClick={() => openEditor()} disabled={busy}>
          {cfg.addLabel}
        </Button>
      </div>

      <p className="text-[11px] text-on-surface-variant m-0">
        Saves immediately — separate from the <strong>Save Changes</strong> button above, which only
        covers this page&apos;s profile content.
      </p>

      {isPaper && (
        <p className="text-[11px] text-on-surface-variant m-0 flex items-start gap-1.5">
          <span className="material-symbols-outlined text-[14px] mt-px">lock</span>
          <span>
            Downloads are private to the reader. You see the total only — Connectedus never passes
            you the name, email or phone number of anyone who downloads.
          </span>
        </p>
      )}

      {notice && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 px-3 py-2 text-xs font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          {notice}
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-error-container/40 border border-error/30 text-error px-3 py-2 text-xs font-semibold">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-xs text-on-surface-variant py-8 text-center m-0">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-xs text-on-surface-variant m-0">{cfg.empty}</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) =>
            isPaper ? (
              <AdRow
                key={r.id}
                title={`${r.kind || 'Guess Paper'}: ${r.title}`}
                status={r.status}
                visibility={r.visibility}
                meta={[r.subject, r.class_level, r.exam, formatBytes(r.file_size)]
                  .filter(Boolean)
                  .join(' · ')}
                busy={busy}
                trailing={
                  <div className="text-right shrink-0 px-2">
                    <p className="text-sm font-bold text-on-surface m-0 leading-none">
                      {formatCount(r.downloads_count)}
                    </p>
                    <p className="text-[10px] text-on-surface-variant m-0 mt-0.5">Downloads</p>
                  </div>
                }
                onEdit={() => openEditor(r)}
                onPushToTop={() => run(() => pushToTopPaper(pageId, r.id), 'Moved to top.')}
                onDelete={() => run(() => deletePaper(pageId, r.id), 'Paper deleted.')}
              />
            ) : (
              <AdRow
                key={r.id}
                title={isJob ? r.position || r.title : r.title}
                status={r.status}
                visibility={r.visibility}
                meta={
                  isJob
                    ? [r.location, r.experience, r.employment_type].filter(Boolean).join(' · ')
                    : [r.session, r.eligibility].filter(Boolean).join(' · ')
                }
                busy={busy}
                onEdit={() => openEditor(r)}
                onPushToTop={() => run(() => pushToTopOpportunity(pageId, r.id), 'Moved to top.')}
                onDelete={() => run(() => deleteOpportunity(pageId, r.id), 'Ad deleted.')}
              />
            ),
          )}
        </div>
      )}

      {/* --- Editor --- */}
      {editing && (
        <div className="rounded-2xl border-2 border-primary bg-surface-container-lowest p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-on-surface m-0">
              {editing.id ? 'Edit' : 'New'} {cfg.noun}
            </h3>
            <button
              type="button"
              onClick={() => { setEditing(null); setPendingFile(null); }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high cursor-pointer border-none bg-transparent"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {isPaper ? (
            <div className="space-y-4">
              <FormGroup label="Material Type">
                <Select value={editing.kind || 'Guess Paper'} onChange={setField('kind')}>
                  {PAPER_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
                </Select>
              </FormGroup>

              <AdCopyFields
                section="paper"
                title={editing.title}
                description={editing.description}
                onTitleChange={(v) => setEditing((d) => ({ ...d, title: v }))}
                onDescriptionChange={(v) => setEditing((d) => ({ ...d, description: v }))}
                instituteName={pageName}
                manageLink={canGoPlatformWide ? "/admin/ad-descriptions" : undefined}
                titleLabel="Paper Title (one line)"
              />

              <div className="grid grid-cols-3 gap-4">
                <FormGroup label="Subject">
                  <Input value={editing.subject || ''} onChange={setField('subject')} placeholder="Physics" />
                </FormGroup>
                <FormGroup label="Class / Level">
                  <Input value={editing.class_level || ''} onChange={setField('class_level')} placeholder="Class 12" />
                </FormGroup>
                <FormGroup label="Exam">
                  <Input value={editing.exam || ''} onChange={setField('exam')} placeholder="CBSE Board" />
                </FormGroup>
              </div>


              <FormGroup label="PDF File">
                <div className="flex items-center gap-3">
                  <Button size="sm" variant="outline" type="button" icon="upload_file" onClick={() => fileInputRef.current?.click()}>
                    {editing.file_url || pendingFile ? 'Replace PDF' : 'Choose PDF'}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => setPendingFile(e.target.files?.[0] || null)}
                  />
                  <span className="text-xs text-on-surface-variant truncate">
                    {pendingFile
                      ? pendingFile.name
                      : editing.file_url
                        ? editing.file_name || 'Current file attached'
                        : 'No file chosen — PDF only, up to 15MB.'}
                  </span>
                  {editing.file_url && !pendingFile && (
                    <a href={resolveAssetUrl(editing.file_url)} target="_blank" rel="noreferrer" className="text-xs text-primary font-semibold">
                      View
                    </a>
                  )}
                </div>
              </FormGroup>

              <VisibilityControl
                value={editing.visibility}
                onChange={setVisibility}
                canGoPlatformWide={canGoPlatformWide}
                noun="paper"
              />

              <div className="grid grid-cols-2 gap-4 items-end">
                <FormGroup label="Status">
                  <Select value={editing.status || 'Draft'} onChange={setField('status')}>
                    <option value="Draft">Draft</option>
                    <option value="Published">Published</option>
                    <option value="Archived">Archived</option>
                  </Select>
                </FormGroup>
                {editing.id && (
                  <p className="text-xs text-on-surface-variant m-0 pb-2">
                    <strong className="text-on-surface">{formatCount(editing.downloads_count)}</strong> downloads so far.
                  </p>
                )}
              </div>

              {(editing.status || 'Draft') === 'Published' && !editing.file_url && !pendingFile && (
                <p className="text-xs text-error m-0">
                  Attach a PDF before publishing — readers would otherwise click through to nothing.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {isJob ? (
                <div className="grid grid-cols-2 gap-4">
                  <FormGroup label="Position">
                    <Input value={editing.position || ''} onChange={setField('position')} placeholder="Mathematics Faculty" />
                  </FormGroup>
                  <FormGroup label="Subject">
                    <Input value={editing.subject || ''} onChange={setField('subject')} placeholder="Mathematics" />
                  </FormGroup>
                </div>
              ) : (
                <FormGroup label="Session">
                  <Input value={editing.session || ''} onChange={setField('session')} placeholder="2026-27" />
                </FormGroup>
              )}

              {isJob ? (
                <div className="grid grid-cols-3 gap-4">
                  <FormGroup label="Location">
                    <Input value={editing.location || ''} onChange={setField('location')} placeholder="Indore" />
                  </FormGroup>
                  <FormGroup label="Experience">
                    <Input value={editing.experience || ''} onChange={setField('experience')} placeholder="More than 15 Years" />
                  </FormGroup>
                  <FormGroup label="Employment Type">
                    <Select value={editing.employment_type || ''} onChange={setField('employment_type')}>
                      <option value="">Select…</option>
                      {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </Select>
                  </FormGroup>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <FormGroup label="Start Date">
                    <Input type="date" value={editing.start_date || ''} onChange={setField('start_date')} />
                  </FormGroup>
                  <FormGroup label="End Date">
                    <Input type="date" value={editing.end_date || ''} onChange={setField('end_date')} />
                  </FormGroup>
                  <FormGroup label="Eligibility">
                    <Input value={editing.eligibility || ''} onChange={setField('eligibility')} placeholder="10+2 with PCM" />
                  </FormGroup>
                </div>
              )}

              <AdCopyFields
                section={section}
                title={editing.title}
                description={editing.description}
                onTitleChange={(v) => setEditing((d) => ({ ...d, title: v }))}
                onDescriptionChange={(v) => setEditing((d) => ({ ...d, description: v }))}
                instituteName={pageName}
                manageLink={canGoPlatformWide ? "/admin/ad-descriptions" : undefined}
              />

              <VisibilityControl
                value={editing.visibility}
                onChange={setVisibility}
                canGoPlatformWide={canGoPlatformWide}
                noun={cfg.noun}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormGroup label="Status">
                  <Select value={editing.status || 'Draft'} onChange={setField('status')}>
                    <option value="Draft">Draft</option>
                    <option value="Published">Published</option>
                    <option value="Expired">Expired</option>
                    <option value="Closed">Closed</option>
                  </Select>
                </FormGroup>
                <FormGroup label="Apply / Details URL">
                  <Input value={editing.apply_url || ''} onChange={setField('apply_url')} placeholder="https://…" />
                </FormGroup>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={() => { setEditing(null); setPendingFile(null); }} disabled={busy}>
              Cancel
            </Button>
            <Button
              size="sm"
              icon="save"
              onClick={isPaper ? savePaper : saveOpportunity}
              disabled={busy || !((editing.title || editing.position || '').trim())}
            >
              {busy ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
