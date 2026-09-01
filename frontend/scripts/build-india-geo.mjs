/**
 * Regenerates `src/data/indiaGeo.json` — the India State → City list backing
 * every location dropdown in the app.
 *
 * Source: https://github.com/dr5hn/countries-states-cities-database (ODbL-1.0).
 *
 * Why a checked-in file rather than a runtime fetch: the upstream dataset only
 * publishes cities inside one 46 MB combined JSON covering every country. We
 * need ~50 KB of it. Downloading 46 MB in the browser to use 0.1% of it is not
 * an option, and neither is a hard dependency on GitHub being reachable at
 * page load, so the India subset is extracted once, here, and committed.
 *
 * Usage:
 *     node scripts/build-india-geo.mjs
 *
 * Run it when the upstream data has meaningfully changed — this is a slow-
 * moving dataset, so in practice that is rarely. Commit the regenerated JSON
 * along with the `_revision` it stamps, so the file's provenance stays
 * auditable.
 */

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const REPO = 'dr5hn/countries-states-cities-database';
const DATA_PATH = 'json/countries+states+cities.json';
const RAW_URL = `https://raw.githubusercontent.com/${REPO}/master/${encodeURI(DATA_PATH)}`;
const COMMITS_URL = `https://api.github.com/repos/${REPO}/commits?path=${encodeURIComponent(DATA_PATH)}&per_page=1`;

const OUT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'data',
  'indiaGeo.json',
);

/** The upstream commit the data is taken from, so the output records exactly
 *  which revision produced it. Best-effort — a rate-limited API must not fail
 *  the build. */
async function upstreamRevision() {
  try {
    const res = await fetch(COMMITS_URL, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return 'unknown revision';
    const [commit] = await res.json();
    const date = commit.commit.committer.date.slice(0, 10);
    return `${DATA_PATH} @ ${commit.sha} (${date})`;
  } catch {
    return 'unknown revision';
  }
}

async function main() {
  console.log(`Downloading ${RAW_URL} (~46 MB) …`);
  const res = await fetch(RAW_URL);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  const countries = await res.json();

  const india = countries.find((c) => c.iso2 === 'IN');
  if (!india) throw new Error('India (iso2=IN) not present in the upstream dataset');

  const states = india.states
    .map((s) => ({
      name: s.name,
      code: s.iso2,
      type: s.type, // "state" | "union territory"
      cities: [...new Set(s.cities.map((c) => c.name))].sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const cityCount = states.reduce((n, s) => n + s.cities.length, 0);
  // A guard against silently shipping a truncated file if upstream restructures.
  if (states.length < 30 || cityCount < 3000) {
    throw new Error(`Suspiciously small extract: ${states.length} states, ${cityCount} cities`);
  }

  const payload = {
    _source: `https://github.com/${REPO}`,
    _license: 'ODbL-1.0 (Open Database License) — attribution required',
    _revision: await upstreamRevision(),
    _note: 'India subset only. Regenerate with scripts/build-india-geo.mjs',
    states,
  };

  await writeFile(OUT, JSON.stringify(payload), 'utf-8');
  console.log(`Wrote ${OUT}\n  ${states.length} states/UTs, ${cityCount} cities`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
