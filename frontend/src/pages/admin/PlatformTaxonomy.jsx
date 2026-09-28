import { useEffect, useState, useMemo } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { Input, FormGroup, Select } from '../../components/ui/Field';
import CourseCategorySelect from '../../components/ui/CourseCategorySelect';
import { useTaxonomy } from '../../context/TaxonomyContext';
import { useToast } from '../../context/ToastContext';
import { fetchPages, updatePage } from '../../Api/Api';

export default function PlatformTaxonomy() {
  const {
    commonCategories = {},
    levels = [],
    affiliations = {},
    locations = [],
    addCategory,
    addSubcategory,
    deleteCategory,
    deleteSubcategory,
    addLevel,
    deleteLevel,
    addHierarchyItem,
  } = useTaxonomy();

  const { push: toast } = useToast();

  const categoryNames = useMemo(() => Object.keys(commonCategories || {}), [commonCategories]);

  const [searchQuery, setSearchQuery] = useState('');

  // -------------------------------------------------------------------------
  // STREAMLINED SINGLE-SECTION ADDER STATE
  // Level (or Custom) -> Category (or Custom) -> Subcategory (or Custom)
  // -------------------------------------------------------------------------
  const [addModeLevel, setAddModeLevel] = useState(levels[0] || '');
  const [isCustomLevel, setIsCustomLevel] = useState(false);
  const [customLevelInput, setCustomLevelInput] = useState('');

  const [addModeCategory, setAddModeCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  // Auto-sync level and category selections if data is loaded or updated
  useEffect(() => {
    if (!addModeLevel && levels.length > 0) {
      setAddModeLevel(levels[0]);
    }
  }, [levels, addModeLevel]);

  useEffect(() => {
    if (!addModeCategory && categoryNames.length > 0) {
      setAddModeCategory(categoryNames[0]);
    }
  }, [categoryNames, addModeCategory]);

  // Dynamic enter-to-checkbox subcategory list
  const [subInputText, setSubInputText] = useState('');
  const [customSubcategoryList, setCustomSubcategoryList] = useState([]);
  const [isAddingBusy, setIsAddingBusy] = useState(false);

  // Helper to add typed subcategory as a selected checkbox item
  const handleAddSubcategoryItem = () => {
    const raw = subInputText.trim();
    if (!raw) return;

    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length === 0) return;

    setCustomSubcategoryList((prev) => {
      const existingNames = new Set(prev.map((x) => x.name.toLowerCase()));
      const newItems = [...prev];

      parts.forEach((name) => {
        if (!existingNames.has(name.toLowerCase())) {
          newItems.push({
            id: `${Date.now()}-${Math.random()}`,
            name,
            checked: true,
          });
          existingNames.add(name.toLowerCase());
        } else {
          // If already in list, make sure it is checked
          const idx = newItems.findIndex((x) => x.name.toLowerCase() === name.toLowerCase());
          if (idx !== -1) newItems[idx].checked = true;
        }
      });
      return newItems;
    });

    setSubInputText('');
  };

  // Inline Subcategory Adder state per category card
  const [activeSubTarget, setActiveSubTarget] = useState(null); // `${lvl}:::${cat}`
  const [inlineSubInput, setInlineSubInput] = useState('');

  // Inline Category Adder state per level card
  const [activeCatTargetLevel, setActiveCatTargetLevel] = useState(null);
  const [inlineCatInput, setInlineCatInput] = useState('');

  // Expanded levels in explorer view
  const [expandedLevels, setExpandedLevels] = useState(() => new Set(levels[0] ? [levels[0]] : []));

  // Multi-checkbox selection for batch actions in the explorer
  const [selectedCatCheckboxes, setSelectedCatCheckboxes] = useState(() => new Set());

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
          if (res.length > 0 && !selectedPageId) {
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

  const finalLevelVal = (levels.length === 0 || isCustomLevel ? customLevelInput : (addModeLevel || levels[0] || '')).trim();
  const finalCatVal = (categoryNames.length === 0 || isCustomCategory ? customCategoryInput : (addModeCategory || categoryNames[0] || '')).trim();
  const isFormValid = finalLevelVal.length > 0 && finalCatVal.length > 0;

  // -------------------------------------------------------------------------
  // Handle Streamlined Hierarchy Addition: Level -> Category -> Subcategory
  // -------------------------------------------------------------------------
  const handleStreamlinedAdd = async (e) => {
    e.preventDefault();
    if (!finalLevelVal) {
      toast({ type: 'error', message: 'Please specify a course level / degree tier.' });
      return;
    }
    if (!finalCatVal) {
      toast({ type: 'error', message: 'Please specify a course category / stream name.' });
      return;
    }

    // Collect checked subcategory items plus any pending text
    let subs = customSubcategoryList
      .filter((item) => item.checked)
      .map((item) => item.name.trim())
      .filter(Boolean);

    const pending = subInputText.trim();
    if (pending && !subs.includes(pending)) {
      subs.push(pending);
    }

    setIsAddingBusy(true);
    try {
      await addHierarchyItem({
        level: finalLevelVal,
        category: finalCatVal,
        subcategories: subs,
      });

      toast({
        type: 'success',
        message: `Added "${finalCatVal}" under "${finalLevelVal}" to Common Pool.`,
      });

      // Reset form
      setCustomLevelInput('');
      setCustomCategoryInput('');
      setCustomSubcategoryList([]);
      setSubInputText('');
      setExpandedLevels((prev) => new Set(prev).add(finalLevelVal));
    } catch (err) {
      toast({ type: 'error', message: err?.message || 'Failed to add hierarchy item.' });
    } finally {
      setIsAddingBusy(false);
    }
  };

  // Inline Subcategory Adder
  const handleInlineAddSub = async (category) => {
    const sub = inlineSubInput.trim();
    if (!sub) return;
    try {
      await addSubcategory(null, category, sub);
      toast({ type: 'success', message: `Added "${sub}" to ${category}.` });
      setInlineSubInput('');
      setActiveSubTarget(null);
    } catch (err) {
      toast({ type: 'error', message: err?.message || 'Could not add subcategory.' });
    }
  };

  // Inline Category Adder under Level
  const handleInlineAddCat = async (lvl) => {
    const cat = inlineCatInput.trim();
    if (!cat) return;
    try {
      await addCategory(null, cat, []);
      toast({ type: 'success', message: `Added "${cat}" to Common Pool.` });
      setInlineCatInput('');
      setActiveCatTargetLevel(null);
    } catch (err) {
      toast({ type: 'error', message: err?.message || 'Could not add category.' });
    }
  };

  const handleDeleteCategory = async (category) => {
    if (!window.confirm(`Delete "${category}" and all its subcategories from platform?`)) return;
    try {
      await deleteCategory(null, category);
      toast({ type: 'success', message: `Deleted "${category}".` });
    } catch (err) {
      toast({ type: 'error', message: err?.message || 'Could not delete category.' });
    }
  };

  const handleDeleteSubcategory = async (category, sub) => {
    try {
      await deleteSubcategory(null, category, sub);
      toast({ type: 'success', message: `Removed "${sub}".` });
    } catch (err) {
      toast({ type: 'error', message: err?.message || 'Could not delete subcategory.' });
    }
  };

  const handleDeleteLevel = async (lvl) => {
    if (!window.confirm(`Delete level "${lvl}" from platform?`)) return;
    try {
      await deleteLevel(lvl);
      toast({ type: 'success', message: `Deleted level "${lvl}".` });
    } catch (err) {
      toast({ type: 'error', message: err?.message || 'Could not delete level.' });
    }
  };

  // Toggle Category Checkbox for batch selection
  const toggleCatCheckbox = (key) => {
    setSelectedCatCheckboxes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectedPage = pagesList.find((x) => x.id === selectedPageId);

  return (
    <div className="p-8 max-w-7xl mx-auto flex-1 w-full box-border space-y-6">
      {/* TOP BAR: Clean Title on Left, Assign to Institute on Right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface m-0">Course Hierarchy &amp; Taxonomy</h1>
          <p className="text-xs text-on-surface-variant m-0 mt-0.5">
            Universal common pool of course levels, streams, and specializations available to all institutes.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="primary"
            icon="checklist"
            onClick={() => setAssignModalOpen(true)}
          >
            Assign to Institute
          </Button>
        </div>
      </div>

      {/* =========================================================================
          SINGLE STREAMLINED SECTION: LEVEL VS. CATEGORY VS. SUBCATEGORY
         ========================================================================= */}
      <Card className="p-6 border border-primary/20 bg-surface-container-lowest shadow-sm">
        {/* SECTION HEADER & GUIDE */}
        <div className="flex items-start gap-3 pb-4 mb-5 border-b border-outline-variant">
          <div className="w-10 h-10 rounded-xl bg-primary-container/60 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-[22px]">account_tree</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-on-surface m-0">
                Course Hierarchy: Level vs. Category vs. Subcategory
              </h2>
              <Badge variant="primary" className="text-[10px]">Universal Common Pool</Badge>
            </div>
            <p className="text-xs text-on-surface-variant m-0 mt-1">
              Common pool available to all institutions. Add or customize: <strong>Level</strong> (or Custom) &rarr; <strong>Category / Stream</strong> (or Custom) &rarr; <strong>Subcategories / Branches</strong> (or Custom).
            </p>
          </div>
        </div>

        {/* ---------------------------------------------------------------------
            STREAMLINED ADDING BAR (Single Section Add Format)
           --------------------------------------------------------------------- */}
        <div className="p-4 rounded-2xl bg-surface-container-low/60 border border-outline-variant mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[18px]">add_circle</span>
              Add to Hierarchy: Level &rarr; Category &rarr; Subcategory
            </span>
            <span className="text-[11px] text-primary font-bold bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
              Universal Common Pool
            </span>
          </div>

          <form onSubmit={handleStreamlinedAdd} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* 1. LEVEL FIELD (with custom option) */}
              <div>
                <label className="text-[11px] font-bold text-on-surface block mb-1">
                  1. Level / Degree Tier
                </label>
                {levels.length === 0 || isCustomLevel ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={customLevelInput}
                      onChange={(e) => setCustomLevelInput(e.target.value)}
                      placeholder="e.g. Undergraduate, Diploma..."
                      className="text-xs py-1.5"
                      autoFocus={levels.length === 0}
                    />
                    {levels.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsCustomLevel(false)}
                        className="text-[11px] text-primary hover:underline bg-transparent border-none cursor-pointer shrink-0"
                      >
                        Use List
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Select
                      value={addModeLevel || levels[0] || ''}
                      onChange={(e) => {
                        if (e.target.value === '__CUSTOM__') {
                          setIsCustomLevel(true);
                          setCustomLevelInput('');
                        } else {
                          setAddModeLevel(e.target.value);
                        }
                      }}
                      className="text-xs py-1.5 flex-1"
                    >
                      {levels.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                      <option value="__CUSTOM__">+ Custom Level...</option>
                    </Select>
                  </div>
                )}
              </div>

              {/* 2. CATEGORY FIELD (with custom option) */}
              <div>
                <label className="text-[11px] font-bold text-on-surface block mb-1">
                  2. Category / Stream
                </label>
                {isCustomCategory || categoryNames.length === 0 ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={customCategoryInput}
                      onChange={(e) => setCustomCategoryInput(e.target.value)}
                      placeholder="e.g. Artificial Intelligence, Law, Commerce..."
                      className="text-xs py-1.5"
                      autoFocus
                    />
                    {categoryNames.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsCustomCategory(false)}
                        className="text-[11px] text-primary hover:underline bg-transparent border-none cursor-pointer shrink-0"
                      >
                        Use List
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Select
                      value={addModeCategory || categoryNames[0] || ''}
                      onChange={(e) => {
                        if (e.target.value === '__CUSTOM__') {
                          setIsCustomCategory(true);
                          setCustomCategoryInput('');
                        } else {
                          setAddModeCategory(e.target.value);
                        }
                      }}
                      className="text-xs py-1.5 flex-1"
                    >
                      {categoryNames.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="__CUSTOM__">+ Custom Category...</option>
                    </Select>
                  </div>
                )}
              </div>

              {/* 3. SUBCATEGORY FIELD (Enter-to-checkbox format) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-on-surface block">
                    3. Subcategories / Branches
                  </label>
                  {customSubcategoryList.length > 0 && (
                    <span className="text-[10px] text-primary font-bold">
                      {customSubcategoryList.filter((x) => x.checked).length} of {customSubcategoryList.length} selected
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <Input
                    value={subInputText}
                    onChange={(e) => setSubInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubcategoryItem();
                      }
                    }}
                    placeholder="Type branch & press Enter..."
                    className="text-xs py-1.5 flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddSubcategoryItem}
                    className="px-2.5 py-1.5 text-xs shrink-0"
                  >
                    Add
                  </Button>
                </div>

                {/* Checkbox Items generated on Enter */}
                {customSubcategoryList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 p-2 rounded-xl bg-surface-container-lowest border border-outline-variant/60 max-h-28 overflow-y-auto">
                    {customSubcategoryList.map((item) => (
                      <label
                        key={item.id}
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs cursor-pointer select-none transition-all ${item.checked
                          ? 'bg-primary/10 border-primary text-primary font-medium'
                          : 'bg-surface-container-low border-outline-variant/60 text-on-surface-variant hover:bg-surface-container-high'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() =>
                            setCustomSubcategoryList((prev) =>
                              prev.map((x) => (x.id === item.id ? { ...x, checked: !x.checked } : x))
                            )
                          }
                          className="w-3.5 h-3.5 accent-primary cursor-pointer rounded"
                        />
                        <span className="truncate max-w-[130px]">{item.name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCustomSubcategoryList((prev) => prev.filter((x) => x.id !== item.id));
                          }}
                          className="text-on-surface-variant hover:text-error p-0 border-none bg-transparent cursor-pointer flex items-center"
                          title="Remove branch"
                        >
                          <span className="material-symbols-outlined text-[13px]">close</span>
                        </button>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-on-surface-variant italic">
                Tip: Type each branch and press Enter to turn it into a selected checkbox. All checked branches will be added.
              </span>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                icon="add"
                disabled={!isFormValid || isAddingBusy}
                className={!isFormValid ? 'opacity-50 cursor-not-allowed' : ''}
              >
                {isAddingBusy ? 'Adding...' : 'Add to Hierarchy'}
              </Button>
            </div>
          </form>
        </div>

        {/* ---------------------------------------------------------------------
            NESTED FORMAT HIERARCHY EXPLORER WITH MULTI-SELECT CHECKBOXES
           --------------------------------------------------------------------- */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-on-surface">Live Hierarchy Explorer:</span>
              <span className="text-[11px] text-on-surface-variant">
                {levels.length} levels, {categoryNames.length} categories in Common Pool
              </span>
            </div>
            <div className="w-full sm:w-64">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search category or specialization..."
                className="text-xs py-1"
              />
            </div>
          </div>

          {/* NESTED LEVELS & CATEGORIES */}
          <div className="space-y-3">
            {levels.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2">account_tree</span>
                <h3 className="text-sm font-semibold text-on-surface mb-1">No Hierarchy Configured Yet</h3>
                <p className="text-xs text-on-surface-variant max-w-md mx-auto">
                  Seed data has been cleared. Use the section above to add your first Level, Category, and Subcategories to the Universal Common Pool.
                </p>
              </div>
            ) : (
              levels.map((lvl) => {
                const isOpen = expandedLevels.has(lvl);
                // Filter categories matching search
                const matchingCategories = Object.entries(commonCategories).filter(([cat, subs]) => {
                  if (!searchQuery.trim()) return true;
                  const q = searchQuery.toLowerCase();
                  return cat.toLowerCase().includes(q) || subs.some((s) => s.toLowerCase().includes(q));
                });

                return (
                  <div
                    key={lvl}
                    className="rounded-2xl border border-outline-variant bg-surface-container-lowest overflow-hidden transition-all shadow-xs"
                  >
                    {/* LEVEL ACCORDION HEADER */}
                    <div className="flex items-center justify-between p-3.5 bg-surface-container-low/70">
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
                            {isOpen ? 'expand_more' : 'chevron_right'}
                          </span>
                        </button>

                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                          <span className="font-bold text-xs text-on-surface">{lvl}</span>
                        </div>

                        <span className="text-[10px] text-on-surface-variant font-medium bg-surface-container-high px-2 py-0.5 rounded-full">
                          {categoryNames.length} categories available
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveCatTargetLevel(activeCatTargetLevel === lvl ? null : lvl);
                            setInlineCatInput('');
                            setExpandedLevels((prev) => new Set(prev).add(lvl));
                          }}
                          className="text-[11px] text-primary font-semibold hover:underline flex items-center gap-0.5 bg-transparent border-none cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">add</span>
                          Add Category
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteLevel(lvl)}
                          title={`Delete level "${lvl}"`}
                          className="text-on-surface-variant hover:text-error bg-transparent border-none cursor-pointer p-1 flex items-center"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>

                    {/* LEVEL CONTENT: NESTED CATEGORIES & SUBCATEGORIES */}
                    {isOpen && (
                      <div className="p-4 space-y-3 border-t border-outline-variant/60">
                        {/* Inline Category Adder under this Level */}
                        {activeCatTargetLevel === lvl && (
                          <div className="p-3 rounded-xl border border-primary/40 bg-primary/5 flex items-center gap-2 mb-3">
                            <Input
                              value={inlineCatInput}
                              onChange={(e) => setInlineCatInput(e.target.value)}
                              placeholder={`New category/stream for Common Pool under ${lvl}...`}
                              className="text-xs"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleInlineAddCat(lvl);
                                }
                              }}
                            />
                            <Button size="sm" variant="primary" onClick={() => handleInlineAddCat(lvl)}>
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setActiveCatTargetLevel(null);
                                setInlineCatInput('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}

                        {/* Categories Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                          {matchingCategories.map(([cat, subs]) => {
                            const catKey = `${lvl}:::${cat}`;
                            const isChecked = selectedCatCheckboxes.has(catKey);

                            return (
                              <div
                                key={cat}
                                className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${isChecked
                                  ? 'border-primary/50 bg-primary/5 shadow-xs'
                                  : 'border-outline-variant bg-surface-container-lowest'
                                  }`}
                              >
                                <div>
                                  {/* Category Header */}
                                  <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-outline-variant/60">
                                    <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => toggleCatCheckbox(catKey)}
                                        className="w-3.5 h-3.5 accent-primary cursor-pointer rounded"
                                      />
                                      <h4 className="text-xs font-bold text-on-surface m-0 truncate">
                                        {cat}
                                      </h4>
                                    </label>

                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] text-on-surface-variant font-medium bg-surface-container-high px-1.5 py-0.5 rounded-full">
                                        {subs.length} branches
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteCategory(cat)}
                                        title={`Delete ${cat}`}
                                        className="text-on-surface-variant hover:text-error bg-transparent border-none cursor-pointer p-0.5 flex items-center"
                                      >
                                        <span className="material-symbols-outlined text-[15px]">delete</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Subcategories Badges / Multi-format */}
                                  <div className="flex flex-wrap gap-1.5 my-2">
                                    {subs.map((s) => (
                                      <span
                                        key={s}
                                        className="inline-flex items-center gap-1 text-[11px] bg-surface-container-low border border-outline-variant/60 px-2 py-0.5 rounded-md text-on-surface"
                                      >
                                        <span>{s}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteSubcategory(cat, s)}
                                          className="bg-transparent border-none cursor-pointer p-0 text-on-surface-variant hover:text-error flex items-center"
                                          aria-label={`Remove ${s}`}
                                        >
                                          <span className="material-symbols-outlined text-[12px]">close</span>
                                        </button>
                                      </span>
                                    ))}
                                    {subs.length === 0 && (
                                      <p className="text-[11px] text-on-surface-variant m-0 italic">
                                        No subcategories yet.
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Inline Subcategory Adder */}
                                <div className="mt-2.5 pt-2 border-t border-outline-variant/40">
                                  {activeSubTarget === catKey ? (
                                    <div className="flex items-center gap-1.5">
                                      <Input
                                        value={inlineSubInput}
                                        onChange={(e) => setInlineSubInput(e.target.value)}
                                        placeholder="Branch / Specialization name"
                                        className="text-xs py-1"
                                        autoFocus
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleInlineAddSub(cat);
                                          }
                                        }}
                                      />
                                      <Button
                                        size="sm"
                                        variant="primary"
                                        onClick={() => handleInlineAddSub(cat)}
                                        className="px-2 py-1 text-xs"
                                      >
                                        Save
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setActiveSubTarget(null);
                                          setInlineSubInput('');
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
                                        setActiveSubTarget(catKey);
                                        setInlineSubInput('');
                                      }}
                                      className="text-[11px] text-primary font-semibold flex items-center gap-1 bg-transparent border-none cursor-pointer hover:underline p-0"
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

                        {matchingCategories.length === 0 && (
                          <div className="py-6 text-center text-xs text-on-surface-variant italic">
                            No categories match your search. Use "Add Category" above to create one.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Card>

      {/* =========================================================================
          LOCATIONS & AFFILIATIONS CARD
         ========================================================================= */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Serviced Locations */}
        <Card className="p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-primary-container/50 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-[20px]">location_on</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-on-surface m-0">Serviced Locations</h3>
              <p className="text-xs text-on-surface-variant m-0 mt-0.5">
                Cities Connectedus operates in, used for search and lead matching.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {locations.map((loc) => (
              <span
                key={loc}
                className="text-xs bg-surface-container-high px-3 py-1.5 rounded-lg text-on-surface font-medium"
              >
                {loc}
              </span>
            ))}
          </div>
        </Card>

        {/* Affiliations */}
        <Card className="p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-primary-container/50 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-[20px]">verified</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-on-surface m-0">Accreditation / Affiliations</h3>
              <p className="text-xs text-on-surface-variant m-0 mt-0.5">
                Recognised boards and bodies across institutions.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Array.from(new Set(Object.values(affiliations || {}).flat())).map((aff) => (
              <span
                key={aff}
                className="text-xs bg-surface-container-high px-3 py-1.5 rounded-lg text-on-surface font-medium"
              >
                {aff}
              </span>
            ))}
          </div>
        </Card>
      </div>

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
