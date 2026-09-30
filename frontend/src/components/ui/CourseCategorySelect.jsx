import { useState } from 'react';
import { Label } from './Field';
import { useTaxonomy } from '../../context/TaxonomyContext';

/**
 * CourseCategorySelect — pick an institute's courses from the master list.
 *
 * Level -> Category -> Subcategory, as nested checkboxes. SELECT ONLY: the
 * levels, categories and branches are the ones the Platform Admin keeps in
 * Types & Categories (per level), and nothing new can be added from here
 * (client request, 30 Sep 2026: "only can be selected, whatever added there
 * in master page"). Used on the institute details page, in "Assign to
 * Institute", and in the institute's own page editor.
 *
 * Value shape on `pages.course_categories`:
 *   [
 *     { level: 'UG', category: 'B.Tech', subcategories: ['CSE', 'Mechanical'] },
 *     { level: 'PG', category: 'MBA', subcategories: ['Marketing', 'Finance'] }
 *   ]
 */
export default function CourseCategorySelect({ value = [], onChange, disabled = false }) {
  const { levels: platformLevels = [], levelHierarchy = {}, commonCategories = {} } = useTaxonomy();

  // Each level offers its own categories and branches. Only when no per-level
  // tree exists at all does every level fall back to the old pooled list.
  const hasLevelTree = Object.values(levelHierarchy).some((cats) => Object.keys(cats || {}).length > 0);
  const categoriesFor = (lvl) => (hasLevelTree ? levelHierarchy[lvl] || {} : commonCategories);

  const [expandedLevels, setExpandedLevels] = useState(() => new Set());
  const [expandedCategories, setExpandedCategories] = useState(() => new Set());

  // Master levels, plus any level an existing assignment still names (a level
  // renamed or removed since), so that assignment can be unticked.
  const allLevels = Array.from(new Set([...platformLevels, ...value.map((v) => v.level).filter(Boolean)]));

  const matches = (v, lvl, cat) => (v.level ? v.level === lvl : true) && v.category === cat;
  const findEntry = (lvl, cat) => value.find((v) => matches(v, lvl, cat));

  const toggleCategory = (lvl, cat) => {
    if (disabled) return;
    if (findEntry(lvl, cat)) {
      onChange(value.filter((v) => !matches(v, lvl, cat)));
    } else {
      onChange([...value, { level: lvl, category: cat, subcategories: [] }]);
      setExpandedCategories((prev) => new Set(prev).add(`${lvl}:::${cat}`));
    }
  };

  const toggleSubcategory = (lvl, cat, sub) => {
    if (disabled) return;
    const existing = findEntry(lvl, cat);
    if (!existing) {
      onChange([...value, { level: lvl, category: cat, subcategories: [sub] }]);
      return;
    }
    const current = existing.subcategories || [];
    const next = current.includes(sub) ? current.filter((s) => s !== sub) : [...current, sub];
    onChange(value.map((v) => (matches(v, lvl, cat) ? { ...v, level: lvl, subcategories: next } : v)));
  };

  const selectAllSubcategories = (lvl, cat, allSubs) => {
    if (disabled) return;
    const existing = findEntry(lvl, cat);
    const current = existing?.subcategories || [];
    const allSelected = allSubs.length > 0 && allSubs.every((s) => current.includes(s));
    if (!existing) {
      onChange([...value, { level: lvl, category: cat, subcategories: [...allSubs] }]);
      return;
    }
    onChange(value.map((v) => (
      matches(v, lvl, cat) ? { ...v, level: lvl, subcategories: allSelected ? [] : [...allSubs] } : v
    )));
  };

  const toggleOpen = (setter, key) => setter((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  });

  const totalAssignedCategories = value.length;
  const totalAssignedSubs = value.reduce((sum, v) => sum + (v.subcategories?.length || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 text-[20px]">account_tree</span>
            <Label className="m-0 font-bold">Course Hierarchy Assignment</Label>
          </div>
          <p className="text-[11px] text-slate-500 m-0 mt-0.5">
            Tick the levels, categories and branches this institute offers. The options come from
            Platform Admin → Types &amp; Categories.
          </p>
        </div>
        <span className="shrink-0 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
          {totalAssignedCategories} streams, {totalAssignedSubs} specializations assigned
        </span>
      </div>

      {allLevels.length === 0 && (
        <p className="text-xs text-slate-500 italic m-0 py-4 text-center">
          No levels set up yet. Add them in Platform Admin → Types &amp; Categories.
        </p>
      )}

      <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
        {allLevels.map((lvl) => {
          const isLvlOpen = expandedLevels.has(lvl);
          const levelAssigned = value.filter((v) => (v.level ? v.level === lvl : true));
          const levelTree = categoriesFor(lvl);
          // This level's categories, plus any still assigned here that the
          // master list no longer has, so they can be unticked.
          const levelCategories = Array.from(new Set([
            ...Object.keys(levelTree),
            ...value.filter((v) => v.level === lvl).map((v) => v.category),
          ]));

          return (
            <div
              key={lvl}
              className={`rounded-2xl border transition-all ${
                levelAssigned.length > 0 ? 'border-blue-300 bg-white shadow-sm' : 'border-slate-200 bg-white'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleOpen(setExpandedLevels, lvl)}
                aria-expanded={isLvlOpen}
                className="w-full flex items-center gap-2.5 p-3 bg-slate-50 rounded-t-2xl border-none cursor-pointer text-left"
              >
                <span className="material-symbols-outlined text-[18px] text-slate-500">
                  {isLvlOpen ? 'expand_more' : 'chevron_right'}
                </span>
                <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  {lvl}
                </span>
                <span className="text-[10px] text-slate-500">
                  {levelCategories.length} categor{levelCategories.length === 1 ? 'y' : 'ies'}
                </span>
                {levelAssigned.length > 0 && (
                  <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">
                    {levelAssigned.length} selected
                  </span>
                )}
              </button>

              {isLvlOpen && (
                <div className="p-3.5 border-t border-slate-200">
                  {levelCategories.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic m-0">
                      Nothing under {lvl} yet — add categories in Platform Admin → Types &amp; Categories.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {levelCategories.map((cat) => {
                        const entry = findEntry(lvl, cat);
                        const isCatSelected = !!entry;
                        const catKey = `${lvl}:::${cat}`;
                        const isCatOpen = expandedCategories.has(catKey);
                        const allSubs = Array.from(new Set([...(levelTree[cat] || []), ...(entry?.subcategories || [])]));
                        const selectedSubsCount = entry?.subcategories?.length || 0;
                        const allSubsSelected = allSubs.length > 0 && selectedSubsCount === allSubs.length;

                        return (
                          <div
                            key={cat}
                            className={`rounded-xl border transition-all ${
                              isCatSelected ? 'border-blue-400 bg-blue-50/50' : 'border-slate-200 bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between p-2.5 gap-2">
                              <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isCatSelected}
                                  onChange={() => toggleCategory(lvl, cat)}
                                  disabled={disabled}
                                  className="w-4 h-4 accent-blue-600 cursor-pointer rounded"
                                />
                                <span className={`text-xs font-bold truncate ${isCatSelected ? 'text-blue-700' : 'text-slate-900'}`}>
                                  {cat}
                                </span>
                              </label>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {isCatSelected && allSubs.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => selectAllSubcategories(lvl, cat, allSubs)}
                                    disabled={disabled}
                                    className="text-[10px] text-blue-700 hover:underline bg-transparent border-none cursor-pointer font-medium"
                                  >
                                    {allSubsSelected ? 'Deselect' : 'Select all'}
                                  </button>
                                )}
                                {allSubs.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => toggleOpen(setExpandedCategories, catKey)}
                                    aria-expanded={isCatOpen}
                                    aria-label={`${isCatOpen ? 'Hide' : 'Show'} branches of ${cat}`}
                                    className="bg-slate-100 border-none cursor-pointer text-[10px] text-slate-600 font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5 hover:bg-slate-200"
                                  >
                                    <span>{isCatSelected ? `${selectedSubsCount}/` : ''}{allSubs.length}</span>
                                    <span className="material-symbols-outlined text-[13px]">
                                      {isCatOpen ? 'expand_less' : 'expand_more'}
                                    </span>
                                  </button>
                                )}
                              </div>
                            </div>

                            {isCatOpen && allSubs.length > 0 && (
                              <div className="p-3 pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {allSubs.map((sub) => {
                                  const isSubSelected = !!entry?.subcategories?.includes(sub);
                                  return (
                                    <label
                                      key={sub}
                                      className={`flex items-center gap-2 p-1.5 px-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                                        isSubSelected
                                          ? 'bg-blue-50 border-blue-400 text-blue-800 font-medium'
                                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSubSelected}
                                        onChange={() => toggleSubcategory(lvl, cat, sub)}
                                        disabled={disabled}
                                        className="w-3.5 h-3.5 accent-blue-600 cursor-pointer rounded"
                                      />
                                      <span className="truncate">{sub}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
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

      <p className="text-[11px] text-slate-500 mt-2 mb-0">
        {value.length === 0
          ? 'No streams selected. Tick a category under any level to assign it to this institute.'
          : `${totalAssignedCategories} categories and ${totalAssignedSubs} specializations assigned.`}
      </p>
    </div>
  );
}
