import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input, FormGroup, Select } from '../../components/ui/Field';
import CourseCategorySelect from '../../components/ui/CourseCategorySelect';
import { useTaxonomy } from '../../context/TaxonomyContext';
import { useToast } from '../../context/ToastContext';
import { fetchPages, updatePage } from '../../Api/Api';

/**
 * PLATFORM-OWNED course hierarchy: Level -> Category -> Subcategories.
 *
 * Client request, 30 Sep 2026: "whatever I add under a level should reflect
 * there only", "select checkbox format if I'd like to add under any level",
 * and "category and subcategory should be editable". Each level now keeps its
 * own categories (see backend/routers/taxonomy.py, level-hierarchy); adding
 * goes to the ticked levels only, and every rename or delete touches one level.
 */

/** Text with a pencil; click to rename in place (Enter saves, Esc cancels). */
function EditableText({ value, onSave, className = '', inputClassName = '', label }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [busy, setBusy] = useState(false);

  const start = (e) => {
    e?.stopPropagation();
    setDraft(value);
    setEditing(true);
  };
  const cancel = () => setEditing(false);
  const save = async () => {
    const next = draft.trim();
    if (!next || next === value) return cancel();
    setBusy(true);
    const ok = await onSave(next);
    setBusy(false);
    if (ok !== false) setEditing(false);
  };

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1 min-w-0" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          value={draft}
          disabled={busy}
          aria-label={`Rename ${label || value}`}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); save(); }
            if (e.key === 'Escape') { e.preventDefault(); cancel(); }
          }}
          className={`min-w-0 w-32 px-2 py-0.5 rounded-md border border-blue-400 ring-2 ring-blue-100 outline-none text-xs text-slate-900 bg-white ${inputClassName}`}
        />
        <button type="button" onClick={save} disabled={busy} aria-label="Save" className="text-emerald-600 bg-transparent border-none cursor-pointer p-0 flex">
          <span className="material-symbols-outlined text-[16px]">check</span>
        </button>
        <button type="button" onClick={cancel} aria-label="Cancel" className="text-slate-400 bg-transparent border-none cursor-pointer p-0 flex">
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </span>
    );
  }

  return (
    <span className={`group/edit inline-flex items-center gap-1 min-w-0 ${className}`}>
      <span className="truncate">{value}</span>
      <button
        type="button"
        onClick={start}
        aria-label={`Rename ${label || value}`}
        title="Rename"
        className="shrink-0 text-slate-400 hover:text-blue-600 bg-transparent border-none cursor-pointer p-0 flex opacity-60 group-hover/edit:opacity-100"
      >
        <span className="material-symbols-outlined text-[14px]">edit</span>
      </button>
    </span>
  );
}

/** A single-input inline adder (Enter saves). */
function InlineAdder({ placeholder, onAdd, onCancel }) {
  const [text, setText] = useState('');
  const submit = async () => {
    if (!text.trim()) return;
    const ok = await onAdd(text.trim());
    if (ok !== false) setText('');
  };
  return (
    <div className="flex items-center gap-1.5">
      <Input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); submit(); }
          if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
        }}
        placeholder={placeholder}
        className="text-xs py-1.5"
      />
      <Button size="sm" onClick={submit} className="px-2.5 py-1.5 text-xs">Save</Button>
      <Button size="sm" variant="outline" onClick={onCancel} className="px-2.5 py-1.5 text-xs">Cancel</Button>
    </div>
  );
}

// The page's three sections, one per tab (client request, 30 Sep 2026). The
// selected tab lives in ?tab= so a refresh or a shared link keeps it.
const TABS = [
  {
    key: 'hierarchy',
    label: 'Course Hierarchy',
    icon: 'account_tree',
    subtitle: 'Levels, their categories / streams and branches. Each level keeps its own list.',
  },
  {
    key: 'locations',
    label: 'Serviced Locations',
    icon: 'location_on',
    subtitle: 'Cities Connectedus operates in, used for search and lead matching.',
  },
  {
    key: 'affiliations',
    label: 'Accreditation / Affiliations',
    icon: 'verified',
    subtitle: 'Recognised boards and bodies, per institute type.',
  },
];

