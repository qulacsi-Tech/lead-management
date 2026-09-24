import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FormGroup, Input, Select } from './Field';
import { AD_TITLE_OPTIONS, fillAdTemplate, withCurrent } from '../../constants/adTemplates';
import useAdDescriptionTemplates from '../../hooks/useAdDescriptionTemplates';

/**
 * An ad's description is up to three single-line picks, one per line — "Ad
 * description - 3 Line" (22 Sep) read together with "max 3 can be selected"
 * and "each option item for desc should be single line" (24 Sep 2026).
 */
const MAX_DESCRIPTION_LINES = 3;

/** The chosen lines are stored as one string, one per line. */
const DESCRIPTION_SEPARATOR = '\n';

const CUSTOM_MAX_LENGTH = 200;

/** Each pick is one line, so collapse any whitespace run (newlines included). */
function normalizeLine(text) {
  return text.split(/\s+/).filter(Boolean).join(' ');
}

function parseLines(description) {
  return (description || '').split(DESCRIPTION_SEPARATOR).map((s) => s.trim()).filter(Boolean);
}

/**
 * The title and description for one ad.
 *
 * Client feedback 22 Sep 2026, row 5: "Ad Notice title - in One Line (Select
 * Any One) should be predecided" and "Ad description - 3 Line (Select Any One)
 * - should be predecided." The title is still a closed `<select>`.
 *
 * The description followed up (24 Sep 2026): tick up to three single-line
 * options, and "make Ad Description customizable as per requirement — make
 * those editable or add custom format". So the predecided lines come from the
 * backend, where the Main Admin edits them (Platform Admin → Ad Descriptions),
 * and on a single ad any ticked line can be customised, or one written from
 * scratch.
 *
 * The stored value is the final text (templates are filled with the
 * institute's name on selection), not template ids, so editing a template
 * never rewrites an ad that is already published and the public page needs no
 * knowledge of the template list.
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
  manageLink,        // Platform Admin only: where the template list is edited
}) {
  const titleOptions = withCurrent(AD_TITLE_OPTIONS[section] || [], title);

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

      <DescriptionPicker
        section={section}
        description={description}
        onDescriptionChange={onDescriptionChange}
        instituteName={instituteName}
        max={MAX_DESCRIPTION_LINES}
        manageLink={manageLink}
      />
    </>
  );
}

/**
 * Tick predecided lines (up to `max`), customise a ticked one, or write your
 * own. Every line — ticked or custom — counts towards `max`.
 *
 * Local `lines` state rather than deriving everything from `description`,
 * because a custom line the user has just added is empty and an empty line
 * cannot be represented in the saved string. A line is shown as an editable
 * input when it was written or customised here, or when it matches no current
 * template (older text, or a template the Main Admin has since edited) — so
 * saved text is never silently dropped.
 */
