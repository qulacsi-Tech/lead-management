# SEO / Public Surface Plan — 23 Aug 2026

Client requirement: the product should be **SEO friendly**, in a LinkedIn-style
shape — anonymous visitors can browse the feed and public pages, while profile
and member features unlock after login, with a login reminder popup appearing
on a timer.

This document records what we found, what was decided, and what to build. Work
starts 24 Aug 2026.

---

## TL;DR

1. **SSR was not the blocker.** Nothing on the site was indexable, for reasons
   that had nothing to do with rendering strategy. Those are now fixed.
2. **Do not migrate to Next.js.** Do not adopt an SSR framework yet either.
   With only one public page type it is not justified — see
   [Rendering strategy](#rendering-strategy).
3. **Steps 1–3 are implemented** — see [Implementation status](#implementation-status).
   The remaining blocker is deployment wiring, not code: nothing reaches Google
   until nginx routes public HTML through FastAPI.

---

## Findings

*As surveyed on 23 Aug 2026, before any of this was built. Kept in the past
tense as the record of why the plan is shaped the way it is — see
[Implementation status](#implementation-status) for what has since changed.*

Three things had to be true before rendering strategy mattered at all. None of
them were.

### 1. Nothing is publicly reachable

The institute vanity URL `/:instituteSlug` is declared inside `AppLayout`,
which gates every child route:

```jsx
// frontend/src/layouts/AppLayout.jsx
if (initializing) return null;
if (!auth) return <Navigate to="/" replace />;
```

A crawler (or any logged-out visitor) hitting `connectedus.in/bright-future-coaching`
is redirected to the login page. **Current indexable surface: zero URLs.**

### 2. The public page renders fixture data

`frontend/src/pages/InstitutePage.jsx` reads `findPageBySlug` from
`pages/mockData.js`. The backend already has the correct public endpoint —
`GET /pages/slug/{slug}`, which uses `get_optional_user` and works anonymously
— and it is unused.

### 3. There is no per-page metadata

`frontend/index.html` carries a single static `<title>Next Move</title>`. No
meta description, no canonical, no Open Graph or Twitter tags, no JSON-LD. No
`robots.txt`, no `sitemap.xml`.

Side note: the title says "Next Move" while the product is branded
"Connectedus". Worth settling as part of this work.

### 4. There are almost no addressable pages to rank

Every feed CTA points at a listing or a generic screen, never at the item
itself:

```js
// frontend/src/pages/mockData.js
ctaLabel: 'View Vacancy', ctaTo: '/zenith-training-institute'
ctaLabel: 'View Notice',  ctaTo: '/horizon-public-school'
```

The backend matches: `@public_router.get("")` on opportunities returns a list
only. There is no public `GET /opportunities/{id}`.

LinkedIn's SEO comes from millions of individually addressable pages
(`/jobs/view/{id}`, `/company/{name}`), not from its feed. A feed is a *crawl
hub*, not a ranking page — it is aggregated and constantly changing, so it
ranks for nothing on its own.

### 5. There is no Post entity at all

Checked `backend/models/` and `backend/routers/`: no model, no table, no
endpoints. The whole feed — posts, the 86 likes, the 19 comments, the
notification toasts — is `mockData.js` fixtures rendered client-side.

---

## Decisions taken

| Question | Decision | Consequence |
|---|---|---|
| Public URLs for vacancies & notices? | **No, for now** | Forfeits the Google Jobs channel. Data already exists, so adding them later is additive, not a rewrite |
| Are member posts public? | **Yes** | But posts do not exist yet — this is a build, not an exposure. See [Posts](#4-posts-feature-separate-track) |
| Node process on EC2? | **Unknown, willing to try** | Not needed for steps 1–2; only matters if we later adopt SSR |

### What "no vacancy/notice URLs" costs

Institute pages alone will rank for brand-name searches ("Bright Future
Coaching Indore") and little else. Intent-driven searches — "physics faculty
job Indore", "JEE crash course admission" — have no URL to land on. Expect
modest organic traffic until this is revisited.

---

## Rendering strategy

The recommendation moved twice as scope became clear. Recording the reasoning
so it is not re-litigated:

| Assumed scope | Recommendation | Why |
|---|---|---|
| One public page type | Server-injected `<head>` + JSON-LD | A framework is not justified |
| Feed + 4 addressable entity types | React Router 7 framework mode | Head injection does not scale to thousands of rows across 4 types |
| **Final: one public page type** | **Server-injected `<head>` + JSON-LD** | Vacancy/notice URLs were dropped, so the justification went with them |

**Do not migrate to Next.js.** It would mean porting ~30 authenticated screens
that gain nothing from SSR, running a second frontend, and taking on the auth
migration below — for no benefit at the current scope.

### The constraint that decides this

**The JWT lives in `localStorage`.** A server renderer cannot read it. SSR'ing
any *authenticated* screen therefore requires first migrating auth to httpOnly
cookies: `core/security.py`, login/logout, token revocation, CORS credentials,
and CSRF protection. That is a security-model migration in its own right.

Public pages need no auth and dodge this entirely. Hence: **if we ever SSR,
SSR only the public surface.** Never the admin portal or institute console.

When the time comes, the preferred route is **React Router 7 framework mode** —
already on `react-router-dom@7.18`, so it is the same router, giving SSR,
per-route `loader` and a `meta` export without a rewrite, with authenticated
routes opting out per-route and keeping the current token model.

### What to SSR, if/when we do

| Surface | SSR? | Reason |
|---|---|---|
| Institute page `/:slug` | Yes | The one page a stranger arrives at from Google |
| Public feed | For first paint, not for SEO | Crawl hub; ranks for nothing itself |
| Vacancy / notice / course detail | Yes — **once they exist** | Real search intent; JSON-LD rich results |
| Profile, dashboard, purchased, search | No — `noindex` | Login-gated or thin/duplicate content |
| `/admin/*`, `/institute/*` | No — `noindex` + `Disallow` | Zero benefit |

Rule of thumb: **SSR where a stranger arrives from Google. Not where a member
browses.**

---

## Sequence

### 1. Make institute pages genuinely public — *prerequisite for everything*

- Move `/:instituteSlug` out of the auth-gated `AppLayout` into a public
  layout. Keep static routes (`feed`, `profile`, `search`, …) ranked above the
  dynamic one — react-router already does this, do not regress it.
- Rewire `InstitutePage.jsx` from `mockData` to the real endpoints:
  - `GET /pages/slug/{slug}` (public, returns 404 for disabled pages unless
    you administer them — already correct)
  - `GET /pages/{id}/courses` (public, published only)
  - `GET /pages/{id}/opportunities` (public, published only)
- Keep the enquiry form working anonymously — `POST /pages/{id}/enquiries`
  is already public.
- Verify a logged-out browser can load an institute page end to end.

### 2. SEO fundamentals — no SSR, no new infrastructure

- FastAPI serves `index.html` for public routes through a template that
  injects, per page: `<title>`, `meta description`, `canonical`, Open Graph and
  Twitter tags, and `EducationalOrganization` JSON-LD built from the DB row.
- `robots.txt`; `sitemap.xml` generated from the DB, using `Page.updated_at`
  for `lastmod`.
- `noindex` on `/admin`, `/institute`, `/feed`, `/profile`, `/dashboard`,
  `/purchased`, `/search`.
- Settle the `Next Move` vs `Connectedus` title.

**Backend work needed for step 2:**

- Public page-list endpoint for the sitemap — today's `GET /pages` is
  `require_main_admin`, so add a public, minimal, `is_enabled`-only variant.
- Absolute media URLs for `og:image` — `logo_url` / `banners` are stored
  relative.
- Canonical public base URL in settings.

### 3. Public guest feed + login-reminder popup

Product value now; **no SEO value until step 4**, since the feed will still be
showing mock posts.

Three rules the auth wall must follow:

1. **Never serve crawlers different content than users.** That is cloaking and
   is the one thing here that risks a manual penalty. Googlebot will not sit
   for 2 minutes, so it simply never triggers the timer — that is legitimate.
   User-agent sniffing to serve Googlebot more is not.
2. **Content must be in the DOM, not fetched after dismissal.** If a post body
   only loads once the modal is closed, crawlers get an empty page.
3. **Delayed and dismissible** — as designed. Google's intrusive-interstitial
   signal targets interstitials on *immediate* load, so a modal after real
   engagement is not the target.

Also: cap the escalation. Re-prompting every 2 minutes indefinitely will cost
more in engagement than it converts. LinkedIn walls after a number of page
views, not on a repeating timer.

### 4. Posts feature — separate track

**This is a build, not an exposure** (see finding 5). Scope:

- Post model, migration, create / list / detail endpoints, cursor pagination
- Likes and comments — the UI already displays counts, so they are expected
- Per-post visibility: public vs members-only
- **Moderation before anything is indexable**: report flow, takedown, admin
  review queue, rate limits. Public + indexed + user-generated means spam and
  abuse become Google-visible.
- **Consent**: members must know their posts are publicly indexable. Worth
  getting right up front under India's DPDP Act 2023 — retrofitting consent
  onto already-published content is painful.

Recommendation: **default posts to members-only, with public as opt-in.** The
reverse is very hard to walk back once Google has cached it.

Do not block steps 1–2 on this track.

### 5. Revisit SSR

Once there is volume worth rendering, measure Search Console coverage and
decide. Reopen the vacancy/notice URL question at the same time — that is where
the traffic is.

---

## Deferred, with reasons

| Item | Why deferred |
|---|---|
| Vacancy / notice public URLs + `JobPosting` JSON-LD | Client decision, "no for now". Biggest single traffic opportunity when revisited |
| Next.js migration | ~30 authenticated screens gain nothing; forces the cookie migration |
| SSR framework | Not justified at one public page type |
| Cookie-based auth | Only needed to SSR authenticated screens, which we are not doing |

---

## Open questions

1. What is actually running on the EC2 box? `deploy.sh` lives at
   `/opt/lead-management/deploy.sh` on the server, not in the repo, so how the
   frontend is served is unknown. To check:
   ```
   systemctl status lead-backend
   cat /opt/lead-management/deploy.sh
   nginx -T | head -50
   node --version
   ```
2. Real production domain — canonical URLs and the sitemap need the actual
   host, and indexing takes weeks, so this is worth settling early.
3. Should `tagline` / `about` get length caps so meta descriptions produce clean
   snippets? Both are optional free text today.
4. Are courses a search target in their own right? If so they need public
   detail URLs and `Course` JSON-LD.

---

## Implementation status

### Step 1 — institute pages genuinely public ✅

- `frontend/src/layouts/PublicLayout.jsx` (new) — guest-aware shell with no
  auth redirect. Header adapts: member nav when signed in, Sign in / Join now
  when not.
- `frontend/src/App.jsx` — `/:instituteSlug` moved out of `AppLayout` into
  `PublicLayout`. `/page` became `MyPageRedirect` (forwards to the page you
  administer, or to `/create-page`), so `InstitutePage` is purely slug-driven.
- `frontend/src/pages/InstitutePage.jsx` — rewired from `mockData` to
  `GET /pages/slug/{slug}` + page-scoped courses and opportunities. Ownership
  now comes from `is_page_admin` on the response, resolved server side.
- Enquiries go to `POST /pages/{id}/enquiries` and work anonymously.

Verified anonymously (no `Authorization` header): page loads; `is_page_admin`
false and `admins` empty for a stranger; Draft courses and Draft opportunities
hidden; enquiry accepted (201, `user_id` null); a disabled page 404s for the
public but still resolves for its admins.

**Two fake flows removed** from the enquiry modal, deliberately: the "Existing
User" tab matched a hardcoded phone number against a fixture, and "Send OTP"
accepted any value. Neither has a backend. A verification step that verifies
nothing is worse than none on a public lead-capture form. Real OTP needs an SMS
provider — treat as its own task.

### Step 2 — SEO fundamentals ✅

`backend/routers/seo.py` (new):

- `GET /robots.txt` — disallows private prefixes, points at the sitemap. Emits
  `Disallow: /x$` **and** `Disallow: /x/` per prefix; a bare `Disallow: /page`
  would also block any institute whose slug merely starts with "page", since
  robots.txt matching is prefix-based.
- `GET /sitemap.xml` — every `is_enabled` page, `lastmod` from `updated_at`.
- SPA shell with per-URL `<head>`: title, description (trimmed to 160 chars on
  a word boundary), canonical, Open Graph, Twitter card, and
  `EducationalOrganization` JSON-LD. `noindex` on private prefixes.
- Unknown vanity slugs return **HTTP 404**, not 200 — a soft 404 is a quality
  signal Google acts on.

`backend/core/config.py` — `PUBLIC_BASE_URL`, `FRONTEND_DIST`,
`SEO_INDEXING_ENABLED`. `backend/main.py` mounts the SEO router and, when
`FRONTEND_DIST` is set, serves build assets plus a catch-all that never shadows
`/api` or `/uploads`.

Not cloaking: every visitor and crawler gets byte-identical HTML for a URL.
Nothing branches on User-Agent.

Verified: institute URL returns real title/description/canonical/OG/JSON-LD;
`/admin`, `/feed`, `/profile` return `noindex, nofollow`; `/api/*` still 404s as
JSON; hashed assets and `favicon.svg` serve from disk; unknown slug returns 404.

---

## Deployment — required before this works in production

**Step 2 does nothing until nginx routes public HTML through FastAPI.** If nginx
serves `frontend/dist` directly, it will keep returning the static
`index.html` with its single `<title>Next Move</title>` and none of the above
applies.

Set on the server:

```
PUBLIC_BASE_URL="https://<real-domain>"        # no trailing slash
FRONTEND_DIST="/opt/lead-management/frontend/dist"
SEO_INDEXING_ENABLED=true                       # false on staging
```

Then either point nginx's `location /` at the FastAPI upstream (simplest —
FastAPI serves assets and shell itself), or keep nginx serving `/assets` and
proxy everything else. `/robots.txt` and `/sitemap.xml` must reach FastAPI
either way.

`PUBLIC_BASE_URL` is load-bearing: canonical URLs, `og:image` and every sitemap
entry are built from it, so a wrong value points search engines at the wrong
host.

### Step 2b — content in the delivered HTML ✅

Head-injection alone left `<body>` as `<div id="root"></div>`, so view-source
showed no content. `_page_body_html()` in `routers/seo.py` now writes a plain
semantic rendering of the institute — `h1`, about, details, courses,
opportunities — *inside* `#root`.

This works because React's `createRoot().render()` **replaces** the container's
children. Nothing is hydrated, so no mismatch is possible: the markup exists for
readers that never run the bundle (crawlers, view-source, JS disabled) and is
swapped out the moment the bundle boots.

Published items only — Draft courses and vacancies are excluded, verified.

Known cost: the institute page's content now exists in two places, the React
component and this Python template, and they can drift. Acceptable for one page
type. **If vacancy/notice URLs are ever added, that duplication is the point at
which real SSR (option C) stops being avoidable.**

### Step 3 — public feed, sign-in as a dialog ✅

- `/` is now the **public feed**. `/feed` redirects to it; `/login` remains a
  real page for deep links.
- `AppLayout` no longer redirects anonymous visitors. It wraps the feed, the
  institute pages and the member screens, and adapts: member nav when signed
  in, Sign in / Join now when not. `PublicLayout` was folded back into it.
- Member-only routes (`profile`, `dashboard`, `search`, `purchased`,
  `create-page`, `page`) are each wrapped in `RequireSignedIn`, which sends an
  anonymous visitor to the public feed and opens the sign-in dialog over it.
- `context/LoginPrompt.jsx` (new) — `useLoginPrompt().openLogin(reason)` opens
  sign-in over whatever the visitor was reading, so context and scroll survive.
- Feed renders anonymously: a guest rail replaces the profile card, and the
  composer prompts sign-in.

**Not yet built: the timed login-reminder popup.** The three rules in step 3
above still apply when it is.

> `NOINDEX_PREFIXES` in `routers/seo.py` doubles as the list of known app
> routes — anything not in it is treated as an institute slug and 404s. It must
> be kept in step with the route table in `frontend/src/App.jsx`. Adding
> `/login` without it made the login page 404; caught in testing.

### Step 3b — the feed reads real data ✅

The feed was entirely `mockData`: invented posts, `#JEE2026 · 3.2k posts`,
"Profile views 36 / Followers 860", a 30-second ticker fabricating new posts,
and infinite scroll cycling a fixture pool. None of it had a backend, so none
of it could be server-rendered — and it was the same fabricated data the admin
panel was cleaned of earlier.

`Feed.jsx` now renders published admission notices and vacancies from
`GET /api/opportunities`, with institutes from the new
`GET /api/pages/public`. Follow calls the real `POST`/`DELETE /follows`
instead of localStorage. Rails that could be made real were:

| Rail | Source |
|---|---|
| Admissions closing soon | real admission notices, by `end_date` |
| Who's hiring | institutes with published vacancies |
| Institute Pages to follow | `/api/pages/public`, minus pages you administer |

Removed outright: Trending in Education, Recently viewed, profile-view and
follower counts — invented numbers with nothing behind them.

`_feed_body_html()` renders `/` server-side too: the notices, then every
institute as a link. The feed ranks for nothing itself, but those outbound
links are how a crawler reaches each institute page.

**New backend endpoint:** `GET /pages/public` — enabled institutes, no auth.
The existing `GET /pages` is Main-Admin-only, so the public feed had no way to
name the institute behind a notice. Registered before `/{page_id}`, since
FastAPI matches in registration order and would otherwise read `public` as an
id.

### Step 3c — dev parity ✅

The SEO output never appeared on Vite's dev server, because Vite serves
`index.html` off disk and never reaches FastAPI's HTML route. That looked
exactly like the feature being broken, and "run a production build to check it"
is a bad answer.

`seoDevPreview` in `frontend/vite.config.js` closes the gap: for each HTML
request it asks `GET /api/seo/preview?path=…` what that URL should carry and
injects it. That endpoint calls the same `build_head_and_body()` the production
route uses, so dev and prod cannot drift. Silent no-op when the backend is
down; `VITE_API_ORIGIN` points it elsewhere.

### Step 3d — backfill: institute accounts → public pages ✅

`Manage Institutes` reads `institutes`; `/<slug>` reads `pages`. Different
entities by design (models/page.py): an `institutes` row is a *login* with no
slug, media or multi-admin support, while a `Page` is the *public entity* that
carries all of it. Accounts created before Institute Pages existed had no page,
so their vanity URL 404'd and nothing was indexable.

`backend/backfill_pages.py` creates one Page per account, assigns that account
OWNER (so its Institute Console works), and turns the `programs` string into
published Course rows. Idempotent — re-running skips accounts that already
administer a page. `--dry-run` reports without writing.

Applied to the dev database: 4 pages created, the two same-named institutes
correctly taking `…-technology` and `…-technology-2`.

Two things it cannot infer:

- **Type** defaults to `Training Institute` — the `institutes` table has no
  type column, only `Page` does. Correct per page in Admin → Institute Pages.
- **Descriptions** fall back to a generated line, because none of these
  accounts have `about` or `tagline`. Writing real copy there is the single
  highest-value SEO edit available: it is what shows in the Google snippet.

---

## Seeing it locally

**Just run the app as usual.** `npm run dev` on `:5173` with the backend on
`:8000` now shows the same `<head>` and `#root` content as production — view
source on `http://localhost:5173/<slug>`.

That works via the `seoDevPreview` plugin in `frontend/vite.config.js`. Vite
serves `index.html` off disk and never reaches FastAPI's HTML route, so without
the plugin the dev server showed a bare shell and a stale `<title>Next Move</title>`
— indistinguishable from the feature being broken. The plugin asks
`GET /api/seo/preview?path=…` what the URL should carry and injects it. That
endpoint calls the *same* `build_head_and_body()` the production HTML route
uses, so dev and prod cannot drift.

If the backend is not running the plugin silently no-ops and serves the plain
shell — dev never depends on it. Point it elsewhere with `VITE_API_ORIGIN`.

To check the real production path instead (FastAPI serving the built SPA):

```
cd frontend && npm run build
cd ../backend
FRONTEND_DIST="<abs path>/frontend/dist" PUBLIC_BASE_URL="http://localhost:8000" \
  py -m uvicorn main:app --port 8000
```

## Where this stands

Steps 1, 2, 2b, 3, 3b, 3c and 3d are done. The public surface is real: an
anonymous visitor can browse the feed and every institute page, both carry
per-URL metadata and server-rendered content, and `robots.txt` / `sitemap.xml`
are live.

**The feed will read "Nothing posted yet" until institutes publish.** The dev
database has 4 institutes, 1 course and 0 opportunities — that is accurate, not
broken. Post an admission notice or vacancy from the Institute Console
(`/institute/notices`, `/institute/jobs`) and it appears in both the app and
the page source immediately.

## Next — tomorrow

1. **Deployment wiring** (see the Deployment section above). Nothing here
   reaches production until nginx routes public HTML through FastAPI and
   `PUBLIC_BASE_URL` / `FRONTEND_DIST` are set on the box. This is the blocker
   for everything else being visible to Google, so it goes first.
2. **Real copy on the four institute pages** — `about` / `tagline`, and correct
   the type from the backfill default. Cheapest meaningful SEO win available.
3. **Timed login-reminder popup** — the three anti-cloaking rules in step 3
   still apply.
4. **Posts feature** (step 4) — a build, not an exposure, and it carries
   moderation and DPDP consent work. Keep it off the critical path.
5. Reopen the **vacancy / notice URL** decision — still the largest single
   traffic opportunity, and the point at which real SSR stops being avoidable.
