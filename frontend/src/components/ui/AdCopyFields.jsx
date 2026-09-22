import { FormGroup, Select } from './Field';
import { AD_TITLE_OPTIONS, AD_DESCRIPTION_OPTIONS, fillAdTemplate, withCurrent } from '../../constants/adTemplates';

/**
 * The predecided title and description for one ad.
 *
 * Client feedback 22 Sep 2026, row 5: "Ad Notice title - in One Line (Select
 * Any One) should be predecided" and "Ad description - 3 Line (Select Any One)
 * - should be predecided."
 *
 * So both are `<select>` over a closed list with no free-text escape — the
 * uniformity is the requirement, not a side effect. The stored value is the
 * final text (templates are filled with the institute's name on selection),
 * not a key, so nothing already published changes meaning and the public page
 * needs no knowledge of this list.
 *
 * Shared by the Platform Admin's editor (AdsTab) and the Institute Console
 * (ManageOpportunities) so the two offer exactly the same options.
 */
export default function AdCopyFields({
  section,           // 'admission' | 'job' | 'paper'
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  instituteName,
  titleLabel = 'Ad Title (one line)',
}) {
  const titleOptions = withCurrent(AD_TITLE_OPTIONS[section] || [], title);
  const descriptionOptions = withCurrent(AD_DESCRIPTION_OPTIONS[section] || [], description);

  return (
    <>
      <FormGroup label={titleLabel}>
        <Select value={title || ''} onChange={(e) => onTitleChange(e.target.value)}>
          <option value="" disabled>Select a title…</option>
          {titleOptions.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
        <p className="text-[11px] text-on-surface-variant mt-1 mb-0">
          Titles are set by the platform so every ad reads the same length and tone.
        </p>
      </FormGroup>

      <FormGroup label="Ad Description (three lines)">
        <Select
          value={description || ''}
          // The template is filled in here rather than at render time, so what
          // is saved is exactly what the public page will show.
          onChange={(e) => onDescriptionChange(fillAdTemplate(e.target.value, instituteName))}
        >
          <option value="" disabled>Select a description…</option>
          {descriptionOptions.map((d) => (
            <option key={d} value={d}>
              {/* One line in the closed dropdown; the full three show below. */}
              {fillAdTemplate(d, instituteName).split('\n')[0]}
            </option>
          ))}
        </Select>
        {description ? (
          <div className="mt-2 p-3 rounded-lg bg-surface-container-low border border-outline-variant">
            {description.split('\n').map((line, i) => (
              <p key={i} className="text-xs text-on-surface m-0 leading-relaxed">{line}</p>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-on-surface-variant mt-1 mb-0">
            Pick one — the full three lines preview here.
          </p>
        )}
      </FormGroup>
    </>
  );
}
