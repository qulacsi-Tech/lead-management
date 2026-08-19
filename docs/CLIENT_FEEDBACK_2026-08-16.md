# Client Feedback Analysis — 16 Aug 2026

Status: **Implemented.** This is a WhatsApp conversation (client + Shiv + Abhishek Mohs10), 11:36am–11:59am, 16 Aug 2026. See `docs/CLIENT_FEEDBACK_2026-08-16_IMPLEMENTATION.md` for the client-shareable summary (what's built, where to see it, file paths).

## Implementation notes (added after build)

- **Section 5 (priority)** and **Section 6** were built together, since 6 is a hard prerequisite for 5 — `mockPages` is now a real array (was one hardcoded object), each page has a `slug`, and `/:instituteSlug` is a live dynamic route. Admin's new "Institute Pages" screen (`/admin/pages`) creates pages with Logo + Banner upload, matching the client's explicit ask.
- **Section 2's audit findings were fixed in the same pass**: "Looking for a Job" and "Looking for Admission (self)" are now real, working forms (previously one was a static readout, the other had disconnected inputs and a dead submit button). The decorative Edit/Push-to-top buttons across the Dashboard and Institute Page are now functional too.
- **Sections 3–4 (Marketplace-in-Profile)**: built as a new "My Network & Marketplace" tab on the Profile screen — a Follow mechanism (`useFollows`, localStorage-backed) now exists, selecting an institute affiliation there auto-follows it, followed pages' Admission Notices/Job Vacancies show free ("Sell Lead"), and Buy Leads route to the existing credit-gated Search Connections. The matrimony-style saved "desired profile" was generalized: `useDesiredCriteria` persists the saved job search, and the notification bell now periodically fires a real match against it instead of a purely random pool item.
- **Naming**: "EduNet" placeholder branding swapped to "Connectedus" everywhere it appeared (top nav, Login, Signup, Admin sidebar/footer).
- **Scope note, unchanged from the original analysis**: all of this (Sections 3, 5, 6, and the fixed forms) is still frontend-only / mock data — there's no backend for institutes/pages/enquiries yet (see `docs/EDUCATION_NETWORK_ROADMAP.md` Phase 3). Auth and the Professional Profile's core fields remain the only parts wired to a real backend.

---

---

## 0. TL;DR

- Sections 1–2 are a **conceptual framing**, not a new build ask — the client is explaining the B2B "Sell Lead / Buy Lead" mental model behind what's already built, and Shiv already confirmed the four enquiry-form flows are incorporated. Low/no action needed; see below for the terminology mapping worth keeping in mind.
- Sections 3–4 describe a **real new feature** — a Marketplace view living inside the user's own Profile, gated by Follows/selected-pages, with a matrimony-style "saved desired criteria" auto-matching mechanism.
- **Section 5 is the priority** — the client wants an Admin-side page-creation tool *today*, so his team can start manually building out real institute pages (copying from real institute websites) while the rest of the platform logic is still being designed. This does not exist yet in any form — Admin currently manages *accounts* (Students/Mentors/Institutes via registration), not *pages*.
- Section 6 is a routing/architecture ask: **vanity URLs per institute** (`connectedus.in/institute-name`), which also resolves the branding question flagged in the 12 Aug analysis — the real product name is **Connectedus** (domain `connectedus.in`), not "EduNet." Worth updating the placeholder branding at some point.

---

## 1. The "Sell Lead / Buy Lead" mental model

**Client's words (summarized):** In B2B portals, suppliers/manufacturers register and post leads under one of two categories — a **Sell Lead** (they have surplus stock of something they made, want to clear it) or a **Buy Lead** (they need raw material, or — his own example — he needed interior items while building his house, posted a Buy Lead, and got multiple offers back). Non-manufacturer users can post Buy Leads too.

**Applied to this portal, in the client's framing:**
- What an **Institute Page posts** (Admission Notice, Job Vacancy) = **Sell Lead** — the institute has a seat/role to offer.
- What a **user posts** (Looking for Admission, Looking for a Job) = **Buy Lead** — the user wants something.

**Current state:** this is exactly the shape of what's already built — `PostAdmissionNotice.jsx` / `PostJobVacancy.jsx` are institute-side (Sell Lead), the Professional Dashboard's "Looking for Job" / "Looking for Admission" tabs are user-side (Buy Lead). No client-facing "Sell Lead / Buy Lead" labels exist in the UI today, and nothing in this message asks for that terminology to become visible — it reads as the client explaining *why* the feature is shaped the way it is, for alignment, not a relabeling request. **No action needed**, but worth keeping this framing in mind for Section 3–4's marketplace visibility rules below, since they're defined in exactly these terms (Sell Lead = free/visible via follow, Buy Lead = hidden/credit-gated).

---

## 2. Four distinct enquiry-form flows — **audited, half of it is not actually functional**

**Client's words (summarized):** The forms need different fields depending on which of the four flows they're for: *I want admission* (Looking for Admission), *I want to give admission* (Post Admission Notice), *I want a job* (Looking for Job), *I want to give a job* (Post Job Vacancy). Shiv's reply in the thread: "Yes sir, I've incorporated as per these points."

**Audit (actually reading the code, not taking the confirmation at face value):**

| Flow | File | Status |
|---|---|---|
| Post Admission Notice (institute "give admission" = Sell Lead) | `PostAdmissionNotice.jsx` | ✅ Fully functional — Course/Session/Start & End Date/Eligibility/Description, correct fields, working submit |
| Post Job Vacancy (institute "give a job" = Sell Lead) | `PostJobVacancy.jsx` | ✅ Fully functional — Position/Subject/Experience/Qualification/Apply Before/Description, working submit |
| Looking for a Job (user "I want a job" = Buy Lead) | `ProfessionalDashboard.jsx` → `JobTab` | ❌ **Not a real form.** Just a read-only display of a hardcoded mock object (`mockDesiredJob`). The "Update Desired Job Details" button has no `onClick` — it's a no-op. |
| Looking for Admission — self (user "I want admission" = Buy Lead) | `ProfessionalDashboard.jsx` → `AdmissionTab` | ❌ **Not wired.** Inputs are uncontrolled (no `value`/`onChange`), not inside a `<form>`, and "Post Admission Enquiry" has no handler — clicking it does nothing. |
| Looking for Admission — for a friend | same `AdmissionTab` | ✅ Functional (controlled form, submit shows a "shareable link generated" confirmation state) |

**So the claim was only half right.** Both institute-side (Sell Lead) forms are genuinely done. Both individual user-side (Buy Lead) forms are not — one is a static readout, the other is a group of disconnected inputs with a dead button.

**Also found while auditing:**
- The "Manage Post" / "Manage Lead" rows (shared `ManageRow` component, used in the Job/Expert/Admission tabs) have Edit and "Push to top" buttons with no handlers at all — decorative across the board.
- Even the forms that *do* work only flip local success state on submit — none of the four append to the shared mock data, so e.g. a published Admission Notice never actually shows up back on `/page`. Consistent with the rest of the prototype being non-persisted at this stage (expected, not a defect on its own), but worth knowing when demoing.

**Action needed:** build real, working forms for "Looking for a Job" and "Looking for Admission (self)" — they don't exist today despite the earlier confirmation. Decide whether to also wire Edit/Push-to-top and local persistence in the same pass, or treat those as a separate, lower-priority cleanup.

---

## 3. Marketplace-in-Profile, gated by Follow/selected pages (new)

**Client's words (summarized):** The lead-purchasing marketplace will live **inside the user's own profile**. It shows Sell Leads (Job Posts + Admission Notices) from two sources: (a) pages the user **follows**, and (b) pages the user **selected while creating their profile** (his example: if I say during profile setup that I study at X School, and X School has a page, I automatically become a follower of it). Both sources' Sell Leads show for **free** in a Sell Lead section of the user's marketplace view. **All Buy Lead enquiries stay hidden** — those are only visible/purchasable through the existing points/credit system.

**Current state:**
- Following a page: not built at all — `InstitutePage.jsx` has no Follow button on the institute side, and Feed's "Institute Pages to follow" widget has Follow buttons that are currently non-functional UI (no state).
- "Select pages during profile creation" (e.g., "I study at X School"): doesn't exist — Profile has no institute-affiliation picker.
- Auto-follow from a profile selection: doesn't exist (depends on the above).
- A Marketplace *view inside Profile*: doesn't exist — the closest thing today is the standalone `/search` page (`SearchConnections.jsx`), which is generic search+filter+credit-unlock, not scoped to followed/selected pages and not living inside Profile.
- Free-vs-hidden visibility split (Sell Lead free, Buy Lead credit-gated): the credit-gated unlock mechanic already exists (`SearchConnections.jsx`'s `[Unlock Profile]` flow) — but nothing distinguishes "free because you follow this page" from "paid because it's someone else's enquiry" today.

**Gap:** this is a real, non-trivial feature — needs a Follow/unfollow mechanism with state, a profile-affiliation picker that triggers auto-follow, and either a new Profile tab or a redesigned `/search` that's personalized to the user's follow graph with a visibly-free "Sell Leads from your pages" section versus the existing credit-gated Buy Lead search.

---

## 4. Buy Lead discovery: search/filter + matrimony-style saved preferences (partially new)

**Client's words (summarized):** Buy Leads surface two ways: (a) manual search + filters, or (b) a pre-saved "desired profile" — the client explicitly compares this to matrimony websites, where you save what kind of biodata you want to see and matching profiles surface automatically. Any new lead matching the saved criteria should go to the user's **notifications**.

**Current state:**
- Search + filter: exists — `SearchConnections.jsx` already has Job/Admission/Subject/Location/Preferred Location/Experience filters.
- Saved "desired criteria" with auto-matching: partially conceptually present — `ProfessionalDashboard.jsx`'s "Looking for Job" tab already stores a `mockDesiredJob` (desired role/stream/preferred location) described as being used "to match relevant leads in the buy lead section" — but there's no actual matching logic wired to Search Connections, and it's not framed as a generalizable "save my desired profile" feature the way the client describes it here.
- Notification on new matching lead: the notification bell/live-notification mechanism already exists (`AppLayout.jsx`'s `NotificationBell`, currently cycling a generic mock pool) — but nothing today triggers a notification based on matching a saved desired-profile against new posts.

**Gap:** needs the desired-criteria concept generalized beyond just "Looking for Job" (matrimony-style, applies to whatever the user is searching for — job or admission), an actual matching pass against new posts, and wiring that match into the existing notification pipeline instead of the current random mock pool.

---

## 5. Priority: Admin panel to bulk-create Institute/School/Coaching pages (new, urgent)

**Client's words (summarized):** Build an Admin panel where the client (and 2–3 idle team members) can start creating Institute/School/Coaching pages themselves — by looking at real institutes' existing websites and replicating the content — so pages start going live *while the rest of the concept is still being built*. When creating a School/Institute/University/Coaching page: needs a **Logo upload** option, and the **header/banner image behind it should also display nicely** ("something that looks good, beautiful"). Domain will be handed to Abhishek separately for setup.

**Current state:**
- **No page-management exists in Admin at all.** `pages/admin/*` today is `ManageInstitutes.jsx`, `ManageStudents.jsx`, `ManageMentors.jsx` (all account/registration management via `/register/*`), `ManageEnquiries.jsx`, `AdminSettings.jsx`, `Dashboard.jsx` — none of these create or manage an Institute *Page* (the landing-page entity from the 12 Aug builder).
- Page creation today (`CreateInstitutePage.jsx`) is reachable only by a logged-in Professional user creating *their own* page from their own account — not something Admin can do on behalf of many institutes in bulk.
- **No logo upload anywhere.** Checked directly: `CreateInstitutePage.jsx` has zero image upload fields (just Name/About/Address/Website/Contact/type). `InstitutePageEditor.jsx` (built for the 12 Aug batch) has banner upload (2–3 images) but no separate Logo upload — `mockPage.logo` is literally just text initials ("BF") rendered in a colored circle, not an image.
- Multiple distinct pages: doesn't exist — there is exactly one hardcoded `mockPage` object, and the route `/page` always renders it. Creating a second institute page today has nowhere to go (see Section 6 — this is the same underlying gap as the vanity-URL ask).

**This is the most actionable, most urgent item in this batch** — the client explicitly wants to start using it immediately with his team, in parallel with everything else. It requires, at minimum:
1. An Admin-accessible "Create/Manage Institute Pages" screen (list of pages + a create flow), separate from the existing account-registration pages.
2. Logo upload, in addition to the existing banner upload.
3. Somewhere for each created page to actually live and be viewable (which is really the same requirement as Section 6 — see below).

---

## 6. Vanity URLs per institute — and the real brand name

**Client's words:** Wants URLs like `connected.in/abcuniversity` — the institute/university name appended dynamically after the domain. Shiv confirmed back: *"the url will be constant example connectedus.in/university_name format. Right sir?"* and clarified to the team *"jo v institute, university hoga wo url k baad dynamically aajayega"* (whatever institute/university it is will be dynamically appended after the URL). Abhishek confirmed this was already discussed and would happen soon. Client's closing reaction: *"Very good... ab kuch achha laga man ko"* (now I feel good about it).

**Current state:** the frontend has no per-institute routing at all — `/page` is a single static route always showing the one hardcoded `mockPage`. There's no slug field on any institute-page data, no dynamic `:slug` route, nothing to look up a page by name.

**Gap:** needs (a) a `slug` on each institute page (auto-generated from name, e.g. "ABC University" → `abcuniversity`, ideally editable/unique-checked), and (b) a dynamic route (e.g. `/:instituteSlug`) that looks up and renders the matching page instead of always rendering the one mock page. This is a prerequisite for Section 5 actually being useful — if the admin team creates 20 pages, each needs its own reachable URL.

**Naming resolved:** this conversation is the first clear confirmation that the actual product/brand is **Connectedus** (`connectedus.in`), not "EduNet." Everything built so far (login page, top nav, roadmap doc, footer text) uses "EduNet" as a placeholder. Worth a rebrand pass at some point — not urgent on its own, but cheap to fold into whatever touches the top nav next.

---

## 7. What this means for build order

Given the client's own stated priority (Section 5, explicitly "do this first, in parallel"), and that Section 6 is a hard prerequisite for Section 5 to produce anything usable (many pages need many URLs), the natural next-build order is:

1. **Multi-page data model + slug routing** (Section 6) — without this, Section 5's admin tool would only ever be able to create *one* page, which defeats the point.
2. **Admin page-creation/management screen + Logo upload** (Section 5) — the client's explicit, immediate ask.
3. Sections 3–4 (Marketplace-in-Profile, Follow mechanism, saved-desired-criteria matching) — larger, more involved, not time-pressured the way Section 5 is.
4. Rebrand pass (EduNet → Connectedus) — cheap, can ride along with any of the above.

Sections 1–2 need no build work, just confirmation this reading is correct.

---

## 8. Open questions

1. Confirm the build-order priority in Section 7 — is multi-page + slug routing + admin page creation genuinely "build this now, everything else can wait," or should any of Sections 3–4 be pulled forward?
2. Slug format: auto-generate from institute name with manual override, or does the client/admin want to type the slug directly when creating a page?
3. "Select pages during profile creation" (Section 3) — is this a new dedicated step in Signup, or does it belong in the Profile screen (similar to how Account Setup worked before it was paused)?
4. Rebrand timing — fold "EduNet" → "Connectedus" into the next UI change, or hold until explicitly requested?
