import { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import { useToast } from '../../context/ToastContext';
import useAdDescriptionTemplates from '../../hooks/useAdDescriptionTemplates';
import {
  createAdDescriptionTemplate,
  updateAdDescriptionTemplate,
  deleteAdDescriptionTemplate,
} from '../../Api/Api';

/**
 * PLATFORM-OWNED. The predecided descriptions every institute picks from when
 * publishing an ad — client feedback 24 Sep 2026: "make Ad Description
 * customizable as per requirement".
 *
 * Changes apply to new ads and to the next edit of an existing one. A
 * published ad keeps the text it was saved with (ads store the text, not a
 * reference to a template), so nothing live is rewritten from here.
 */

const SECTIONS = [
  { key: 'admission', label: 'Admission Notice', icon: 'school' },
  { key: 'job', label: 'Hiring', icon: 'work' },
  { key: 'paper', label: 'Guess Paper', icon: 'description' },
];

// One line each — an ad's description is up to three of these.
const MAX_LENGTH = 200;

function TemplateRow({ template, index, count, onMove, onChanged }) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(template.text);
  const [busy, setBusy] = useState(false);

  const run = async (action, successMessage) => {
    setBusy(true);
    try {
      await action();
      toast.push({ type: 'success', message: successMessage });
      await onChanged();
      return true;
    } catch (err) {
      toast.push({ type: 'error', message: err.message || 'Something went wrong' });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    const ok = await run(() => updateAdDescriptionTemplate(template.id, { text: draft }), 'Line updated');
    if (ok) setEditing(false);
  };

  const remove = () => {
    if (!window.confirm('Delete this line? Ads already published with it keep their text.')) return;
    run(() => deleteAdDescriptionTemplate(template.id), 'Line deleted');
  };

  return (
    <div className="px-4 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest">
      {editing ? (
        <>
          <Input value={draft} maxLength={MAX_LENGTH} onChange={(e) => setDraft(e.target.value)} />
          <div className="flex items-center justify-end gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDraft(template.text);
                setEditing(false);
              }}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button size="sm" icon="save" onClick={save} disabled={busy || !draft.trim()}>
              Save
            </Button>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-on-surface-variant w-5 shrink-0">{index + 1}.</span>
          <p className="flex-1 min-w-0 text-xs text-on-surface m-0 leading-relaxed">{template.text}</p>
          <div className="flex items-center gap-0.5 shrink-0">
            <IconButton icon="arrow_upward" label="Move up" disabled={busy || index === 0} onClick={() => onMove(index, -1)} />
            <IconButton icon="arrow_downward" label="Move down" disabled={busy || index === count - 1} onClick={() => onMove(index, 1)} />
            <IconButton icon="edit" label="Edit" disabled={busy} onClick={() => setEditing(true)} />
            <IconButton icon="delete" label="Delete" danger disabled={busy} onClick={remove} />
          </div>
        </div>
      )}
    </div>
  );
}

function IconButton({ icon, label, danger, ...rest }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`w-8 h-8 rounded-lg flex items-center justify-center bg-transparent border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
        danger ? 'text-error hover:bg-error-container' : 'text-on-surface-variant hover:bg-surface-container-high'
      }`}
      {...rest}
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
    </button>
  );
}

export default function AdDescriptions() {
  const toast = useToast();
  const [section, setSection] = useState('job');
  const { templates, loading, error, reload } = useAdDescriptionTemplates(section);
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);

  const add = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setAdding(true);
    try {
      await createAdDescriptionTemplate({ section, text: draft });
      setDraft('');
      toast.push({ type: 'success', message: 'Line added' });
      await reload();
    } catch (err) {
      toast.push({ type: 'error', message: err.message || 'Could not add the description' });
    } finally {
      setAdding(false);
    }
  };

  // Renumber the whole section 1..n in the new order, writing only the rows
  // whose number changes — deletions leave gaps, so swapping just the two
  // neighbours' numbers could land one of them among the other rows.
  const move = async (index, delta) => {
    const ordered = [...templates];
    [ordered[index], ordered[index + delta]] = [ordered[index + delta], ordered[index]];
    try {
      await Promise.all(
        ordered
          .map((t, i) => [t, i + 1])
          .filter(([t, order]) => t.sort_order !== order)
          .map(([t, order]) => updateAdDescriptionTemplate(t.id, { sort_order: order }))
      );
    } catch (err) {
      toast.push({ type: 'error', message: err.message || 'Could not reorder' });
    }
    await reload();
  };

  return (
    <div className="p-8 max-w-4xl mx-auto flex-1 w-full box-border">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-on-surface m-0">Ad Descriptions</h1>
        <p className="text-xs text-on-surface-variant m-0 mt-1 max-w-3xl">
          The predecided one-line options institutes pick from when publishing an ad — each ad's
          description is up to three of them. Edits apply to new ads and the next edit of an existing
          one; ads already published keep their text.
        </p>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSection(s.key)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border cursor-pointer transition-colors ${
              section === s.key
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-transparent text-on-surface-variant border-outline-variant hover:bg-surface-container-low'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      <Card className="p-5">
        <div className="flex flex-col gap-3">
          {loading && <p className="text-xs text-on-surface-variant m-0">Loading…</p>}
          {error && <p className="text-xs text-error m-0">Couldn't load descriptions: {error.message}</p>}
          {!loading && !error && templates.length === 0 && (
            <p className="text-xs text-on-surface-variant m-0">No lines for this ad type yet.</p>
          )}
          {templates.map((t, i) => (
            <TemplateRow
              key={`${t.id}-${t.text}`}
              template={t}
              index={i}
              count={templates.length}
              onMove={move}
              onChanged={reload}
            />
          ))}
        </div>

        <form onSubmit={add} className="mt-5 pt-5 border-t border-outline-variant">
          <h3 className="text-sm font-bold text-on-surface m-0 mb-2">Add a line</h3>
          <Input
            value={draft}
            maxLength={MAX_LENGTH}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="{name} is hiring qualified teaching professionals."
          />
          <div className="flex items-center justify-between gap-3 mt-2 flex-wrap">
            <p className="text-[11px] text-on-surface-variant m-0">
              Write <code className="font-mono">{'{name}'}</code> where the institute's name should appear.
              Each option is one line; institutes tick up to three.
            </p>
            <Button type="submit" size="sm" icon="add" disabled={adding || !draft.trim()}>
              Add
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