function DescriptionPicker({ section, description, onDescriptionChange, instituteName, max, manageLink }) {
  const { templates, loading, error } = useAdDescriptionTemplates(section);
  const options = templates.map((t) => ({ id: t.id, text: fillAdTemplate(t.text, instituteName) }));
  const optionTexts = options.map((o) => o.text);

  const nextKey = useRef(0);
  const makeLine = (text, custom = false) => ({ key: ++nextKey.current, text, custom });

  const [lines, setLines] = useState(() => parseLines(description).map((t) => makeLine(t)));
  const lastEmitted = useRef(description || '');

  // Re-seed when the parent swaps in a different ad; ignore our own echoes.
  useEffect(() => {
    if ((description || '') !== lastEmitted.current) {
      lastEmitted.current = description || '';
      setLines(parseLines(description).map((t) => makeLine(t)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [description]);

  const commit = (next) => {
    setLines(next);
    const value = next.map((l) => normalizeLine(l.text)).filter(Boolean).join(DESCRIPTION_SEPARATOR);
    lastEmitted.current = value;
    onDescriptionChange(value);
  };

  const isEditable = (l) => l.custom || (!loading && !optionTexts.includes(l.text));
  const atMax = lines.length >= max;

  const toggleOption = (text) => {
    const existing = lines.find((l) => !isEditable(l) && l.text === text);
    if (existing) return commit(lines.filter((l) => l !== existing));
    if (!atMax) commit([...lines, makeLine(text)]);
  };

  const customise = (text) =>
    commit(lines.map((l) => (!isEditable(l) && l.text === text ? { ...l, custom: true } : l)));

  const addCustom = () => {
    if (!atMax) commit([...lines, makeLine('', true)]);
  };

  const editLine = (key, text) =>
    commit(lines.map((l) => (l.key === key ? { ...l, text, custom: true } : l)));

  const removeLine = (key) => commit(lines.filter((l) => l.key !== key));

  const editable = lines.filter(isEditable);
  const preview = lines.map((l) => normalizeLine(l.text)).filter(Boolean);

  return (
    <FormGroup label={`Ad Description (select up to ${max} lines)`}>
      <div className="flex flex-col gap-1.5">
        {loading && <p className="text-xs text-on-surface-variant m-0">Loading descriptions…</p>}
        {error && (
          <p className="text-xs text-error m-0">
            Couldn't load the predecided lines — you can still write your own below.
          </p>
        )}
        {!loading && !error && options.length === 0 && (
          <p className="text-xs text-on-surface-variant m-0">
            No predecided lines for this ad type yet — write your own below.
          </p>
        )}

        {options.map((option) => {
          const checked = lines.some((l) => !isEditable(l) && l.text === option.text);
          const disabled = !checked && atMax;
          return (
            <label
              key={option.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors ${
                checked ? 'border-primary bg-primary-container/10' : 'border-outline-variant'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-surface-container-low'}`}
            >
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0 accent-primary"
                checked={checked}
                disabled={disabled}
                onChange={() => toggleOption(option.text)}
              />
              <span className="text-xs text-on-surface flex-1 min-w-0">{option.text}</span>
              {checked && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    customise(option.text);
                  }}
                  className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-transparent border-none cursor-pointer p-0 hover:underline"
                >
                  <span className="material-symbols-outlined text-[14px]">edit</span>
                  Customise
                </button>
              )}
            </label>
          );
        })}

        {editable.map((l) => (
          <div key={l.key} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-primary bg-primary-container/10">
            <span className="text-[11px] font-semibold text-primary uppercase tracking-wide shrink-0">Custom</span>
            <Input
              value={l.text}
              maxLength={CUSTOM_MAX_LENGTH}
              onChange={(e) => editLine(l.key, e.target.value)}
              placeholder="Write one line"
            />
            <button
              type="button"
              onClick={() => removeLine(l.key)}
              aria-label="Remove line"
              className="shrink-0 flex items-center text-on-surface-variant bg-transparent border-none cursor-pointer p-0 hover:text-error"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addCustom}
          disabled={atMax}
          className="self-start inline-flex items-center gap-1 text-xs font-semibold text-primary bg-transparent border-none cursor-pointer p-0 mt-1 hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Write your own line
        </button>
      </div>

      <p className="text-[11px] text-on-surface-variant mt-2 mb-0">
        {lines.length} of {max} lines selected{atMax ? ' — remove one to choose a different line.' : '.'}
        {manageLink && (
          <>
            {' '}
            <Link to={manageLink} className="text-primary font-semibold">Manage predecided lines</Link>
          </>
        )}
      </p>
      {preview.length > 0 && (
        <div className="mt-2 p-3 rounded-lg bg-surface-container-low border border-outline-variant">
          {preview.map((line, i) => (
            <p key={i} className="text-xs text-on-surface m-0 leading-relaxed">{line}</p>
          ))}
        </div>
      )}
    </FormGroup>
  );
}
