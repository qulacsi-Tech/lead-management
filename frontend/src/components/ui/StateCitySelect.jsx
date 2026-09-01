import { useEffect, useState } from 'react';
import { Label, Input, Select } from './Field';
import { fetchStates, fetchCities } from '../../data/indiaGeo';

/**
 * Paired State → City dropdowns for India.
 *
 * Client feedback, 01 Sep 2026: "State and City Drop down main aana chahiye."
 * See docs/CLIENT_FEEDBACK_2026-09-01.md, Section 1.
 *
 * Free text was not merely untidy: `Page.city` and `Page.state` are indexed
 * and drive location search, so "Indore", "indore" and "Indore " were three
 * different cities. A controlled vocabulary is what makes that column
 * queryable.
 *
 * Two behaviours worth knowing before changing this component:
 *
 * 1. A value already stored that is NOT in the dataset is kept and shown,
 *    flagged as "not in list". Silently dropping it would mean opening an
 *    existing page's editor and pressing Save wiped its location.
 * 2. If the data chunk fails to load, both fields degrade to plain text
 *    inputs rather than rendering empty, unusable dropdowns. A network blip
 *    must not block someone from saving a page.
 *
 * Controlled: the parent owns `state` and `city` and receives both back
 * together, because changing State has to clear City in the same update.
 */
export default function StateCitySelect({
  state = '',
  city = '',
  onChange,
  disabled = false,
  required = false,
  stateLabel = 'State',
  cityLabel = 'City',
  // Callers sit in forms with differing row spacing; the grid itself is the
  // only thing they need to restyle.
  className = 'grid grid-cols-2 gap-3',
}) {
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | failed

  useEffect(() => {
    let active = true;
    fetchStates()
      .then((rows) => {
        if (!active) return;
        setStates(rows);
        setStatus('ready');
      })
      .catch((err) => {
        if (!active) return;
        console.warn('India geo data failed to load; falling back to text input', err);
        setStatus('failed');
      });
    return () => {
      active = false;
    };
  }, []);

  // Reloads whenever the selected state changes, including on first hydration
  // of an existing record — so an already-saved city has its list to sit in.
  useEffect(() => {
    let active = true;
    if (status !== 'ready') return undefined;
    fetchCities(state)
      .then((rows) => {
        if (active) setCities(rows);
      })
      .catch(() => {
        if (active) setCities([]);
      });
    return () => {
      active = false;
    };
  }, [state, status]);

  if (status === 'failed') {
    return (
      <div className={className}>
        <div>
          <Label>{stateLabel}</Label>
          <Input
            aria-label={stateLabel}
            value={state}
            onChange={(e) => onChange({ state: e.target.value, city })}
            placeholder="Madhya Pradesh"
            disabled={disabled}
          />
        </div>
        <div>
          <Label>{cityLabel}</Label>
          <Input
            aria-label={cityLabel}
            value={city}
            onChange={(e) => onChange({ state, city: e.target.value })}
            placeholder="Indore"
            disabled={disabled}
          />
        </div>
      </div>
    );
  }

  const loading = status === 'loading';
  // Values held by an existing record that the dataset does not know about —
  // legacy free-text entries, or a genuine place the upstream list omits.
  const unlistedState = state && !loading && !states.some((s) => s.name === state);
  const unlistedCity = city && !loading && !cities.includes(city);

  return (
    <div className={className}>
      <div>
        <Label>{stateLabel}</Label>
        <Select
          aria-label={stateLabel}
          value={state}
          disabled={disabled || loading}
          required={required}
          // A new state invalidates the current city, so both move together.
          onChange={(e) => onChange({ state: e.target.value, city: '' })}
        >
          <option value="">{loading ? 'Loading…' : 'Select state'}</option>
          {unlistedState && <option value={state}>{state} (not in list)</option>}
          {states.map((s) => (
            <option key={s.code || s.name} value={s.name}>
              {s.name}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label>{cityLabel}</Label>
        <Select
          aria-label={cityLabel}
          value={city}
          disabled={disabled || loading || !state}
          required={required}
          onChange={(e) => onChange({ state, city: e.target.value })}
        >
          <option value="">
            {loading ? 'Loading…' : state ? 'Select city' : 'Select a state first'}
          </option>
          {unlistedCity && <option value={city}>{city} (not in list)</option>}
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