/** Chips you can rename (pencil), remove (x) and add to (+ Add). */
function EditableChipList({ items, onAdd, onRename, onDelete, addPlaceholder, emptyText, itemLabel }) {
  const [adding, setAdding] = useState(false);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1 text-xs bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800 font-medium"
          >
            <EditableText value={item} label={`${itemLabel} ${item}`} inputClassName="w-28" onSave={(next) => onRename(item, next)} />
            <button
              type="button"
              onClick={() => onDelete(item)}
              aria-label={`Remove ${item}`}
              className="bg-transparent border-none cursor-pointer p-0 text-slate-400 hover:text-error flex"
            >
              <span className="material-symbols-outlined text-[13px]">close</span>
            </button>
          </span>
        ))}
        {items.length === 0 && !adding && <span className="text-[11px] text-slate-400 italic">{emptyText}</span>}
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-0.5 text-[11px] font-bold text-blue-700 bg-blue-50 border border-dashed border-blue-300 px-2.5 py-1 rounded-lg cursor-pointer hover:bg-blue-100"
          >
            <span className="material-symbols-outlined text-[14px]">add</span>
            Add
          </button>
        )}
      </div>
      {adding && (
        <InlineAdder
          placeholder={addPlaceholder}
          onCancel={() => setAdding(false)}
          onAdd={async (name) => {
            const ok = await onAdd(name);
            if (ok) setAdding(false);
            return ok;
          }}
        />
      )}
    </div>
  );
}

