import { useState } from 'react';
import { Label, Input } from './Field';
import Button from './Button';
import { useTaxonomy } from '../../context/TaxonomyContext';

/**
 * CourseCategorySelect:
 * Streamlined 3-tier cascade:
 * Level (with Custom option) -> Category (with Custom option) -> Subcategory (with Custom option)
 *
 * Each next tier is presented in an interactive nested multi-select checkbox format.
 *
 * Value shape on `pages.course_categories`:
 *   [
 *     { level: 'Undergraduate (UG)', category: 'Engineering', subcategories: ['Computer Science (CSE)', 'Mechanical'] },
 *     { level: 'Postgraduate (PG)', category: 'MBA / Management', subcategories: ['Marketing', 'Finance'] }
 *   ]
 */
export default function CourseCategorySelect({
  type = 'College',
  value = [],
  onChange,
  disabled = false,
}) {
  const {
    levels: platformLevels = [],
    commonCategories = {},
    courseCategoriesFor,
    courseSubcategoriesFor,
    addHierarchyItem,
  } = useTaxonomy();

  const standardCategories = courseCategoriesFor ? courseCategoriesFor() : Object.keys(commonCategories);

  // Expanded toggles for levels and categories
  const [expandedLevels, setExpandedLevels] = useState(() => new Set());
  const [expandedCategories, setExpandedCategories] = useState(() => new Set());

  // Inline custom adder states
  const [showCustomLevelInput, setShowCustomLevelInput] = useState(false);
  const [customLevelText, setCustomLevelText] = useState('');

  const [activeCustomCatLevel, setActiveCustomCatLevel] = useState(null);
  const [customCatText, setCustomCatText] = useState('');

  const [activeCustomSubKey, setActiveCustomSubKey] = useState(null); // `${level}:::${category}`
  const [customSubText, setCustomSubText] = useState('');

  // Local extra custom options added during this session
  const [localCustomLevels, setLocalCustomLevels] = useState([]);
  const [localCustomCategoriesByLevel, setLocalCustomCategoriesByLevel] = useState({});
  const [localCustomSubsByKey, setLocalCustomSubsByKey] = useState({});

  // All available levels (platform + custom added)
  const allLevels = Array.from(new Set([...platformLevels, ...localCustomLevels]));
  if (allLevels.length === 0) allLevels.push('Undergraduate (UG)', 'Postgraduate (PG)', 'Diploma');

  // Helper to find existing assignment for level + category
  const findEntry = (lvl, cat) =>
    value.find((v) => (v.level ? v.level === lvl : true) && v.category === cat);

  // Toggle category under a level
  const toggleCategory = (lvl, cat) => {
    if (disabled) return;
    const existing = findEntry(lvl, cat);
    if (existing) {
      onChange(value.filter((v) => !( (v.level ? v.level === lvl : true) && v.category === cat )));
    } else {
      onChange([...value, { level: lvl, category: cat, subcategories: [] }]);
      // auto expand category
      setExpandedCategories((prev) => new Set(prev).add(`${lvl}:::${cat}`));
    }
  };

  // Toggle a single subcategory
  const toggleSubcategory = (lvl, cat, sub) => {
    if (disabled) return;
    const existing = findEntry(lvl, cat);
    if (!existing) {
      // If category wasn't checked yet, check it with this subcategory
      onChange([...value, { level: lvl, category: cat, subcategories: [sub] }]);
      return;
    }

    const currentSubs = existing.subcategories || [];
    const newSubs = currentSubs.includes(sub)
      ? currentSubs.filter((s) => s !== sub)
      : [...currentSubs, sub];

    onChange(
      value.map((v) => {
        if ((v.level ? v.level === lvl : true) && v.category === cat) {
          return { ...v, level: lvl, subcategories: newSubs };
        }
        return v;
      }),
    );
  };

  // Select all / Deselect all subcategories for a category
  const selectAllSubcategories = (lvl, cat, allSubs) => {
    if (disabled) return;
    const existing = findEntry(lvl, cat);
    const currentSubs = existing?.subcategories || [];
    const allSelected = allSubs.length > 0 && allSubs.every((s) => currentSubs.includes(s));

    if (!existing) {
      onChange([...value, { level: lvl, category: cat, subcategories: [...allSubs] }]);
      return;
    }

    onChange(
      value.map((v) => {
        if ((v.level ? v.level === lvl : true) && v.category === cat) {
          return { ...v, level: lvl, subcategories: allSelected ? [] : [...allSubs] };
        }
        return v;
      }),
    );
  };

  // Handle adding custom Level
  const handleAddCustomLevel = async () => {
    const lvl = customLevelText.trim();
    if (!lvl) return;
    if (!allLevels.includes(lvl)) {
      setLocalCustomLevels((prev) => [...prev, lvl]);
    }
    // Auto-expand this new level
    setExpandedLevels((prev) => new Set(prev).add(lvl));
    setCustomLevelText('');
    setShowCustomLevelInput(false);
  };

  // Handle adding custom Category under a Level
  const handleAddCustomCategory = async (lvl) => {
    const cat = customCatText.trim();
    if (!cat) return;
    setLocalCustomCategoriesByLevel((prev) => ({
      ...prev,
      [lvl]: Array.from(new Set([...(prev[lvl] || []), cat])),
    }));
    // Auto check this new category under this level
    onChange([...value, { level: lvl, category: cat, subcategories: [] }]);
    setExpandedCategories((prev) => new Set(prev).add(`${lvl}:::${cat}`));
    setCustomCatText('');
    setActiveCustomCatLevel(null);

    // Also persist to taxonomy if helper is available
    if (addHierarchyItem) {
      addHierarchyItem({ level: lvl, category: cat, subcategories: [] }).catch(() => {});
    }
  };

  // Handle adding custom Subcategory under Level & Category
  const handleAddCustomSubcategory = async (lvl, cat) => {
    const sub = customSubText.trim();
    if (!sub) return;
    const key = `${lvl}:::${cat}`;
    setLocalCustomSubsByKey((prev) => ({
      ...prev,
      [key]: Array.from(new Set([...(prev[key] || []), sub])),
    }));

    // Auto toggle this subcategory
    toggleSubcategory(lvl, cat, sub);
    setCustomSubText('');
    setActiveCustomSubKey(null);

    // Persist to taxonomy backend
    if (addHierarchyItem) {
      addHierarchyItem({ level: lvl, category: cat, subcategories: [sub] }).catch(() => {});
    }
  };

  const totalAssignedCategories = value.length;
  const totalAssignedSubs = value.reduce((sum, v) => sum + (v.subcategories?.length || 0), 0);

  return (
    <div className="space-y-3">
      {/* Header and counter summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-outline-variant/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">account_tree</span>
            <Label className="m-0 font-bold">Course Hierarchy Assignment (Nested Multi-Select)</Label>
          </div>
          <p className="text-[11px] text-on-surface-variant m-0 mt-0.5">
            Level (UG, PG...) &rarr; Category (Engineering, MBA...) &rarr; Subcategory (Specializations). Custom options can be added at each level.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
            {totalAssignedCategories} streams, {totalAssignedSubs} specializations assigned
          </span>
          {!showCustomLevelInput && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              icon="add"
              onClick={() => setShowCustomLevelInput(true)}
              className="text-xs py-1"
            >
              Custom Level
            </Button>
          )}
        </div>
      </div>

      {/* Inline Add Custom Level Box */}
      {showCustomLevelInput && (
        <div className="p-3 rounded-xl border border-primary/40 bg-primary/5 flex items-center gap-2">
          <Input
            value={customLevelText}
            onChange={(e) => setCustomLevelText(e.target.value)}
            placeholder="Enter custom level (e.g. Executive Fellowship, Vocational Diploma)..."
            className="text-xs"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustomLevel();
              }
            }}
          />
          <Button size="sm" variant="primary" onClick={handleAddCustomLevel}>
            Add Level
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setShowCustomLevelInput(false);
              setCustomLevelText('');
            }}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* NESTED HIERARCHY TREE */}
      <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
        {allLevels.map((lvl) => {
          const isLvlOpen = expandedLevels.has(lvl);
          const levelAssignedEntries = value.filter((v) => (v.level ? v.level === lvl : true));
          const levelHasSelections = levelAssignedEntries.length > 0;

          // Combine standard categories with local custom categories for this level
          const customCategories = localCustomCategoriesByLevel[lvl] || [];
          const levelCategories = Array.from(new Set([...standardCategories, ...customCategories]));

          return (
            <div
              key={lvl}
              className={`rounded-2xl border transition-all ${
                levelHasSelections
                  ? 'border-primary/40 bg-surface-container-lowest shadow-xs'
                  : 'border-outline-variant/60 bg-surface-container-lowest/50'
              }`}
            >
              {/* LEVEL HEADER */}
              <div className="flex items-center justify-between p-3 bg-surface-container-low/60 rounded-t-2xl">
                <div
                  className="flex items-center gap-2.5 flex-1 cursor-pointer select-none"
                  onClick={() =>
                    setExpandedLevels((prev) => {
                      const next = new Set(prev);
                      if (next.has(lvl)) next.delete(lvl);
                      else next.add(lvl);
                      return next;
                    })
                  }
                >
                  <button
                    type="button"
                    className="p-1 rounded-md hover:bg-surface-container text-on-surface-variant flex items-center border-none bg-transparent cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isLvlOpen ? 'expand_more' : 'chevron_right'}
                    </span>
                  </button>

                  <span className="font-bold text-xs text-on-surface flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                    {lvl}
                  </span>

                  {levelHasSelections && (
                    <span className="text-[10px] bg-primary text-on-primary font-bold px-2 py-0.5 rounded-full">
                      {levelAssignedEntries.length} categories active
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCustomCatLevel(activeCustomCatLevel === lvl ? null : lvl);
                      setCustomCatText('');
                      // open level
                      setExpandedLevels((prev) => new Set(prev).add(lvl));
                    }}
                    className="text-[11px] text-primary font-semibold hover:underline flex items-center gap-0.5 bg-transparent border-none cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    Custom Category
                  </button>
                </div>
              </div>

              {/* LEVEL CONTENT (CATEGORIES) */}
              {isLvlOpen && (
                <div className="p-3.5 space-y-2.5 border-t border-outline-variant/40">
                  {/* Inline Add Custom Category */}
                  {activeCustomCatLevel === lvl && (
                    <div className="p-2.5 rounded-xl border border-secondary/40 bg-secondary/5 flex items-center gap-2 mb-2">
                      <Input
                        value={customCatText}
                        onChange={(e) => setCustomCatText(e.target.value)}
                        placeholder={`New stream/category under ${lvl} (e.g. Artificial Intelligence, Aviation)...`}
                        className="text-xs"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomCategory(lvl);
                          }
                        }}
                      />
                      <Button size="sm" variant="primary" onClick={() => handleAddCustomCategory(lvl)}>
                        Add
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setActiveCustomCatLevel(null);
                          setCustomCatText('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}

                  {/* Categories Grid under this Level */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {levelCategories.map((cat) => {
                      const entry = findEntry(lvl, cat);
                      const isCatSelected = !!entry;
                      const catKey = `${lvl}:::${cat}`;
                      const isCatOpen = expandedCategories.has(catKey);

                      // Standard subs + local custom subs
                      const standardSubs = courseSubcategoriesFor ? courseSubcategoriesFor(cat) : [];
                      const customSubs = localCustomSubsByKey[catKey] || [];
                      const allSubs = Array.from(new Set([...standardSubs, ...customSubs]));
                      const selectedSubsCount = entry?.subcategories?.length || 0;
                      const allSubsSelected = allSubs.length > 0 && selectedSubsCount === allSubs.length;

                      return (
                        <div
                          key={cat}
                          className={`rounded-xl border transition-all ${
                            isCatSelected
                              ? 'border-primary/50 bg-primary/5'
                              : 'border-outline-variant/60 bg-surface-container-lowest'
                          }`}
                        >
                          {/* CATEGORY ROW */}
                          <div className="flex items-center justify-between p-2.5 gap-2">
                            <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                              <input
                                type="checkbox"
                                checked={isCatSelected}
                                onChange={() => toggleCategory(lvl, cat)}
                                disabled={disabled}
                                className="w-4 h-4 accent-primary cursor-pointer rounded"
                              />
                              <span
                                className={`text-xs font-bold truncate ${
                                  isCatSelected ? 'text-primary' : 'text-on-surface'
                                }`}
                              >
                                {cat}
                              </span>
                            </label>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {isCatSelected && allSubs.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => selectAllSubcategories(lvl, cat, allSubs)}
                                  disabled={disabled}
                                  className="text-[10px] text-primary hover:underline bg-transparent border-none cursor-pointer font-medium"
                                >
                                  {allSubsSelected ? 'Deselect' : 'Select all'}
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedCategories((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(catKey)) next.delete(catKey);
                                    else next.add(catKey);
                                    return next;
                                  })
                                }
                                className="bg-surface-container-high border-none cursor-pointer text-[10px] text-on-surface-variant font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5 hover:bg-surface-container-highest"
                              >
                                <span>
                                  {isCatSelected ? `${selectedSubsCount}/` : ''}
                                  {allSubs.length}
                                </span>
                                <span className="material-symbols-outlined text-[13px]">
                                  {isCatOpen ? 'expand_less' : 'expand_more'}
                                </span>
                              </button>
                            </div>
                          </div>

                          {/* SUBCATEGORIES EXPANDED */}
                          {isCatOpen && (
                            <div className="p-3 pt-1 border-t border-outline-variant/40 bg-surface-container-lowest/80 rounded-b-xl space-y-2">
                              {/* Subcategories checklist */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {allSubs.map((sub) => {
                                  const isSubSelected = entry?.subcategories?.includes(sub);
                                  return (
                                    <label
                                      key={sub}
                                      className={`flex items-center gap-2 p-1.5 px-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                                        isSubSelected
                                          ? 'bg-primary/10 border-primary text-primary font-medium'
                                          : 'bg-surface-container-low border-outline-variant/60 text-on-surface-variant hover:bg-surface-container-high'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={!!isSubSelected}
                                        onChange={() => toggleSubcategory(lvl, cat, sub)}
                                        disabled={disabled}
                                        className="w-3.5 h-3.5 accent-primary cursor-pointer rounded"
                                      />
                                      <span className="truncate">{sub}</span>
                                    </label>
                                  );
                                })}
                              </div>

                              {allSubs.length === 0 && (
                                <p className="text-[11px] text-on-surface-variant m-0 italic">
                                  No subcategories defined yet. Add a custom branch below.
                                </p>
                              )}

                              {/* Add Custom Subcategory under this Category */}
                              <div className="pt-1.5 border-t border-outline-variant/30 flex items-center justify-between">
                                {activeCustomSubKey === catKey ? (
                                  <div className="flex items-center gap-1.5 w-full">
                                    <Input
                                      value={customSubText}
                                      onChange={(e) => setCustomSubText(e.target.value)}
                                      placeholder="Branch / Specialization name"
                                      className="text-xs py-1"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleAddCustomSubcategory(lvl, cat);
                                        }
                                      }}
                                    />
                                    <Button
                                      size="sm"
                                      variant="primary"
                                      onClick={() => handleAddCustomSubcategory(lvl, cat)}
                                      className="px-2 py-1 text-xs"
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setActiveCustomSubKey(null);
                                        setCustomSubText('');
                                      }}
                                      className="px-2 py-1 text-xs"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveCustomSubKey(catKey);
                                      setCustomSubText('');
                                    }}
                                    className="text-[11px] text-primary font-semibold flex items-center gap-1 bg-transparent border-none cursor-pointer hover:underline p-0"
                                  >
                                    <span className="material-symbols-outlined text-[13px]">add</span>
                                    Custom Specialization / Branch
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <p className="text-[11px] text-on-surface-variant mt-2 mb-0">
        {value.length === 0
          ? 'No streams selected. Check any level & category to assign to this institute.'
          : `${totalAssignedCategories} categories and ${totalAssignedSubs} specializations assigned.`}
      </p>
    </div>
  );
}
