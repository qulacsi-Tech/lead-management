# Client Feedback 22 Sep 2026 — Implementation

Status: **All 8 points implemented.** Source is the tracking sheet from Avdhesh
Tiwari, dated 22-09-2026, five numbered rows covering the Create Institute
popup, page identity, course categories, the types & categories screen, and ads.

Unlike the 01 Sep round, none of these needed a decision from the client before
building — they are corrections and additions to things that already exist.
Three product choices were made in the course of the work and are called out in
[Section 7](#7-choices-made-that-the-client-should-confirm).

---

## 0. TL;DR

| # | Point | Kind | Where |
|---|---|---|---|
| 1 | Remove Logo / Header Banner from the Create Institute popup | Deletion | [§1](#1-logo--header-banner-removed-from-the-create-popup) |
| 2 | State logo/image size & dimensions; **not visible on live page** | Copy **+ a real bug** | [§2](#2-image-sizes-stated--and-the-bug-behind-not-visible-on-live-page) |
| 3 | Course category & subcategory at creation → landing page → enquiry form | New field, three surfaces | [§3](#3-course-categories-at-creation-on-the-page-and-in-the-enquiry-form) |
| 4 | Course categories structured per institute type, like Affiliation | Taxonomy restructure | [§4](#4-course-categories-per-institute-type) |
| 5a | Ad title — one line, predecided | Free text → closed list | [§5](#5-predecided-ad-title-and-description) |
| 5b | Ad description — three lines, predecided | Free text → closed list | [§5](#5-predecided-ad-title-and-description) |
| 5c | Apply must not redirect; a new user creates their profile there | **New feature + backend** | [§6](#6-apply-without-leaving-the-page) |
| 5d | Notice / vacancy / guess paper as separate tabs on the landing page | Layout | [§7](#7-three-tabs-on-the-landing-page) |

**The one that was more than it looked:** point 2. "Not visible on live page" was
not a copy request — uploading a logo in the editor was actively *destroying*
the upload it had just made. See [§2](#2-image-sizes-stated--and-the-bug-behind-not-visible-on-live-page).

**The largest piece of new work:** point 5c. There was no Apply button anywhere
in the product — `apply_url` was printed as plain text. It is now a real flow
with its own table, endpoints, dialog and institute-side inbox.

---

## 1. Logo & Header Banner removed from the Create popup

> "The pop up window opens there are two options 'Logo Header Banner' & Images
> we nee to remove from here only while editing we will still have to access to
> these options inside the editor"

**Where:** `frontend/src/pages/admin/ManagePages.jsx`, the Create Institute modal.

Removed: the Logo field, the Header Banner Images field, their file inputs and
handlers, the `logoFile` / `logoPreview` / `banners` form keys, and the two
`uploadPageMedia` calls that followed page creation.

Kept, untouched, in `frontend/src/pages/InstitutePageEditor.jsx` (Main tab) —
which is what "while editing we will still have to access to these options
inside the editor" asks for. Both were already there.

The modal's blurb now says where they went, so their absence does not read as a
feature having been lost:

> "It goes live immediately at its own URL. The logo, header banners and deeper
> content (Why Choose Us, Achievements, etc.) are set by the Institute Admin in
> the page editor."

This was also point #2 of the 01 Sep round, which had been left open.

---

## 2. Image sizes stated — and the bug behind "not visible on live page"

> "Kindly Mention Logo/ images Size & Diemnsions & Not visible on live page"

Two requests in one line. The second was the serious one.

### 2a. Sizes and dimensions

*Revised 22 Sep after client review: "size & dimension nowhere we are showing.
on click there should be modal and all info should be there." The first pass
only touched the Institute Console's editor — the screen the client was looking
at is the **Platform Admin's** institute editor
(`components/InstituteFullDetailsModal.jsx`), which is a separate component and
was untouched. It now has all of this, as do the other two upload surfaces.*

`frontend/src/constants/mediaSpecs.js` is the single source for all three:

| | Dimensions | Aspect | Max size | Min edge | Formats |
|---|---|---|---|---|---|
| Logo | 512 × 512 px | Square (1:1) | 1 MB | 200 px | JPG, PNG, SVG, WebP |
| Header banner | 1600 × 500 px | Wide (16:5) | 2 MB | 800 px | JPG, PNG, WebP |
| Gallery photo | 1200 × 800 px | Landscape (3:2) | 2 MB | 600 px | JPG, PNG, WebP |

Surfaced three ways:

1. **In every field label** — "Logo Image — 512 × 512 px, max 1MB".
2. **In a dialog**, opened from an "ⓘ Size & dimensions" link beside each
   upload field (`components/ui/ImageSpecHelp.jsx`). It lists all three types,
   not just the one clicked — someone checking the logo size is usually about
   to upload a banner too — with dimensions, aspect ratio, size limit, accepted
   formats, where the image appears on the page, and a practical tip. The type
   that was clicked is highlighted.
3. **Enforced on selection** — the file's real pixel dimensions are read before
   upload, and an oversized or too-small image is refused with a message naming
   the actual numbers. A recommendation nobody checks is how a 9 MB phone photo
   becomes a banner.

Present on all four upload surfaces:

| Screen | Component |
|---|---|
| Platform Admin → institute editor | `components/InstituteFullDetailsModal.jsx` |
| Institute Console → Profile & Branding | `pages/InstitutePageEditor.jsx` |
| Create Institute Page (user flow) | `pages/CreateInstitutePage.jsx` |
| Admin → Create Institute popup | n/a — logo/banner removed, see §1 |

### 2b. The bug

Three defects, all in the page editor, which together meant an uploaded logo
never survived:

1. **`POST /pages/{id}/media` returns the updated `Page`, not `{ url }`.** All
   three upload handlers tested `uploaded?.url` — always `undefined` — and fell
   through to `URL.createObjectURL(file)`. That put a `blob:` URL into state,
   and "Save Changes" then wrote that blob URL into the database, **overwriting
   the perfectly good `/uploads/...` path the upload had just stored**. A blob
   URL dies with the browser tab, so the logo and banners were invisible on the
   live page from that moment on.
2. **The editor read `page.logoUrl` and `page.socialLinks`.** `PageResponse` is
   snake_case — `logo_url`, `social_links`. So an institute that already had a
   logo and social links opened the editor with both blank, and could wipe them
   by saving any unrelated tab.
3. **Previews rendered raw relative paths.** `/uploads/...` does not resolve
   when the frontend and backend are on different origins; every preview now
   goes through `resolveAssetUrl`.

The local-preview fallback is gone on purpose. If an upload fails, the honest
outcome is a visible error — not a picture that looks saved and is not.

**The same three defects existed in the Platform Admin's editor**
(`InstituteFullDetailsModal.jsx`) — it is a second copy of the same screen and
had the identical `uploaded?.url` bug, saving a blob URL over the real upload at
its line 562. Fixed there too, on the second pass. Anyone uploading a logo from
`/admin/pages/:id` was hitting exactly the bug the client reported.

---

## 3. Course categories at creation, on the page, and in the enquiry form

> "While Creating the institue page there are not option to main course
> catergory & Subcatgories so that they are displayed on the institute's
> landing page as well also thes categories should apear in the enquiry form so
> when a student submits enqyiry the can see and select the relevant courses"

Three surfaces, one new field.

**Storage.** `pages.course_categories` (JSON), added in Alembic revision
`0008_course_categories_and_applications.py`:

```json
[{"category": "Medical Entrance", "subcategories": ["NEET UG", "NEET PG"]}]
```

This is deliberately *not* the `courses` table. A `Course` is a specific
programme with fees, duration and intake that the institute maintains over time.
This is the declaration of what the institute broadly teaches, and it exists
from the moment the page is created — which is the whole point, because the
landing page and the enquiry form both needed something to show before any
course record exists.

**Creation.** `components/ui/CourseCategorySelect.jsx` — categories as
checkboxes, subcategories as chips under each, collapsed by default. In the
Create Institute modal and, so an institute can correct its own, in the page
editor's Main tab.

**Landing page.** A "Courses We Offer" card above the course catalogue, each
category with an Enquire link beside it.

**Enquiry form.** Category → Sub Category selects, offered *first*. The form
previously had one required field — a Course dropdown populated from the
`courses` table — so **an institute that had not built its catalogue presented
an enquiry form that could not be submitted.** The specific-course dropdown is
now optional and only shown when there are courses to show.

The chosen values are stored on the enquiry (`page_enquiries.course_category`,
`.course_subcategory`) and shown in the institute's enquiry detail view.

---

## 4. Course categories per institute type

> "Just like you created separate sections for 'Affilation & accreditation'
> under types and catergories for scholl & colleges Please create a similar
> structure for courses as well there should be separate course categories and
> sub categories for school. college & Uniesities"

`COURSE_CATEGORIES` was a flat list of seven strings with no subcategories and
no type scoping — the same class of problem as point #4 of the 01 Sep round.

`frontend/src/constants/taxonomy.js` now has `COURSE_CATEGORIES_BY_TYPE`, keyed
by institute type exactly as `AFFILIATION_OPTIONS` is, each type mapping
category → subcategories:

| Type | Categories | Example subcategories |
|---|---|---|
| School | 5 | Pre-Primary → Playgroup, Nursery, LKG, UKG |
| Coaching | 7 | Medical Entrance → NEET UG, NEET PG, AIIMS / JIPMER |
| College | 7 | Engineering & Technology → B.Tech, M.Tech, B.Arch, BCA, MCA |
| University | 9 | Doctoral & Research → Ph.D, M.Phil, Post-Doctoral |
| Training Institute | 6 | IT & Software → Full Stack, Data Science & AI, DevOps |

The flat `COURSE_CATEGORIES` still exists but is now *derived* from that map, so
the course catalogue screen keeps working and the two can never drift apart.

`helpers`: `courseCategoriesFor(type)` and `courseSubcategoriesFor(type,
category)`.

---

## 5. Predecided ad title and description

> "Ad Notice titile - in One Line (Select Any One) should be predecided"
> "Ad description - 3 Line (Select Any One) - should be predecided"

`frontend/src/constants/adTemplates.js` holds `AD_TITLE_OPTIONS` (8 one-liners
per section) and `AD_DESCRIPTION_OPTIONS` (6 three-line bodies per section),
keyed `admission | job | paper`.

Both fields are now a `<select>` over a **closed list with no free-text escape**
— the uniformity is the requirement, not a side effect. `{name}` in a
description is filled with the institute's name at the moment of selection, so
what is stored is exactly what the public page will show and no existing post
changes meaning.

Rendered by one shared component, `components/ui/AdCopyFields.jsx`, used by both
the Platform Admin's editor (`AdsTab.jsx`) and the Institute Console
(`ManageOpportunities.jsx`), so the two cannot offer different lists.

Consequences worth noting:

- The free-text "Notice Title" and "Job Title" fields are gone. `Position` and
  `Subject` (vacancy) and `Session` (notice) remain as structured fields.
- Three-line descriptions render with `whitespace-pre-line` on the public page,
  otherwise they collapsed into one run-on paragraph.

**The wording in these lists is a first draft for the client to review.** The
mechanism is done; swapping the copy is a one-file edit.

### Follow-up, 24 Sep 2026 — descriptions made customisable

> "Ads Hiring description … multi select check box format, max 3 can be selected"
> "make Ad Description customizable as per requirement, make those editable or add custom format"

> "each option item for desc should be single line not 3lines"

- `AD_DESCRIPTION_OPTIONS` moved out of the frontend into the
  `ad_description_templates` table (alembic `0009`). **Each template is one
  line** — the 18 three-line texts were split into 18 one-line options per ad
  type. API: `GET/POST /api/ad-templates/descriptions`,
  `PATCH/DELETE /api/ad-templates/descriptions/{id}` — any signed-in user reads,
  Main Admin only writes. Tests: `backend/tests/test_ad_templates.py`.
- Platform Admin → **Ad Descriptions** (`/admin/ad-descriptions`) adds, edits,
  reorders and deletes them per ad type.
- The description field is now a checklist of one-line options: tick up to 3
  (all ad types), which become the ad's 3-line description. A ticked line can
  be **Customised** for that ad, or the institute can **write its own line**;
  each counts towards the 3. Lines are stored in the one `description` column,
  newline-separated.
- Ads still store the filled-in text, so editing or deleting a template never
  changes a published ad.

---

## 6. Apply without leaving the page

> "Apply Details - When the user clicks on 'Apply' we should not redirect them
> to any other page our task is to ensure that if the user is new they should
> be able to create their profile here itself"

**There was no Apply button.** `apply_url` was rendered as plain text on the
public page — not even a link. So this is new work, not a fix.

### Backend

New table `opportunity_applications` (revision 0008) and
`backend/models/application.py`. Its own table rather than a flag on
`page_enquiries`: an enquiry is an open-ended question, an application is
addressed to one specific post and carries the applicant's qualification,
experience and resume. They have different status vocabularies and different
inboxes.

`backend/routers/applications.py`:

| Endpoint | Who | What |
|---|---|---|
| `POST /opportunities/{id}/applications` | anyone | Apply. Creates the account inline when there is none. |
| `GET /opportunities/{id}/applications/mine` | anyone | Already applied? Drives the "Applied" button state. |
| `GET /pages/{id}/applications` | page admins | The institute's inbox |
| `PATCH /pages/{id}/applications/{id}` | page admins | Status + internal note |

Three cases, in order:

- **signed in** → apply as that user, one click, no fields to retype
- **new email + password** → profile created, application filed, **access token
  returned** so the browser signs them in where they stand
- **existing email, not signed in** → `409`, and the dialog offers sign-in. This
  one cannot be handled inline: applying as an existing account without its
  password would be impersonation.

The new account's role is derived from the ad — an applicant to a vacancy is a
Professional, to an admission notice a Student — so the inline form never has to
ask.

### Frontend

`components/ApplyModal.jsx`. No link to `/signup` and no navigation of any kind.
An Apply button on every notice and vacancy card, showing "Applied" for posts
already applied to.

`apply_url` survives as a small secondary link ("Institute's own application
page") for institutes that must route off-platform, and the Institute Console
now labels that field "External application link (optional) — leave blank,
applicants apply on your page".

### Institute side

Applications had to be actionable, not just recorded, so:
`pages/institute/InstituteApplications.jsx` at `/institute/applications`, with
status tabs (New / Shortlisted / Contacted / Rejected / Closed), search, a
detail dialog with an internal note, and one-click Shortlist and Contacted.
Added to the console nav under Leads, beside Enquiries. Page admins get a
notification when an application arrives.

### Tests

`backend/tests/test_applications.py`, 8 tests. The three that matter most:
applying really does return a working session without a redirect; an existing
email **cannot** be applied-as anonymously; and applications stay inside the
institute they were sent to.

---

## 7. Three tabs on the landing page

> "How will these options ( Ad notice / vacancy / guss papper) to be displayed
> on the landing page ? in my opinion you should create separate tabs on the
> same landing page"

Before: one "Opportunities" card mixing admission notices and vacancies, with a
separate "Guess Papers & Study Material" card stacked below it. A student
looking for a guess paper scrolled past every job vacancy to reach it.

Now: one card, three tabs — **Admission Notices · We Are Hiring · Guess Papers**
— each with a count. A tab with nothing in it is hidden from visitors, and the
page opens on the first tab that has content, so it never opens empty. An
Institute Admin always sees all three, because the empty ones are where they
add content.

`StudyMaterialSection` gained a `bare` prop that drops its own card and heading
when it renders inside the tab, which already provides both.

---

## 8. Choices made that the client should confirm

1. **Ad copy is strictly predecided, with no "Other…" option.** That is the
   literal reading of "should be predecided". If an institute ever needs a
   headline the list does not cover, they cannot write one.
2. **The predecided wording is our draft.** 8 titles and 6 descriptions per
   section, written for the Indian education sector. Please review and replace.
3. **An institute can revise its own course categories** in the page editor,
   not only Main Admin at creation. The categories drive the public page and the
   enquiry form, so an institute that could not correct them would have to
   raise a ticket for a typo.

---

## 9. Migration & deployment

One new Alembic revision, **0008**, purely additive — every column is nullable
or carries a `server_default`, so no existing row changes meaning:

- `pages.course_categories` (JSON)
- `page_enquiries.course_category`, `.course_subcategory`
- new table `opportunity_applications`

`backend/migrate.py` (what the EC2 deploy runs) takes it to head automatically.

**Verification run:**

- `alembic heads` → `0008 (head)`, single head, chain intact
- backend: **69 tests pass** (61 existing + 8 new)
- frontend: **33 tests pass**, `oxlint` clean, `vite build` succeeds
