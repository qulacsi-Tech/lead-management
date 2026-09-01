# Client Feedback Analysis — WhatsApp thread (11:53am – 7:07pm)

Status: **Analysed. Points 1, 5 and 9, plus the Section 12 follow-up, are built. Points 2, 3, 4, 6, 7 and 8 are not.** Source is four WhatsApp screenshots from Avdhesh Tiwari (+91 97130 36505), captured against the live deployment at `lead.qulacsi.com`. The screenshots do not carry a date; recorded 01 Sep 2026.

This document is for **discussion first** — most points need a decision from the client before they should be built (see [Section 11](#11-open-questions--needs-a-decision)). Only point 1 has been implemented so far.

---

## 0. TL;DR

Nine points, in four messages. Grouped by what they actually are:

| # | Point | Kind | Effort |
|---|---|---|---|
| 1 | State & City must be dropdowns | ✅ **Done** — see Section 1 | S |
| 2 | Remove Logo/Banner from the Create Page form | Deletion | S |
| 3 | *(truncated)* "…do popup mat rakho" | **Unreadable — needs clarification** | ? |
| 4 | Page content options must vary by institute type | **Real design gap — the biggest item here** | L |
| 5 | App header must not show on a public Institute Page | ✅ **Done** — see Section 5 | M |
| 6 | Public page should open in a new tab | Small behaviour change | S |
| 7 | Floating enquiry tab missing | **Likely a real bug — cause identified** | S |
| 8 | Course *stream* — assign 8 from a master list of 100 | **New feature — needs a decision** | L |
| 9 | URL should be `/college/sait/indore` | ✅ **Done** — see Section 9 | L |

**The two that matter most:** #4 (type-specific content banks) is a genuine product gap the client caught by using the tool — the entire "Select & Fill" builder is type-agnostic today, and he is right that it produces nonsense for a coaching institute. #9 (three-segment URLs) is cheap to *say* and expensive to *do*, because the single-segment slug is currently load-bearing for both react-router and the SEO renderer.

**#1, #2, #6, #7** are roughly a half-day of work between them and should just be done.

---

## 1. State and City must be dropdowns — ✅ **IMPLEMENTED**

> "State and City Drop down main aana chahiye"

**Where:** the Create Institute Page modal at `/admin/pages`.

**State before the fix — confirmed:** both were free-text inputs.

```
frontend/src/pages/admin/ManagePages.jsx:451-457
  <Label>City</Label>   <Input value={form.city}  placeholder="Indore" />
  <Label>State</Label>  <Input value={form.state} placeholder="Madhya Pradesh" />
```

**The important finding: the data and the API already exist and are simply not used.**

- `backend/routers/geo.py` serves `/geo/states`, `/geo/districts`, `/geo/blocks`.
- `backend/data/india_geo.py` is 870 lines of real State → District → Block data.
- `frontend/src/Api/Api.js:136-139` already exports `fetchStates`, `fetchDistricts`, `fetchBlocks`.
- **`fetchStates` and `fetchDistricts` are called from nowhere in the frontend.** Grep returns only their own definitions.

That made this look like a pure wiring job — but see [What was built](#what-was-built) for why the existing endpoint turned out to be the wrong data.

**Why it matters beyond tidiness:** `Page.city` and `Page.state` are indexed columns used for search filtering, and (per point 9) the client wants the city *in the URL*. Free text means "Indore", "indore", "INDORE" and "Indore " become four different cities, which silently breaks both. This should be fixed regardless of whether point 9 is built.

### What was built

A reusable `StateCitySelect` component, wired into both places a Page's location is edited.

**Data source — changed from the plan above.** The backend `/geo/*` endpoints turned out to serve the wrong shape: `india_geo.py` is State → **District** → Block, i.e. administrative subdivisions. Districts are not cities. The client asked for a City dropdown, and picking "Indore district" where he means the city of Indore would put the wrong string in `Page.city` and, under point 9, in the URL.

So the city list now comes from [dr5hn/countries-states-cities-database](https://github.com/dr5hn/countries-states-cities-database) (ODbL-1.0), per the client's instruction, extracted to a local file: **36 states/UTs, 4,198 cities.** The backend `/geo/*` endpoints are untouched and still serve the student/mentor registration forms, which genuinely do want districts and blocks.

| File | Purpose |
|---|---|
| `frontend/src/data/indiaGeo.json` | The India subset, ~50 KB. Stamped with source, licence and upstream commit. |
| `frontend/src/data/indiaGeo.js` | `fetchStates()` / `fetchCities(state)`. Lazy `import()`, cached per session. |
| `frontend/src/components/ui/StateCitySelect.jsx` | The reusable paired dropdowns. |
| `frontend/scripts/build-india-geo.mjs` | Regenerates the JSON. `npm run build:geo`. |
| `frontend/src/components/ui/StateCitySelect.test.jsx` | 7 tests, covering the data and the component. |

**Why a checked-in file rather than a runtime fetch:** upstream only publishes cities inside one 46 MB JSON covering every country. We need 0.1% of it. It is extracted once, at build time, and committed.

**Bundle cost: none on first load.** The JSON is a dynamic `import()`, so Vite emits it as its own chunk (41.8 KB raw / **19.4 KB gzipped**) fetched only when a location picker is first rendered.

### Two decisions worth knowing

1. **A stored value not in the dataset is preserved**, shown as `Indore (not in list)`. Without this, opening an existing page's editor and pressing Save would silently wipe a location entered as free text before this change.
2. **If the data chunk fails to load, both fields degrade to text inputs.** A network blip must not block someone from saving a page.

Changing State clears City in the same update, so an impossible pair (Kerala + Indore) cannot be persisted. Both selects also gained `aria-label`s — the shared `Label` component has no `htmlFor`, so they previously had no accessible name.

### Still open

- **Existing free-text rows are not normalised.** Nothing is broken — they display and re-save fine — but `Page.city` will hold a mix until each page is next edited. A one-off backfill is worth doing before point 9 puts the city into URLs. **Needs a decision.**
- `ManageInstitutes.jsx:465` — the legacy *institute account* edit form — still has a free-text City and no State field at all. Left alone deliberately: it is a different table from `pages`, and adding a State to it changes that model. Flagging rather than half-doing it.
- 618 options in the Uttar Pradesh city list is a lot to scroll. Native selects support keyboard type-ahead, so it is usable, but a searchable combobox would be better if the client finds it awkward.

---

## 2. Remove Logo / Header Banner from the Create Page form

> "logo header yahan se hata do kyonki vo already edit karte time andar aa hi rahe hai"
> *(remove logo/header from here, they already appear inside while editing)*

**Current state — confirmed, he is right, it is duplicated:**

| Where | Code |
|---|---|
| Create modal | `ManagePages.jsx:397-442` — Logo + "Header Banner Images (2–3)" |
| Page editor | `InstitutePageEditor.jsx:155-186` — the same two uploads, against the live page |

The create modal's uploads are also the more awkward of the two: they defer the actual upload until after the page row exists (`ManagePages.jsx:211-213` uploads *after* create returns), so a failed image upload leaves a created page with no logo and no obvious error path.

**To build:** delete both fields from the create modal along with the deferred upload calls. Media stays entirely in the editor, which is where it works properly. `CreateInstitutePage.jsx` (the user-facing create flow) carries the same duplication and should be cut the same way.

**Note:** this contradicts the 16 Aug ask, where the client explicitly requested "Logo upload option and a nice-looking header banner" *in the admin creation tool*. He has since used it and changed his mind. Worth a one-line confirmation so nobody re-adds it later.

---

## 3. "…do popup mat rakho" — **cannot be read**

The 11:55am message is cut off at the top of the second screenshot. Only the tail is visible: *"…do popup mat rakho"* ("don't keep a … popup").

**Do not guess at this one.** Two candidates, and they lead to opposite work:

- A **login-reminder popup**. The SEO plan (`docs/SEO_PUBLIC_SURFACE_PLAN_2026-08-23.md`) records a client requirement for exactly this — "a login reminder popup appearing on a timer." If he now wants it gone, that reverses a prior decision. *(For the record: no such timer exists yet — `context/LoginPrompt.jsx` has no `setTimeout` and only opens on an explicit action.)*
- A **confirmation/success popup** in the admin create flow, in which case it is a small UI change.

**Action: ask for the full message.** It is one screenshot away.

---

## 4. Page content options must vary by institute type — **the real gap**

> "Ye jab main coaching edit kar raha hoon to carpet area ka option aa raha jabki usme number of center, har center ka address jaise options hona chahiye. Aur bhi sab check karwa lo ek baar — university aur school main aise koi aur chhote chhote points na nikle."

**The specific complaint:** editing a **Coaching** page offers *Campus Area — "e.g. 25 Acres"*. A coaching institute does not have a campus; it has **branches/centres, and an address per centre**. And he is asking us to audit School and University for the same class of mistake rather than fixing only the one field he spotted.

**Current state — confirmed, and it is broader than the one field he found. There is no type-awareness anywhere in the content builder.**

`frontend/src/pages/pageBuilderContent.js` (127 lines) exports five flat, global option banks:

| Bank | Size | Branches on page type? |
|---|---|---|
| `WHY_CHOOSE_US_OPTIONS` | 25 | No |
| `KEY_HIGHLIGHTS_OPTIONS` | 20 | No |
| `FACILITIES_OPTIONS` | 15 | No |
| `CAMPUS_LIFE_OPTIONS` | 12 | No |
| `ABOUT_US_STAT_FIELDS` | 5 | No |

`INSTITUTE_TYPES` has five values — School, Coaching, College, University, Training Institute — and **not one of them is read by the builder.** Every institute is offered the identical 77 options. The client found `campusArea`; the same file also offers a Coaching institute *Hostel capacity*, *Auditorium seating*, *Green & Eco-Friendly Campus* and *Alumni Meet-ups*, and offers a School *Internships Facilitated* and *International Tie-ups*.

It also runs the other way — options that are **missing** because the bank was written for a college:

- Coaching: number of centres, per-centre address, batch timings, selection/result record, demo class availability
- School: board affiliation, classes offered (e.g. Nursery–12), student-teacher ratio, transport routes
- University: departments/schools, NAAC/NIRF ranking, research output, PhD programmes

There is a **second-order defect** too: `buildAboutParagraph()` (`pageBuilderContent.js:106-127`) hardcodes the college framing — it emits *"a campus spread across 25 Acres"* and calls every page "the institute". This is the text that lands in the public `About` section and, via `seo.py`, in the **meta description Google indexes**. The saitgroup screenshot in point 5 shows exactly this sentence live.

**To build:** restructure the content banks as `{ [instituteType]: options }` with a shared common core plus per-type additions, make `InstitutePageEditor.jsx:365` select by `page.type`, and make `buildAboutParagraph` type-aware. Also decide what happens to pages already saved with now-invalid stats (leave them, or hide on render).

**This is the item worth the most discussion** — the option lists themselves are a content exercise the client's own team is better placed to write than we are. Recommend we produce a first draft per type and have him edit it, rather than us guessing at Indian coaching-industry vocabulary.

---

## 5. The app header must not appear on a public Institute Page — ✅ **IMPLEMENTED**

> "Page baanne ke baad jo ye header aa raha hai apna, ye nahi dikhna chahiye varna bachee enquiry post nahi karte"
> *(after the page is created, our header shouldn't show — otherwise kids don't post an enquiry)*

He circled the Connectedus nav bar (Home / Search / Dashboard / Alerts / Me) on `lead.qulacsi.com/saitgroup`.

**Current state — confirmed.** In `frontend/src/App.jsx`, the vanity URL route sits *inside* `AppLayout`:

```jsx
<Route path="/" element={<AppLayout />}>
  ...
  <Route path=":instituteSlug" element={<InstitutePage />} />
</Route>
```

`AppLayout.jsx:226-360` renders the full signed-in product chrome — sticky header, Home/Search/Dashboard/Alerts/Me — above every child route, including the public institute page.

**The reasoning behind his complaint is sound and worth stating plainly:** the institute page is a **landing page for outsiders**, not a screen inside our product. A parent or student arriving from Google or a WhatsApp share sees our navigation, reads it as "this is somebody else's app, I need an account," and leaves without enquiring. The header competes with the enquiry CTA.

### What was built

Confirmed on 02 Sep with a second screenshot, circling the nav cluster directly: *"now after opening the institute page dont show these header items in institute page."*

`AppLayout` now renders reduced chrome on institute routes rather than the route being moved to a separate layout. That keeps **one** header definition — two would drift, and this route has already moved once for point 9.

| Element | On an institute page |
|---|---|
| Home / Search / Dashboard / Alerts / Me | **Hidden** — the circled cluster |
| Global "Search people, pages, courses…" bar | **Hidden** — see note below |
| Connectedus logo | Kept |
| Sign in / Join now (anonymous visitors) | Kept |

**What decides it:** `isInstitutePath()` in `frontend/src/utils/pageUrl.js`, which mirrors the backend's `parse_public_path` — two or three segments led by a known institute type. Deliberately not a string sniff: a false positive would strip the navigation off a real app screen, so there is a test asserting `/`, `/profile`, `/dashboard`, `/search`, `/admin/pages` and `/page/edit` are all unaffected.

**Why the brand and sign-in stayed.** The client's stated reason for the ask is conversion — *"varna bachee enquiry post nahi karte"*. The nav competes with the enquiry CTA and reads as "this is somebody else's app, I need an account". The logo does not: it is what the page is published under, and it carries the platform's SEO value. Sign in / Join now stays for the same reason — converting an anonymous visitor is the point of the page.

**Judgement call, easily reversed:** the global search bar was hidden too, though it was not in the circle. It is app chrome sitting immediately beside what was, and it is not even functional today — a `<span>`, not an input. To put it back, drop `bareHeader` from its className in `AppLayout.jsx`.

**Known trade-off:** a signed-in user viewing an institute page now has no header route to their profile or to log out. The logo returns them to the feed in one click, which is normal for a landing page, but it is a real change for admins who sit on their own page — they still have "Manage this page" on the page itself.

### Still open

- The in-page `PageHeader` still prints `connectedus.in/training-institute/herald/gwalior` above the fold, to a visitor who is by definition already at that URL. Not part of the circle, so left alone — but it is the next thing I would cut. (An admin viewing their own page sees the title "Institute Page"; a visitor sees the institute's name, so only the URL line is redundant.)

---

## 6. Enquiry sharing, and open in a new tab

> "sharing enquiry samajh aa jata hai unko" / "ye new tab hi individual open hona chahiye"

The first line reads as **approval** — the share flow is understandable to end users. No action.

The second is a request that an institute page open in a **new tab**, standalone, rather than replacing the current view. Same intent as point 5: the page should feel like a separate destination.

**To build:** `target="_blank" rel="noopener"` on links into institute pages from the feed, search and admin lists. Cheap. Should be done together with point 5, since they express one idea.

---

## 7. "Enquiry tab floating missing" — **likely a real bug, cause identified**

**Current state:** the floating button *does* exist —

```
frontend/src/pages/InstitutePage.jsx:249-257
  className="hidden md:flex fixed right-6 top-1/2 -translate-y-1/2 z-30 ..."
```

**`hidden md:flex` means it is suppressed entirely below Tailwind's `md` breakpoint (768px).** The client's browser window in the screenshot is narrow. So on a small window — and on **every phone**, which is where most parents and students will actually open a shared institute link — the primary enquiry CTA does not render at all.

There are fallback entry points (a Quick Enquiry card at `InstitutePage.jsx:650`, and per-course buttons at `:639`), so enquiry is not *impossible* on mobile — but the deliberate, always-visible CTA is desktop-only, which is backwards for this page's audience.

**To build:** give it a mobile treatment rather than hiding it — a full-width sticky bar pinned to the bottom on small screens is the standard pattern and does not fight the content. Verify `z-30` against the header's `z-40` once point 5 removes that header.

---

## 8. Course *stream* — assign 8 from a master list of 100

> "course stream kahan add karne honge jo inke me — maan lo apne pass 100 course list hain, usme se inhe 8 assign kar sake"

**What he is describing:** a **platform-owned master course catalogue**. The admin maintains ~100 canonical courses; each institute picks the handful it actually offers. This is a controlled vocabulary, not free text.

**Current state — this does not exist. Courses are free text per page.**

- `backend/models/course.py` — a `Course` row belongs to exactly one page (`page_id`, FK, CASCADE). `name` is a free string. There is no cross-page course entity.
- `Course.specializations` is a `JSON` list of free strings.
- `frontend/src/constants/taxonomy.js` has `COURSE_CATEGORIES` (7) and `COURSE_LEVELS` (5) — coarse buckets, not a course list.
- `COURSE_SPECIALIZATIONS` in `mockData.js:440-445` is four hardcoded demo entries.
- `/admin/taxonomy` (`PlatformTaxonomy.jsx`) exists but is **frontend-only** — it imports the constants module and holds edits in `useState`. Nothing persists; a refresh discards everything.

**Why he wants it, and why he is right:** today "B.Tech Computer Science", "BTech CSE" and "Computer Science Engineering" are three unrelated strings across three institutes. That makes platform-wide course search — a core promise of the product — impossible, and it is the same normalisation problem as point 1's city field.

**What needs deciding before this can be built:**
- Is the master list **strict** (institutes may only pick) or **extensible** (they may propose, admin approves)?
- Does "stream" mean a **third level** above category — e.g. Stream (Engineering) → Course (B.Tech) → Specialization (CSE) — or is it a synonym for the existing category?
- Who supplies the ~100 rows?

**Shape of the work:** a new `platform_courses` table + admin CRUD (which also finally gives `/admin/taxonomy` a real backend), and `Course.name` becoming a nullable FK to it while keeping free text for the transition. Non-trivial; a migration and a data-entry exercise.

---

## 9. URL structure — `/college/sait/indore` — ✅ **IMPLEMENTED**

> `connectedus.in/college/sait/indore`
> `connectedus.in/university/medicaps-university/indore`
> `connectedus.in/coaching/paras/bhopal`

A three-segment scheme: **`/{type}/{name}/{city}`**.

**Current state:** one segment. `/saitgroup`.

**Everything this touches:**

| Layer | Today | Change |
|---|---|---|
| React route | `App.jsx` — `<Route path=":instituteSlug">` | three params |
| Slug generation | `pages.py:56-77` — `slugify(name)`, uniqueness on `Page.slug` alone | uniqueness becomes (type, name, city) |
| Public lookup | `pages.py:202` — `GET /pages/slug/{slug}` | resolve on three parts |
| SEO renderer | `seo.py:427` — `is_vanity_url = bool(slug) and "/" not in slug` | **explicitly single-segment; must be rewritten** |
| Sitemap | `seo.py:161` — emits `{base}/{page.slug}` | emit the full path |
| Reserved names | `seo.py:47-59` — `NOINDEX_PREFIXES` doubles as the known-app-route list | see below |

**Two genuine benefits, worth telling him:**

1. **It removes a real fragility.** Today any single-segment path that is not in `NOINDEX_PREFIXES` is assumed to be an institute slug — on both the client and the server. That list is maintained *by hand* in two places, and the comment at `seo.py:44-46` admits the risk: adding a route to `App.jsx` without updating it makes that route 404. Namespacing pages under `/college/…`, `/coaching/…` etc. **eliminates the collision class entirely.**
2. **The city in the URL is good SEO** for exactly the searches this product needs to win — "coaching in indore", "college in bhopal".

**The costs, equally worth telling him:**

- **Every existing page URL changes.** Anything already shared — including the `saitgroup` link in this very thread — breaks unless we keep the old single-segment URL as a permanent 301 redirect. We should; it is not much work, and losing URLs already given to institutes would be worse.
- **The city becomes part of a page's permanent identity.** An institute that relocates, or was entered with a typo'd city, changes its URL. This makes point 1 (city as a controlled dropdown) a **hard prerequisite**, not a nicety — free-text cities would produce `/college/sait/indore` and `/college/sait/Indore` as distinct pages.
- Multi-branch institutes — which point 4 says we need to support for coaching — do not have *one* city. Needs a rule: the head-office city, presumably.

**Recommendation at the time:** do point 1 first, then 9 and 5 together in a single routing pass.

### What was built

Point 1 shipped first, as recommended. Point 9 then followed on its own; point 5 (removing the app header from public pages) is still open and will move this route again.

**The path is derived, never stored.** `Page.slug` still holds only the *name* segment; type and city come from `Page.type` and `Page.city` at render time (`backend/core/urls.py`). Storing the whole path would let a page that changes city keep a URL contradicting its own record — instead, moving an institute moves its URL, which there is a test for.

| Layer | Change |
|---|---|
| `backend/core/urls.py` | **New.** `page_public_path`, `parse_public_path`, `TYPE_SEGMENTS`, and the shared `slugify` (moved out of `routers/pages.py`). One definition, used by the API and the HTML renderer alike. |
| `PageResponse.public_path` | Computed field, so every client links to the URL the server resolves. No duplicated rules in the browser. |
| `GET /pages/resolve?path=…` | Resolves a canonical path. `GET /pages/slug/{slug}` stays, serving only the old-link redirect. |
| `_unique_slug` | Uniqueness scoped to (type, city) — see below. |
| `routers/seo.py` | Canonical tags, JSON-LD, sitemap and feed links all emit the new path; institute URLs are recognised by their type segment. |
| Migration `0005` | Drops the global `UNIQUE` on `pages.slug`, adds `uq_page_type_slug_city`. |
| `frontend/src/utils/pageUrl.js` | **New.** `pagePath` / `pageDisplayUrl`, used by all 8 link sites. |

### The nicest consequence: fewer ugly slugs

Uniqueness used to be global, so the second "Excel Coaching" anywhere in India became `excel-2`. Scoped to type and city, two Excel Coachings in Indore and Bhopal both keep `excel` — they are already different URLs. Only a real collision (same type, same city) still gets a suffix. The admin console's "taken" warning was updated to match, so it no longer warns about clashes that will not happen.

### Old links still work

Everything already shared — including the `saitgroup` link in this thread — 301s to the new URL:

- **Server:** `legacy_slug_redirect` in `routers/seo.py`, wired into the SPA catch-all in `main.py`. This is the one search engines follow, so ranking transfers rather than restarting.
- **Client:** `LegacySlugRedirect` covers what the server cannot — an in-app link still holding an old path, and the Vite dev server, which has no redirect in front of it.

### The fragility this removed

Previously *any* single-segment path that was not in `NOINDEX_PREFIXES` was assumed to be an institute slug, on both client and server — a hand-maintained list in two places, where adding a route to `App.jsx` and forgetting the list made that route 404. Institutes now live under their type, so `parse_public_path` decides, and a new app route cannot collide with an institute. There is a test asserting `/profile`, `/dashboard` and `/admin/pages` are never resolved as institutes.

### Verification

31 backend tests (7 new) and 22 frontend tests (13 new) pass; build and lint clean. Verified end to end against a running app — the three URLs the client wrote are produced exactly, the sitemap emits them, `/coaching/paras/indore` correctly 404s while `/coaching/paras/bhopal` resolves, and `/sait` redirects to `/college/sait/indore`.

### Still open

- **Existing city values are still free text** on rows created before point 1. A page whose city was typed as "indore " gets `/college/x/indore` — fine — but two rows differing only in case would both claim one URL. The router's check prevents *creating* that; the DB constraint cannot see it, since it compares stored text. The one-off backfill flagged in Section 1 closes this properly. **Recommended before this goes live.**
- **Multi-branch institutes** still have to pick one city (Section 4 wants proper multi-centre support for coaching). Currently whatever is in `Page.city` — in practice the head office. Needs a rule from the client.
- A page with **no city** degrades to a two-segment `/{type}/{name}` rather than emitting an empty segment.

---

## 10. Suggested sequencing

**Batch A — do now, roughly half a day.** ~~Point 1~~ ✅ done. Points 2, 6, 7 remain. Independently useful, no decisions needed.

**Batch B.** ~~Points 5 and 9~~ ✅ both done. Old URLs 301 rather than break; institute pages no longer carry the app's navigation.

**Batch C — content restructure.** Point 4. Needs the client's team to supply per-type option lists; we draft, he edits.

**Batch D — new feature.** Point 8. Needs the three questions in that section answered before estimating.

**Blocked.** Point 3 — ask for the full screenshot.

---

## 11. Open questions — needs a decision

1. **Point 3:** what did the 11:55am message say in full?
2. **Point 2:** confirm that removing Logo/Banner from the create form deliberately reverses the 16 Aug request.
3. ~~**Point 5:** should a public institute page carry *any* Connectedus branding?~~ Built keeping the logo and Sign in / Join now, dropping the member nav and the search bar. Confirm the search bar should stay gone.
4. ~~**Point 9:** keep old single-segment URLs as permanent redirects?~~ Built as 301s. **Still open:** which city for a multi-branch institute?
5. **Point 8:** master course list — strict or admin-approved? Is "stream" a new level above category? Who writes the ~100 rows?
6. **Point 4:** can his team supply the per-type option lists, working from a draft we provide?
7. **Point 1 (follow-up):** normalise the existing free-text city/state rows in a one-off backfill? Recommend yes, before point 9 makes the city part of every URL.

---

## Appendix — files this feedback lands in

| Point | Files |
|---|---|
| 1 | ✅ `data/indiaGeo.json`, `data/indiaGeo.js`, `components/ui/StateCitySelect.jsx`, `scripts/build-india-geo.mjs`; wired into `pages/admin/ManagePages.jsx` + `components/InstituteFullDetailsModal.jsx` |
| 2 | `ManagePages.jsx:397-442`, `CreateInstitutePage.jsx:132-170` |
| 4 | `frontend/src/pages/pageBuilderContent.js`, `pages/InstitutePageEditor.jsx:365`, `pages/InstitutePage.jsx` |
| 5 | ✅ `frontend/src/layouts/AppLayout.jsx`, `utils/pageUrl.js` (`isInstitutePath`) |
| 6 | `frontend/src/App.jsx`, feed/search/admin link sites |
| 7 | `frontend/src/pages/InstitutePage.jsx:249-257` |
| 8 | new `backend/models/platform_course.py` + migration, `models/course.py`, `constants/taxonomy.js`, `pages/admin/PlatformTaxonomy.jsx`, `pages/institute/ManageCourses.jsx` |
| 9 | ✅ `backend/core/urls.py`, `alembic/versions/0005_scoped_page_slug.py`, `routers/pages.py`, `routers/seo.py`, `main.py`, `models/page.py`; `frontend/src/utils/pageUrl.js`, `pages/LegacySlugRedirect.jsx`, `App.jsx` + 8 link sites |


---

## 12. Follow-up instruction, 02 Sep 2026 — merge the two institute screens, and un-modal the details editor — ✅ **IMPLEMENTED**

> "in platform admin remove the separate institute and keep the top institute only, combine it. There only institute should be created. And the eye button for extra info — change it to a separate page for adding extra info instead of a modal."

### What the admin sidebar looked like

Two unrelated screens both called "institute", in different nav groups:

| Screen | Managed | Backed by |
|---|---|---|
| **Platform › Institute Pages** (`/admin/pages`) | The public institute — slug, content, courses, admins | `pages` table |
| **Accounts › Institutes** (`/admin/institutes`) | An institute *login account* | legacy `institutes` + `users` |

Two records, two screens, one word. The client is right that it reads as duplication.

### The blocker that had to be solved first

Deleting the Accounts screen would have broken institute creation outright. Both `POST /pages` and `POST /pages/{id}/admins` **required the admin's user account to already exist**, rejecting anything else with *"No user account exists … Create the account first."* — pointing at the very screen being removed. The console could have created a page nobody could ever log in to and manage.

So `backend/routers/pages.py` gained `_resolve_or_create_admin()`, used by both endpoints:

- **email already has an account** → linked as-is. Its name and password are *never* rewritten from a page form — otherwise a typo'd email in the create dialog would be account takeover. There is a regression test for exactly this.
- **no account** → the login is minted, which requires a password. A passwordless account is not created silently; the request fails with a message saying what is missing.

The new user's role is `PROFESSIONAL`, not the legacy `INSTITUTE` role — administering a page is a row in `page_admins`, not a role. Consistent with `docs/EDUCATION_NETWORK_ROADMAP.md` §2.2.

### Changes

**Merged the screens**
- `AdminLayout.jsx` — Accounts › Institutes removed. That group is now Students + Mentors.
- `App.jsx` — `/admin/institutes` redirects to `/admin/pages`, so existing links and bookmarks still land somewhere real.
- `ManageInstitutes.jsx` deleted, with its three now-dead API helpers (`registerInstitute`, `fetchAdminInstitutes`, `updateAdminInstitute`).
- The create dialog now takes an **admin name and temporary password** alongside the email, revealed once an email is entered. Same fields on Manage Admins, so an existing page can also have a login created for it.
- `DataContext` now loads **pages** where it used to load legacy institute accounts, so the Dashboard's "Registered Institutes" count and its card link point at the same records the Institute Pages screen manages.

**Eye button → its own route**
- New `/admin/pages/:pageId` (`pages/admin/InstituteDetails.jsx`). It owns the loading, error and not-found states and hands the editor a record it can trust.
- `InstituteFullDetailsModal` gained `variant="page"`: identical body, different shell — a `<Modal>` overlay or plain in-flow content. Built as an element rather than a wrapper component, because a component defined inline would be a new type each render and would remount the form on every keystroke. In page mode the header's × becomes a Back arrow.
- The Institute Console (`InstitutePageEditor`) still opens it as a modal; only the admin path changed.

A seven-tab editor with a live preview was more than a 90vw overlay should carry — and a modal has no URL, so an admin could not link to, reload, or use Back on an institute mid-edit.

### Verification

24 backend tests pass, including three new ones: a new admin login is minted and can actually log in and see its page; a new email with no password is rejected; an existing account is linked without its name or password being overwritten. Frontend: 13 tests pass, build clean, no new lint warnings.

### Worth knowing

- **Legacy institute account rows are no longer visible in the admin UI.** They still exist and those users can still log in — only the management screen is gone, as instructed. `GET /admin/institutes` is still there if we ever need to inspect them. If any of those accounts matter, they should be migrated onto pages before this ships. **Worth confirming with the client.**
- The temporary password is typed by the admin and shown in clear text in the form, so they can pass it on. There is no "email the new admin their password" step — the platform has no outbound email. Worth raising if the client expects one.
