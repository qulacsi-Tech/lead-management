import { useState } from 'react';
import { Label } from './Field';
import { courseCategoriesFor, courseSubcategoriesFor } from '../../constants/taxonomy';

/**
 * PLATFORM-OWNED vocabulary, institute-scoped selection.
 *
 * Which course categories (and, under each, which subcategories) an institute
 * offers. The options come from the platform taxonomy for the institute's
 * *type* — see constants/taxonomy.js. Client feedback 22 Sep 2026, rows 3 & 4.
 *
 * Value shape, stored on `pages.course_categories`:
 *
 *     [{ category: 'Medical Entrance', subcategories: ['NEET UG'] }, ...]
 *
 * A category with an empty `subcategories` is meaningful: "we teach this
 * broadly". So selecting a category and selecting its subcategories are two
 * separate acts, and the first does not imply the second.
 */
export default function CourseCategorySelect({ type, value = [], onChange, disabled = false }) {
  const categories = courseCategoriesFor(type);
  // Collapsed by default: a University offers nine categories and expanding
  // every one of them turns the create form into a wall of checkboxes.
  const [expanded, setExpanded] = useState(() => new Set());

  const selectedFor = (category) => value.find((v) => v.category === category);

  const toggleCategory = (category) => {
    if (disabled) return;
    if (selectedFor(category)) {
      onChange(value.filter((v) => v.category !== category));
      setExpanded((prev) => {
        const next = new Set(prev);
        next.delete(category);
        return next;
      });
    } else {
      onChange([...value, { category, subcategories: [] }]);
      setExpanded((prev) => new Set(prev).add(category));
    }
  };

  const toggleSubcategory = (category, sub) => {
    if (disabled) return;
    onChange(
      value.map((v) => {
        if (v.category !== category) return v;
        const subs = v.subcategories || [];
        return {
          ...v,
          subcategories: subs.includes(sub) ? subs.filter((s) => s !== sub) : [...subs, sub],
        };
      }),
    );
  };

  if (categories.length === 0) {
    return (
      <div>
        <Label>Course Categories</Label>
        <p className="text-xs text-on-surface-variant mb-0 mt-1.5">
          No course categories are configured for {type || 'this'} pages yet.
        </p>
      </div>
    );
  }

  const totalSubs = value.reduce((n, v) => n + (v.subcategories?.length || 0), 0);

  return (
    <div>
      <Label>Course Categories</Label>
      <p className="text-[11px] text-on-surface-variant mt-0 mb-2">
        What this {String(type || 'institute').toLowerCase()} teaches. These appear on the public
        page and in the enquiry form, so a student can pick the course they are asking about.
      </p>

      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 border border-outline-variant rounded-xl p-2">
        {categories.map((category) => {
          const selected = selectedFor(category);
          const isOpen = expanded.has(category);
          const subs = courseSubcategoriesFor(type, category);

          return (
            <div key={category} className="rounded-lg">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={!!selected}
                    onChange={() => toggleCategory(category)}
                    disabled={disabled}
                    className="accent-primary cursor-pointer"
                  />
                  <span className="text-sm text-on-surface font-medium truncate">{category}</span>
                </label>
                {selected && subs.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded((prev) => {
                        const next = new Set(prev);
                        if (next.has(category)) next.delete(category);
                        else next.add(category);
                        return next;
                      })
                    }
                    className="bg-transparent border-none cursor-pointer text-[11px] text-primary font-semibold shrink-0 flex items-center gap-0.5"
                  >
                    {selected.subcategories?.length || 0} of {subs.length}
                    <span className="material-symbols-outlined text-[14px]">
                      {isOpen ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                )}
              </div>

              {selected && isOpen && subs.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pl-6 pb-2 pt-0.5">
                  {subs.map((sub) => {
                    const on = selected.subcategories?.includes(sub);
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => toggleSubcategory(category, sub)}
                        disabled={disabled}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                          on
                            ? 'bg-primary text-on-primary border-primary'
                            : 'bg-transparent text-on-surface-variant border-outline-variant hover:bg-surface-container-low'
                        }`}
                      >
                        {sub}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-on-surface-variant mt-1.5 mb-0">
        {value.length === 0
          ? 'None selected yet.'
          : `${value.length} categor${value.length === 1 ? 'y' : 'ies'}, ${totalSubs} subcategor${totalSubs === 1 ? 'y' : 'ies'} selected.`}
      </p>
    </div>
  );
}