export default function PlatformTaxonomy() {
  const {
    levels = [],
    levelHierarchy = {},
    affiliations = {},
    locations = [],
    types = [],
    addLocation,
    renameLocation,
    deleteLocation,
    addAffiliation,
    renameAffiliation,
    deleteAffiliation,
    deleteLevel,
    addLevelItems,
    addLevelSubcategory,
    renameLevel,
    renameLevelCategory,
    renameLevelSubcategory,
    deleteLevelCategory,
    deleteLevelSubcategory,
  } = useTaxonomy();

  const { push: toast } = useToast();

  // Runs a taxonomy call with success / error toasts. Returns false on failure
  // so inline editors can stay open.
  const act = async (fn, message) => {
    try {
      await fn();
      if (message) toast({ type: 'success', message });
      return true;
    } catch (err) {
      toast({ type: 'error', message: err?.message || 'Something went wrong.' });
      return false;
    }
  };

  // Every category name used anywhere, for suggestions in the add form.
  const allCategoryNames = useMemo(() => {
    const names = new Set();
    Object.values(levelHierarchy).forEach((cats) => Object.keys(cats || {}).forEach((c) => names.add(c)));
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [levelHierarchy]);

  const totalCategories = useMemo(
    () => Object.values(levelHierarchy).reduce((n, cats) => n + Object.keys(cats || {}).length, 0),
    [levelHierarchy],
  );

  const [searchQuery, setSearchQuery] = useState('');

  // -------------------------------------------------------------------------
  // Add form: ticked levels -> category -> branches
  // -------------------------------------------------------------------------
  const [pickedLevels, setPickedLevels] = useState(() => new Set());
  const [newLevels, setNewLevels] = useState([]); // typed-in levels not saved yet
  const [newLevelText, setNewLevelText] = useState('');
  const [categoryText, setCategoryText] = useState('');
  const [subInputText, setSubInputText] = useState('');
  const [customSubcategoryList, setCustomSubcategoryList] = useState([]);
  const [isAddingBusy, setIsAddingBusy] = useState(false);

  // Start with the first level ticked, once levels have loaded.
  useEffect(() => {
    if (pickedLevels.size === 0 && levels.length > 0) setPickedLevels(new Set([levels[0]]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levels.length]);

  const toggleLevelPick = (lvl) =>
    setPickedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(lvl)) next.delete(lvl);
      else next.add(lvl);
      return next;
    });

  const addNewLevelChip = () => {
    const name = newLevelText.trim();
    if (!name) return;
    const existing = [...levels, ...newLevels].find((l) => l.toLowerCase() === name.toLowerCase());
    const chosen = existing || name;
    if (!existing) setNewLevels((prev) => [...prev, name]);
    setPickedLevels((prev) => new Set(prev).add(chosen));
    setNewLevelText('');
  };

  const handleAddSubcategoryItem = () => {
    const parts = subInputText.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length === 0) return;
    setCustomSubcategoryList((prev) => {
      const next = [...prev];
      parts.forEach((name) => {
        const found = next.find((x) => x.name.toLowerCase() === name.toLowerCase());
        if (found) found.checked = true;
        else next.push({ id: `${Date.now()}-${Math.random()}`, name, checked: true });
      });
      return next;
    });
    setSubInputText('');
  };

  const chosenLevels = [...pickedLevels];
  const isFormValid = chosenLevels.length > 0 && categoryText.trim().length > 0;

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    const subs = customSubcategoryList.filter((x) => x.checked).map((x) => x.name.trim()).filter(Boolean);
    const pending = subInputText.trim();
    if (pending && !subs.includes(pending)) subs.push(pending);
    const category = categoryText.trim();

    setIsAddingBusy(true);
    const ok = await act(
      () => addLevelItems({ levels: chosenLevels, category, subcategories: subs }),
      `Added "${category}" under ${chosenLevels.join(', ')}.`,
    );
    setIsAddingBusy(false);
    if (ok) {
      setCategoryText('');
      setCustomSubcategoryList([]);
      setSubInputText('');
      setNewLevels([]);
      setExpandedLevels((prev) => new Set([...prev, ...chosenLevels]));
    }
  };

  // -------------------------------------------------------------------------
  // Explorer state
  // -------------------------------------------------------------------------
  const [expandedLevels, setExpandedLevels] = useState(() => new Set());
  useEffect(() => {
    if (expandedLevels.size === 0 && levels.length > 0) setExpandedLevels(new Set(levels));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levels.length]);
  const [addingCategoryTo, setAddingCategoryTo] = useState(null); // level
  const [addingSubTo, setAddingSubTo] = useState(null); // `${level}:::${category}`

  const handleDeleteLevel = async (lvl) => {
    const n = Object.keys(levelHierarchy[lvl] || {}).length;
    const note = n ? ` Its ${n} categor${n === 1 ? 'y' : 'ies'} will be deleted too.` : '';
    if (!window.confirm(`Delete level "${lvl}"?${note}`)) return;
    await act(() => deleteLevel(lvl), `Deleted level "${lvl}".`);
  };

  const handleDeleteCategory = async (level, category) => {
    if (!window.confirm(`Delete "${category}" and its branches from ${level}? Other levels are not affected.`)) return;
    await act(() => deleteLevelCategory({ level, category }), `Deleted "${category}" from ${level}.`);
  };

  // -------------------------------------------------------------------------
  // Quick Assignment to Institute Modal State
  // -------------------------------------------------------------------------
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [pagesList, setPagesList] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState('');
  const [assignedCategories, setAssignedCategories] = useState([]);
  const [assigningBusy, setAssigningBusy] = useState(false);

  useEffect(() => {
    fetchPages()
      .then((res) => {
        if (Array.isArray(res)) {
          setPagesList(res);
          if (res.length > 0) {
            setSelectedPageId(res[0].id);
            setAssignedCategories(res[0].course_categories || []);
          }
        }
      })
      .catch(() => { });
  }, []);

  const handleSelectPage = (id) => {
    setSelectedPageId(id);
    const p = pagesList.find((x) => x.id === id);
    setAssignedCategories(p?.course_categories || []);
  };

  const saveAssignment = async () => {
    if (!selectedPageId) return;
    setAssigningBusy(true);
    try {
      await updatePage(selectedPageId, { course_categories: assignedCategories });
      toast({ type: 'success', message: 'Assigned categories saved to institute successfully!' });
      setPagesList((prev) =>
        prev.map((p) => (p.id === selectedPageId ? { ...p, course_categories: assignedCategories } : p)),
      );
      setAssignModalOpen(false);
    } catch (err) {
      toast({ type: 'error', message: err?.message || 'Failed to save course assignment.' });
    } finally {
      setAssigningBusy(false);
    }
  };

  const selectedPage = pagesList.find((x) => x.id === selectedPageId);
  const q = searchQuery.trim().toLowerCase();

  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.key === params.get('tab')) ? params.get('tab') : 'hierarchy';
  const activeTab = TABS.find((t) => t.key === tab);
  const affiliationCount = Object.values(affiliations || {}).reduce((n, list) => n + (list?.length || 0), 0);
  const tabCount = { hierarchy: totalCategories, locations: locations.length, affiliations: affiliationCount };
  const selectTab = (key) => setParams(key === 'hierarchy' ? {} : { tab: key }, { replace: true });

  return (
    <div className="p-8 max-w-7xl mx-auto flex-1 w-full box-border space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 m-0">Types &amp; Categories</h1>
          <p className="text-xs text-slate-500 m-0 mt-0.5">{activeTab.subtitle}</p>
        </div>
        {tab === 'hierarchy' && (
          <Button size="sm" icon="checklist" onClick={() => setAssignModalOpen(true)}>
            Assign to Institute
          </Button>
        )}
      </div>

      <div role="tablist" aria-label="Taxonomy sections" className="flex gap-2 flex-wrap border-b border-slate-200 pb-3">
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => selectTab(t.key)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border cursor-pointer transition-colors ${
                active
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/20'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{t.icon}</span>
              {t.label}
              <span className={`text-[11px] px-1.5 rounded-full ${active ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                {tabCount[t.key]}
              </span>
            </button>
          );
        })}
      </div>

      {tab === 'hierarchy' && (
      <Card className="p-6">
        {/* ------------------------------------------------------------------
            ADD FORM: tick levels -> category -> branches
           ------------------------------------------------------------------ */}
        <form onSubmit={handleAdd} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-6 space-y-4">
          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-blue-600 text-[18px]">add_circle</span>
            Add to Hierarchy: Level &rarr; Category &rarr; Subcategory
          </span>

          {/* 1. LEVELS as checkboxes */}
          <div>
            <p className="text-[11px] font-bold text-slate-800 m-0 mb-1.5">
              1. Levels <span className="font-normal text-slate-500">— tick every level this should be added under</span>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {[...levels, ...newLevels].map((lvl) => {
                const on = pickedLevels.has(lvl);
                const isNew = newLevels.includes(lvl);
                return (
                  <label
                    key={lvl}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer select-none transition-colors ${
                      on ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 text-slate-700 hover:border-blue-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggleLevelPick(lvl)}
                      className="w-3.5 h-3.5 accent-white cursor-pointer"
                    />
                    {lvl}
                    {isNew && <span className={`text-[10px] ${on ? 'text-white/80' : 'text-blue-600'}`}>new</span>}
                  </label>
                );
              })}
              <span className="inline-flex items-center gap-1">
                <input
                  value={newLevelText}
                  onChange={(e) => setNewLevelText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); addNewLevelChip(); }
                  }}
                  placeholder="+ New level (e.g. Diploma)"
                  aria-label="New level name"
                  className="w-44 px-3 py-1.5 rounded-full border border-dashed border-blue-300 bg-white text-xs outline-none focus:border-blue-500"
                />
                {newLevelText.trim() && (
                  <button type="button" onClick={addNewLevelChip} className="text-xs font-bold text-blue-700 bg-transparent border-none cursor-pointer">
                    Add
                  </button>
                )}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 2. CATEGORY: free text with suggestions */}
            <div>
              <label htmlFor="tax-category" className="text-[11px] font-bold text-slate-800 block mb-1.5">
                2. Category / Stream
              </label>
              <Input
                id="tax-category"
                list="tax-category-suggestions"
                value={categoryText}
                onChange={(e) => setCategoryText(e.target.value)}
                placeholder="e.g. B.Tech, Commerce — pick or type a new one"
                className="text-xs py-2"
              />
              <datalist id="tax-category-suggestions">
                {allCategoryNames.map((c) => <option key={c} value={c} />)}
              </datalist>
              <p className="text-[10px] text-slate-500 mt-1 mb-0">
                If it already exists under a ticked level, the branches are added to it.
              </p>
            </div>

            {/* 3. BRANCHES: enter-to-checkbox */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="tax-branch" className="text-[11px] font-bold text-slate-800 block">
                  3. Subcategories / Branches
                </label>
                {customSubcategoryList.length > 0 && (
                  <span className="text-[10px] text-blue-600 font-bold">
                    {customSubcategoryList.filter((x) => x.checked).length} of {customSubcategoryList.length} selected
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <Input
                  id="tax-branch"
                  value={subInputText}
                  onChange={(e) => setSubInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); handleAddSubcategoryItem(); }
                  }}
                  placeholder="Type branch & press Enter (comma for several)"
                  className="text-xs py-2 flex-1"
                />
                <Button type="button" size="sm" variant="outline" onClick={handleAddSubcategoryItem} className="px-2.5 py-1.5 text-xs shrink-0">
                  Add
                </Button>
              </div>
              {customSubcategoryList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 p-2 rounded-xl bg-white border border-slate-200 max-h-28 overflow-y-auto">
                  {customSubcategoryList.map((item) => (
                    <label
                      key={item.id}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs cursor-pointer select-none ${
                        item.checked ? 'bg-blue-50 border-blue-400 text-blue-800 font-medium' : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => setCustomSubcategoryList((prev) => prev.map((x) => (x.id === item.id ? { ...x, checked: !x.checked } : x)))}
                        className="w-3.5 h-3.5 accent-blue-600 cursor-pointer"
                      />
                      <span className="truncate max-w-[130px]">{item.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setCustomSubcategoryList((prev) => prev.filter((x) => x.id !== item.id));
                        }}
                        className="text-slate-400 hover:text-error p-0 border-none bg-transparent cursor-pointer flex"
                        aria-label={`Remove ${item.name}`}
                      >
                        <span className="material-symbols-outlined text-[13px]">close</span>
                      </button>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-[11px] text-slate-500">
              {chosenLevels.length === 0
                ? 'Tick at least one level.'
                : `Will be added under: ${chosenLevels.join(', ')} — nowhere else.`}
            </span>
            <Button type="submit" size="sm" icon="add" disabled={!isFormValid || isAddingBusy}>
              {isAddingBusy
                ? 'Adding…'
                : `Add to ${chosenLevels.length || ''} level${chosenLevels.length === 1 ? '' : 's'}`}
            </Button>
          </div>
        </form>

        {/* ------------------------------------------------------------------
            EXPLORER: each level with its own categories
           ------------------------------------------------------------------ */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Hierarchy</span>
              <span className="text-[11px] text-slate-500">
                {levels.length} levels · {totalCategories} categories
              </span>
            </div>
            <div className="w-full sm:w-64">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search category or branch..."
                className="text-xs py-1.5"
              />
            </div>
          </div>

          {levels.length === 0 && (
            <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">account_tree</span>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">No levels yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Type a new level in the form above, add a category under it, and it appears here.
              </p>
            </div>
          )}

          {levels.map((lvl) => {
            const isOpen = expandedLevels.has(lvl);
            const cats = Object.entries(levelHierarchy[lvl] || {});
            const shown = q
              ? cats.filter(([cat, subs]) => cat.toLowerCase().includes(q) || subs.some((s) => s.toLowerCase().includes(q)))
              : cats;
            if (q && shown.length === 0) return null;

            return (
              <div key={lvl} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-50">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <button
                      type="button"
                      aria-label={isOpen ? `Collapse ${lvl}` : `Expand ${lvl}`}
                      onClick={() => setExpandedLevels((prev) => {
                        const next = new Set(prev);
                        if (next.has(lvl)) next.delete(lvl);
                        else next.add(lvl);
                        return next;
                      })}
                      className="p-1 rounded-md hover:bg-slate-200 text-slate-500 flex border-none bg-transparent cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">{isOpen ? 'expand_more' : 'chevron_right'}</span>
                    </button>
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                    <EditableText
                      value={lvl}
                      label={`level ${lvl}`}
                      className="font-bold text-sm text-slate-900"
                      onSave={(next) => act(() => renameLevel({ level: lvl, newName: next }), `Renamed level to "${next}".`)}
                    />
                    <span className="text-[10px] text-slate-500 font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded-full shrink-0">
                      {cats.length} categor{cats.length === 1 ? 'y' : 'ies'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setAddingCategoryTo(addingCategoryTo === lvl ? null : lvl);
                        setExpandedLevels((prev) => new Set(prev).add(lvl));
                      }}
                      className="text-[11px] text-blue-700 font-semibold hover:underline flex items-center gap-0.5 bg-transparent border-none cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">add</span>
                      Add Category
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteLevel(lvl)}
                      title={`Delete level "${lvl}"`}
                      aria-label={`Delete level ${lvl}`}
                      className="text-slate-400 hover:text-error bg-transparent border-none cursor-pointer p-1 flex"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="p-4 space-y-3 border-t border-slate-200">
                    {addingCategoryTo === lvl && (
                      <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/60">
                        <InlineAdder
                          placeholder={`New category under ${lvl}…`}
                          onCancel={() => setAddingCategoryTo(null)}
                          onAdd={async (cat) => {
                            const ok = await act(
                              () => addLevelItems({ levels: [lvl], category: cat, subcategories: [] }),
                              `Added "${cat}" under ${lvl}.`,
                            );
                            if (ok) setAddingCategoryTo(null);
                            return ok;
                          }}
                        />
                      </div>
                    )}

                    {shown.length === 0 ? (
                      <p className="py-4 text-center text-xs text-slate-500 italic m-0">
                        Nothing under {lvl} yet — use “Add Category” or the form above.
                      </p>
                    ) : (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {shown.map(([cat, subs]) => {
                          const subKey = `${lvl}:::${cat}`;
                          return (
                            <div key={cat} className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col justify-between">
                              <div>
                                <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100">
                                  <EditableText
                                    value={cat}
                                    label={`category ${cat}`}
                                    className="text-xs font-bold text-slate-900 flex-1"
                                    onSave={(next) => act(
                                      () => renameLevelCategory({ level: lvl, category: cat, newName: next }),
                                      `Renamed to "${next}" under ${lvl}.`,
                                    )}
                                  />
                                  <div className="flex items-center gap-1 shrink-0">
                                    <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded-full">
                                      {subs.length} branch{subs.length === 1 ? '' : 'es'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteCategory(lvl, cat)}
                                      title={`Delete ${cat}`}
                                      aria-label={`Delete ${cat} from ${lvl}`}
                                      className="text-slate-400 hover:text-error bg-transparent border-none cursor-pointer p-0.5 flex"
                                    >
                                      <span className="material-symbols-outlined text-[15px]">delete</span>
                                    </button>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-1.5 my-2">
                                  {subs.map((s) => (
                                    <span
                                      key={s}
                                      className="inline-flex items-center gap-1 text-[11px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md text-slate-800"
                                    >
                                      <EditableText
                                        value={s}
                                        label={`branch ${s}`}
                                        inputClassName="w-24"
                                        onSave={(next) => act(
                                          () => renameLevelSubcategory({ level: lvl, category: cat, subcategory: s, newName: next }),
                                          `Renamed to "${next}".`,
                                        )}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => act(
                                          () => deleteLevelSubcategory({ level: lvl, category: cat, subcategory: s }),
                                          `Removed "${s}".`,
                                        )}
                                        className="bg-transparent border-none cursor-pointer p-0 text-slate-400 hover:text-error flex"
                                        aria-label={`Remove ${s}`}
                                      >
                                        <span className="material-symbols-outlined text-[12px]">close</span>
                                      </button>
                                    </span>
                                  ))}
                                  {subs.length === 0 && <p className="text-[11px] text-slate-400 m-0 italic">No branches yet.</p>}
                                </div>
                              </div>

                              <div className="mt-2.5 pt-2 border-t border-slate-100">
                                {addingSubTo === subKey ? (
                                  <InlineAdder
                                    placeholder="Branch / specialization"
                                    onCancel={() => setAddingSubTo(null)}
                                    onAdd={(sub) => act(
                                      () => addLevelSubcategory({ level: lvl, category: cat, subcategory: sub }),
                                      `Added "${sub}" to ${cat}.`,
                                    )}
                                  />
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setAddingSubTo(subKey)}
                                    className="text-[11px] text-blue-700 font-semibold flex items-center gap-1 bg-transparent border-none cursor-pointer hover:underline p-0"
                                  >
                                    <span className="material-symbols-outlined text-[13px]">add</span>
                                    Add Specialization
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
      )}

      {/* =========================================================================
          LOCATIONS & AFFILIATIONS — editable (client request, 30 Sep 2026:
          "make these items dynamic, user can edit and add too")
         ========================================================================= */}
      {tab === 'locations' && (
        <Card className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-blue-600 text-[20px]">location_on</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 m-0">Serviced Locations</h3>
              <p className="text-xs text-slate-500 m-0 mt-0.5">
                Cities Connectedus operates in, used for search and lead matching.
              </p>
            </div>
          </div>
          <EditableChipList
            items={locations}
            itemLabel="location"
            emptyText="No locations yet."
            addPlaceholder="City name, e.g. Raipur"
            onAdd={(name) => act(() => addLocation(name), `Added "${name}".`)}
            onRename={(name, next) => act(() => renameLocation({ name, newName: next }), `Renamed to "${next}".`)}
            onDelete={(name) => {
              if (!window.confirm(`Remove "${name}" from serviced locations?`)) return;
              act(() => deleteLocation(name), `Removed "${name}".`);
            }}
          />
        </Card>
      )}

      {tab === 'affiliations' && (
        <Card className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-blue-600 text-[20px]">verified</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 m-0">Accreditation / Affiliations</h3>
              <p className="text-xs text-slate-500 m-0 mt-0.5">
                Per institute type — a School picks a board, a College a university.
              </p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {(types.length ? types : Object.keys(affiliations)).map((type) => (
              <div key={type} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 m-0 mb-1.5">{type}</p>
                <EditableChipList
                  items={affiliations[type] || []}
                  itemLabel={`${type} affiliation`}
                  emptyText="None yet."
                  addPlaceholder={`New affiliation for ${type}`}
                  onAdd={(name) => act(() => addAffiliation({ instituteType: type, name }), `Added "${name}" for ${type}.`)}
                  onRename={(name, next) => act(
                    () => renameAffiliation({ instituteType: type, name, newName: next }),
                    `Renamed to "${next}".`,
                  )}
                  onDelete={(name) => {
                    if (!window.confirm(`Remove "${name}" from ${type} affiliations?`)) return;
                    act(() => deleteAffiliation({ instituteType: type, name }), `Removed "${name}".`);
                  }}
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* =========================================================================
          QUICK MULTI-CHECKBOX ASSIGNMENT TO INSTITUTE MODAL
         ========================================================================= */}
      <Modal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        width={720}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
            <div>
              <h3 className="text-base font-bold text-on-surface m-0">
                Assign Courses to Institute
              </h3>
              <p className="text-xs text-on-surface-variant m-0 mt-0.5">
                Assign streams and specializations to any institute via nested multi-select checkboxes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAssignModalOpen(false)}
              className="text-on-surface-variant hover:text-on-surface bg-transparent border-none cursor-pointer p-1"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Select Institute */}
          <FormGroup label="Select Institute">
            <Select
              value={selectedPageId}
              onChange={(e) => handleSelectPage(e.target.value)}
            >
              {pagesList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.type || 'Institute'}) — {p.city || 'No city'}
                </option>
              ))}
            </Select>
          </FormGroup>

          {/* Nested Multi-Checkbox Selector with Level -> Category -> Subcategory */}
          {selectedPage && (
            <CourseCategorySelect
              type={selectedPage.type}
              value={assignedCategories}
              onChange={setAssignedCategories}
            />
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAssignModalOpen(false)}
              disabled={assigningBusy}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon="save"
              onClick={saveAssignment}
              disabled={assigningBusy}
            >
              {assigningBusy ? 'Saving...' : 'Save Assignment'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
