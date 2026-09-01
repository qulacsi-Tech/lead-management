/**
 * India State → City lookup.
 *
 * Data lives in `indiaGeo.json` (36 states/UTs, 4198 cities, ~50 KB), extracted
 * from github.com/dr5hn/countries-states-cities-database (ODbL-1.0) by
 * `scripts/build-india-geo.mjs`.
 *
 * The JSON is loaded through a dynamic `import()` rather than a top-level one
 * so Vite emits it as its own chunk: only screens that actually render a
 * location picker pay for it, and it is fetched once per session and cached
 * here for every subsequent caller.
 *
 * Relationship to the backend's `/geo/*` endpoints: those serve
 * `backend/data/india_geo.py`, which is State → District → Block — administrative
 * subdivisions, used for the student/mentor registration forms. Districts are
 * not cities (many share a name, many do not), so this is a different dataset
 * for a different question, not a duplicate of it.
 */

let cache = null;
let inflight = null;

/** The whole dataset, loaded at most once. */
export async function loadIndiaGeo() {
  if (cache) return cache;
  if (!inflight) {
    inflight = import('./indiaGeo.json')
      .then((mod) => {
        cache = mod.default;
        return cache;
      })
      .finally(() => {
        // Cleared either way: on success the value lives in `cache`, and on
        // failure a retained rejected promise would make every later caller
        // fail too, with no way to retry.
        inflight = null;
      });
  }
  return inflight;
}

/** States and union territories, alphabetical: `[{ name, code, type }]`. */
export async function fetchStates() {
  const geo = await loadIndiaGeo();
  return geo.states.map(({ name, code, type }) => ({ name, code, type }));
}

/** City names in `stateName`, alphabetical. Unknown state -> `[]`. */
export async function fetchCities(stateName) {
  if (!stateName) return [];
  const geo = await loadIndiaGeo();
  const match = geo.states.find((s) => s.name === stateName);
  return match ? match.cities : [];
}
