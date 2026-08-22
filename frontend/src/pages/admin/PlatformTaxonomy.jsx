import { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Input } from '../../components/ui/Field';
import {
  INSTITUTE_TYPES,
  COURSE_CATEGORIES,
  COURSE_LEVELS,
  PLATFORM_LOCATIONS,
  AFFILIATION_OPTIONS,
} from '../../constants/taxonomy';

/**
 * PLATFORM-OWNED. The controlled vocabularies every Institute Admin picks from
 * but none of them can extend — institute types, course categories and levels,
 * affiliations and serviced locations.
 *
 * Keeping these here (rather than letting each institute type free text) is what
 * makes platform-wide search and filtering possible later.
 */
function TaxonomyList({ title, description, icon, items, note }) {
  const [values, setValues] = useState(items);
  const [draft, setDraft] = useState('');

  const add = (e) => {
    e.preventDefault();
    const value = draft.trim();
    if (!value || values.includes(value)) return;
    setValues([...values, value]);
    setDraft('');
  };

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-primary-container/50 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-primary text-[20px]">{icon}</span>
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-on-surface m-0">{title}</h3>
          <p className="text-xs text-on-surface-variant m-0 mt-0.5">{description}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1.5 text-xs bg-surface-container-high px-3 py-1.5 rounded-lg text-on-surface-variant font-medium"
          >
            {v}
            <button
              type="button"
              onClick={() => setValues(values.filter((x) => x !== v))}
              className="bg-transparent border-none cursor-pointer p-0 flex items-center text-on-surface-variant hover:text-error"
              aria-label={`Remove ${v}`}
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </span>
        ))}
        {values.length === 0 && (
          <p className="text-xs text-on-surface-variant m-0">Nothing configured yet.</p>
        )}
      </div>

      <form onSubmit={add} className="flex gap-2">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add an option" />
        <Button type="submit" variant="outline" size="sm" icon="add">Add</Button>
      </form>

      {note && <p className="text-[11px] text-on-surface-variant mt-3 mb-0">{note}</p>}
    </Card>
  );
}

export default function PlatformTaxonomy() {
  const affiliationEntries = Object.entries(AFFILIATION_OPTIONS).filter(([, v]) => v.length > 0);

  return (
    <div className="p-8 max-w-7xl mx-auto flex-1 w-full box-border">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-on-surface m-0">Types &amp; Categories</h1>
        <p className="text-xs text-on-surface-variant m-0 mt-1 max-w-3xl">
          Platform-wide vocabularies. Institute Admins choose from these lists when setting up their
          page and courses — they cannot add to them, which is what keeps search and filtering
          consistent across every institute on Connectedus.
        </p>
      </div>

      <div className="mb-6 p-4 rounded-xl border border-outline-variant bg-surface-container-low flex items-start gap-3">
        <span className="material-symbols-outlined text-on-surface-variant text-[20px]">info</span>
        <p className="text-xs text-on-surface-variant m-0">
          <strong className="text-on-surface">Prototype note:</strong> edits here apply for this
          session only. These lists become platform configuration tables when the backend lands in
          Phase&nbsp;2.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <TaxonomyList
          icon="account_balance"
          title="Institute Types"
          description="Chosen by Main Admin when creating an Institute Page."
          items={INSTITUTE_TYPES}
          note="Changing a type changes which affiliation field an institute is asked for."
        />
        <TaxonomyList
          icon="category"
          title="Course Categories"
          description="Institute Admins tag each course with one of these."
          items={COURSE_CATEGORIES}
        />
        <TaxonomyList
          icon="stairs"
          title="Course Levels"
          description="Programme type shown alongside each course."
          items={COURSE_LEVELS}
        />
        <TaxonomyList
          icon="location_on"
          title="Serviced Locations"
          description="Cities Connectedus operates in, used for search and lead matching."
          items={PLATFORM_LOCATIONS}
        />
      </div>

      <Card className="p-5 mt-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-primary-container/50 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-[20px]">verified</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-on-surface m-0">Affiliations &amp; Accreditation</h3>
            <p className="text-xs text-on-surface-variant m-0 mt-0.5">
              Offered per institute type — a School picks a board, a College picks a university.
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {affiliationEntries.map(([type, options]) => (
            <div key={type} className="flex items-start gap-3 flex-wrap">
              <Badge tone="primary" className="shrink-0">{type}</Badge>
              <div className="flex flex-wrap gap-1.5 flex-1">
                {options.map((o) => (
                  <span key={o} className="text-xs bg-surface-container-high px-2.5 py-1 rounded-lg text-on-surface-variant">
                    {o}
                  </span>
                ))}
              </div>
            </div>
          ))}
          <p className="text-[11px] text-on-surface-variant m-0 pt-2 border-t border-outline-variant">
            Coaching and Training Institute types have no affiliation field — that is intentional, per
            client feedback 12 Aug 2026.
          </p>
        </div>
      </Card>
    </div>
  );
}
