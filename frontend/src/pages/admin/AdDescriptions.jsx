import { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Field';
import { useToast } from '../../context/ToastContext';
import useAdDescriptionTemplates from '../../hooks/useAdDescriptionTemplates';
import {
  createAdDescriptionTemplate,
  updateAdDescriptionTemplate,
  deleteAdDescriptionTemplate,
  createAdDescriptionGroup,
  updateAdDescriptionGroup,
  deleteAdDescriptionGroup,
} from '../../Api/Api';

/**
 * PLATFORM-OWNED. The predecided descriptions every institute picks from when
 * publishing an ad — client feedback 24 Sep 2026: "make Ad Description
 * customizable as per requirement".
 *
 * Inside each ad type the admin can create groups — "Teaching" and
 * "Non-teaching" under Hiring, say (client request, 29 Sep 2026: "make these
 * tabs also dynamic, user can add more variety"). Lines without a group are
 * "General". The institute's picker shows lines under their group headings.
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

// Group filter values that are not a group id.
const ALL = '__all__';
const GENERAL = '';

function TemplateRow({ template, index, count, groups, showGroup, onMove, onChanged }) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(template.text);
  const [groupId, setGroupId] = useState(template.group_id || GENERAL);
  const [busy, setBusy] = useState(false);
  const group = groups.find((g) => g.id === template.group_id);

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
    const ok = await run(
      () => updateAdDescriptionTemplate(template.id, { text: draft, group_id: groupId || null }),
      'Line updated',
    );
    if (ok) setEditing(false);
  };

  const remove = () => {
    if (!window.confirm('Delete this line? Ads already published with it keep their text.')) return;
    run(() => deleteAdDescriptionTemplate(template.id), 'Line deleted');
  };

  return (
    <div className="px-4 py-2 rounded-2xl border border-slate-200 bg-white">
      {editing ? (
        <div className="py-2 space-y-2">
          <Input value={draft} maxLength={MAX_LENGTH} onChange={(e) => setDraft(e.target.value)} />
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              Group
              <Select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="py-1.5! w-auto!">
                <option value={GENERAL}>General</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </Select>
            </label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDraft(template.text);
                  setGroupId(template.group_id || GENERAL);
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
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400 w-5 shrink-0">{index + 1}.</span>
          <p className="flex-1 min-w-0 text-sm text-slate-800 m-0 leading-relaxed">{template.text}</p>
          {showGroup && (
            <span className="hidden sm:inline text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
              {group ? group.name : 'General'}
            </span>
          )}
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
        danger ? 'text-error hover:bg-error-container' : 'text-slate-500 hover:bg-slate-100 hover:text-blue-700'
      }`}
      {...rest}
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
    </button>
  );
}

/** The row of group tabs inside an ad type, with add / rename / delete. */
function GroupTabs({ section, groups, templates, value, onChange, onChanged }) {
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const selected = groups.find((g) => g.id === value);

  const countIn = (id) => templates.filter((t) => (t.group_id || GENERAL) === id).length;

  const call = async (action, message) => {
    setBusy(true);
    try {
      const result = await action();
      toast.push({ type: 'success', message });
      await onChanged();
      return result;
    } catch (err) {
      toast.push({ type: 'error', message: err.message || 'Something went wrong' });
      return null;
    } finally {
      setBusy(false);
    }
  };

  const create = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const group = await call(() => createAdDescriptionGroup({ section, name }), 'Group added');
    if (group) {
      setName('');
      setAdding(false);
      onChange(group.id);
    }
  };

  const rename = async () => {
    const next = window.prompt('Rename group', selected.name);
    if (!next || next.trim() === selected.name) return;
    await call(() => updateAdDescriptionGroup(selected.id, { name: next }), 'Group renamed');
  };

  const remove = async () => {
    const n = countIn(selected.id);
    const note = n ? ` Its ${n} line${n === 1 ? '' : 's'} will move to General.` : '';
    if (!window.confirm(`Delete the group "${selected.name}"?${note}`)) return;
    // The page falls back to "All" once the selected group is gone.
    await call(() => deleteAdDescriptionGroup(selected.id), 'Group deleted');
  };

  const chip = (id, label, count) => {
    const active = value === id;
    return (
      <button
        key={id || 'general'}
        type="button"
        onClick={() => onChange(id)}
        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border cursor-pointer transition-colors ${
          active ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
        }`}
      >
        {label}
        <span className={`px-1.5 rounded-full text-[10px] ${active ? 'bg-white/20' : 'bg-slate-100'}`}>{count}</span>
      </button>
    );
  };

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 flex-wrap">
        {chip(ALL, 'All', templates.length)}
        {chip(GENERAL, 'General', countIn(GENERAL))}
        {groups.map((g) => chip(g.id, g.name, countIn(g.id)))}

        {adding ? (
          <form onSubmit={create} className="inline-flex items-center gap-1.5">
            <Input
              autoFocus
              value={name}
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
              placeholder="Group name, e.g. Teaching"
              className="py-1.5! w-48!"
            />
            <Button type="submit" size="sm" disabled={busy || !name.trim()}>Add</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => { setAdding(false); setName(''); }}>
              Cancel
            </Button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-blue-700 bg-blue-50 border border-dashed border-blue-300 hover:bg-blue-100 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">add</span>
            New group
          </button>
        )}
      </div>

      {selected && (
        <div className="flex items-center gap-3 mt-2 text-xs">
          <span className="text-slate-500">Group “{selected.name}”:</span>
          <button type="button" onClick={rename} disabled={busy} className="font-semibold text-blue-700 bg-transparent border-none cursor-pointer p-0 hover:underline">
            Rename
          </button>
          <button type="button" onClick={remove} disabled={busy} className="font-semibold text-error bg-transparent border-none cursor-pointer p-0 hover:underline">
            Delete group
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdDescriptions() {
  const toast = useToast();
  const [section, setSection] = useState('job');
  const [groupFilter, setGroupFilter] = useState(ALL);
  const { templates, groups, loading, error, reload } = useAdDescriptionTemplates(section);
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);

  // A group deleted elsewhere (or another ad type's id) falls back to All.
  const filter = groupFilter === ALL || groupFilter === GENERAL || groups.some((g) => g.id === groupFilter)
    ? groupFilter
    : ALL;
  const shown = filter === ALL ? templates : templates.filter((t) => (t.group_id || GENERAL) === filter);

  const add = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setAdding(true);
    try {
      await createAdDescriptionTemplate({ section, text: draft, groupId: filter === ALL ? null : filter });
      setDraft('');
      toast.push({ type: 'success', message: 'Line added' });
      await reload();
    } catch (err) {
      toast.push({ type: 'error', message: err.message || 'Could not add the description' });
    } finally {
      setAdding(false);
    }
  };

  // Reorders within what is shown, then renumbers the whole ad type so the
  // lines outside the current group keep their relative places.
  const move = async (index, delta) => {
    const a = shown[index];
    const b = shown[index + delta];
    const ordered = templates.map((t) => (t.id === a.id ? b : t.id === b.id ? a : t));
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

  const addingTo = filter === ALL || filter === GENERAL ? 'General' : groups.find((g) => g.id === filter)?.name;

  return (
    <div className="p-8 max-w-4xl mx-auto flex-1 w-full box-border">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-slate-900 m-0">Ad Descriptions</h1>
        <p className="text-xs text-slate-500 m-0 mt-1 max-w-3xl">
          The predecided one-line options institutes pick from when publishing an ad — each ad's
          description is up to three of them. Organise each ad type into groups of your own. Edits
          apply to new ads and the next edit of an existing one; ads already published keep their text.
        </p>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => { setSection(s.key); setGroupFilter(ALL); }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border cursor-pointer transition-colors ${
              section === s.key
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/20'
                : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      <Card className="p-5">
        <GroupTabs
          section={section}
          groups={groups}
          templates={templates}
          value={filter}
          onChange={setGroupFilter}
          onChanged={reload}
        />

        <div className="flex flex-col gap-2.5">
          {loading && <p className="text-xs text-slate-500 m-0">Loading…</p>}
          {error && <p className="text-xs text-error m-0">Couldn't load descriptions: {error.message}</p>}
          {!loading && !error && shown.length === 0 && (
            <p className="text-sm text-slate-500 m-0 py-6 text-center">No lines here yet — add one below.</p>
          )}
          {shown.map((t, i) => (
            <TemplateRow
              key={`${t.id}-${t.text}-${t.group_id}`}
              template={t}
              index={i}
              count={shown.length}
              groups={groups}
              showGroup={filter === ALL}
              onMove={move}
              onChanged={reload}
            />
          ))}
        </div>

        <form onSubmit={add} className="mt-5 pt-5 border-t border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 m-0 mb-2">
            Add a line <span className="font-normal text-slate-500">to {addingTo}</span>
          </h3>
          <Input
            value={draft}
            maxLength={MAX_LENGTH}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="{name} is hiring qualified teaching professionals."
          />
          <div className="flex items-center justify-between gap-3 mt-2 flex-wrap">
            <p className="text-[11px] text-slate-500 m-0">
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
