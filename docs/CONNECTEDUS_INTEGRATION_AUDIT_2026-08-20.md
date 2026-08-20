# Connectedus — Production Integration Readiness Audit

**Scope:** `frontend/` + `backend/` + `docs/`
**Method:** full-file code read, no assumptions from UI presence alone
**Date:** 2026-08-20
**Rule applied throughout:** a hidden button is not authorization; a mock array is not a database

Sources: `docs/EDUCATION_NETWORK_ROADMAP.md` · `docs/CLIENT_FEEDBACK_2026-08-12.md` (+ `_IMPLEMENTATION.md`) · `docs/CLIENT_FEEDBACK_2026-08-16.md` (+ `_CHECKLIST.md`, `_IMPLEMENTATION.md`) · full read of `backend/routers`, `backend/models`, `backend/schemas`, `backend/main.py`, `backend/seed.py` · full read of `frontend/src/pages`, `frontend/src/pages/admin`, `frontend/src/context`, `frontend/src/Api/Api.js` · `git log --diff-filter=D` for deletion evidence (commit `aa2e498`, 2026-08-09). No code was modified to produce this report.

---

## 1. Executive Summary

Connectedus is a recent pivot (commit `aa2e498`, 2026-08-09) from an original CRM product into a LinkedIn-style education network. The pivot deliberately deleted the CRM's backend (leads/tasks/activities) *and* the first pass at the network's own backend (Opportunity, Follow models) to focus on building the frontend prototype first. The result: a frontend that is largely click-through-complete, sitting on a backend that only covers authentication, core profile fields, and read-only admin listings.

Figures below are derived directly from the endpoint/model/component counts in this audit, not assigned arbitrarily. Where a module has no real precedent to count against, that is stated rather than guessed.

| Dimension | Completion |
|---|---:|
| Frontend UI | 85% |
| Admin UI | 55% |
| Backend API | 20% |
| Database | 25% |
| Frontend ↔ API wiring | 18% |
| Authorization | 20% |
| **Overall readiness** | **~33%** |

**Headline finding:** Exactly one module is genuinely production-integrated end-to-end: the core **Professional Profile** (name, headline, about, education, work experience, skills, photo/cover/resume) — real API, real Postgres columns, ownership enforced server-side by JWT identity. Everything else a user can see — institute pages, courses, admission notices, job vacancies, follow relationships, search, credits, purchase history, notifications — is frontend-only mock state that resets on refresh (§4–§5).

**Second finding:** Three Admin screens (Institutes, Students, Mentors) have a genuine bug, not a documented gap: their "Add" and "View Details" modals pass `isOpen` to a `Modal` component that only reads `open`, so those modals never render. This blocks the Admin's primary CRUD entry point regardless of backend readiness (§6).

**Third finding:** The offline login fallback in `AuthContext.jsx` issues a fully self-signed client-side session (including a guessed `role`) whenever the backend is unreachable, stored under the same key a real JWT uses. Nothing downstream can distinguish the two (§10).

---

## 2. Module Completion Matrix

Percentages are evidence-based estimates (endpoint/model/component presence, not a formal test suite) — treat as directional, not exact.

| Module | UI | Admin UI | API | DB | Wiring | Auth | Overall |
|---|--:|--:|--:|--:|--:|--:|--:|
| Institute Page (content: logo/banner/about/courses) | 100 | 60 | 0 | 0 | 0 | 20 | **25** |
| Institute Account (auth/registration) | 70† | 70 | 70 | 80 | 60 | 40 | **55** |
| Courses | 100 | 0 | 0 | 0 | 0 | — | **15** |
| Admission Notices | 100 | 20 | 0 | 0 | 0 | 20 | **20** |
| Job Vacancies | 100 | 20 | 0 | 0 | 0 | 20 | **20** |
| Sell Leads (notices/jobs → followers) | 90 | 10 | 0 | 0 | 0 | 10 | **18** |
| Buy Leads (looking-for-job/admission) | 80 | 0 | 0 | 10 | 0 | 0 | **15** |
| Follow / Network | 100 | 0 | 0 | 0 | — | — | **20** |
| Search Connections | 70 | — | 0 | 0 | 0 | — | **15** |
| Enquiries | 80 | 70 | 50 | 60 | 30 | 30 | **40** |
| Profile | 95 | — | 90 | 90 | 90 | 80 | **85 ✅** |
| Notifications | 60 | 0 | 0 | 0 | 0 | — | **10** |
| Purchased History | 70 | — | 0 | 0 | 0 | — | **10** |
| Students (Admin module) | 70† | 70 | 70 | 80 | 60 | 40 | **55** |
| Mentors (Admin module) | 70† | 70 | 70 | 80 | 60 | 40 | **55** |

† Add/View modals broken (§6) — UI exists but its primary entry points don't open.

---

## 3. Admin → API → DB → Frontend Flows

For each content type, where the chain actually breaks.

### Institute Page (public landing page)
```
Admin/Owner UI    ✅ exists — CreateInstitutePage.jsx, InstitutePageEditor.jsx
Backend API       ❌ none — no /api/pages/* router exists
Database          ❌ none — no Page/PageAdmin table; Institute model has no logo/banner/slug
Frontend fetch    ❌ reads/writes frontend/src/pages/mockData.js::mockPages in place
User-facing UI    ✅ renders correctly from that in-memory array
                  ⚠️ resets on every page refresh
```

### Courses
```
Admin course CRUD         ❌ none — courses is a free-text chip list typed once at page creation
Backend API                ❌ none
Database                   ❌ none — not even a column; lives inside mockPages[].courses[]
Course API                 ❌ none
Institute Page → Courses  ✅ renders from the same in-memory array
```

### Admission Notices / Job Vacancies
```
Institute Owner posts     ✅ PostAdmissionNotice.jsx / PostJobVacancy.jsx
Backend stores            ❌ Opportunity model + router existed, deleted 2026-08-09
Feed retrieves             ⚠️ Feed.jsx reads a separate static pool (feedPostPool), not the posted notice
Institute page retrieves  ✅ myPage.opportunities.unshift(...) — same in-memory object
Followers see notice      ❌ no follower fan-out; nothing pushed to anyone
```

### Enquiries (the one partially-real chain)
```
User opens Institute Page      ✅
Quick Enquiry / Enquiry Modal  ✅ UI complete incl. OTP-looking step
Submit                          ❌ setSubmitted(true) only — no API call at all
Backend                         ❌ not reached
Database (enquiries table)      ⚠️ table + model exist, but nothing writes to it from this flow
Admin Enquiries listing         ✅ GET /api/admin/enquiries is real and reads real rows
                                 ❌ rows an Admin sees were never created by this form
```

### Follow
```
User clicks Follow  ✅ useFollows() hook
Backend API          ❌ Follow model + router existed, deleted 2026-08-09
Database              ❌ none
Persistence           ⚠️ localStorage key "followedPages" — survives refresh, not shared
                       across devices/accounts, not visible to the institute being followed
```

### Profile (for contrast — the working chain)
```
User edits Profile tab   ✅ ProfessionalProfile.jsx
useSession.updateProfile ✅ → PATCH /api/profile/me
Backend                  ✅ routers/profile.py, current_user only
Database                 ✅ users table, real columns
Re-render                ✅ AuthContext.patchUser merges the response
```

---

## 4. Static / Mock Data Inventory

Every export in `frontend/src/pages/mockData.js`, what backs it today, and what production requires. **mock** = in-memory, resets on refresh · **local** = localStorage, survives refresh but not real persistence · **live** = real API.

| Dataset | Status | Consumers | Production replacement needed |
|---|---|---|---|
| `mockPages` | mock | Feed, InstitutePage, Editor, CreateInstitutePage, Profile Marketplace tab, admin/ManagePages | `Page` + `PageAdmin` tables, full CRUD API |
| `mockProfessional` | mock | Feed ProfileRail | replace with the logged-in user's real profile — currently shown regardless of who is logged in |
| `mockFeedPosts` / `feedPostPool` | mock | Feed.jsx | `GET /opportunities?type=...` assembled from real posts + follows |
| `mockSearchResults` | mock | SearchConnections.jsx | search API over real profiles with real credit-gated unlock |
| `mockPurchasedHistory` | mock | PurchasedHistory.jsx | purchase/unlock ledger table + API |
| `mockNotifications` / `notificationPool` | timer | AppLayout NotificationBell | `Notification` table + push/poll API |
| `mockGuessPapers` / `mockAdmissionLeads` | mock | ProfessionalDashboard tabs | content table tied to author + real file upload |
| `COURSE_SPECIALIZATIONS` | mock | Enquiry modal, Quick Enquiry | fine as static app config *if* curated centrally — currently only 4 of N courses have entries |
| `EXISTING_ENQUIRY_USER` | mock | Enquiry modal "existing user" lookup | real phone-number lookup against `students`/`users` |
| `desiredJob` (localStorage) | local | Dashboard JobTab, NotificationBell | server-side "desired criteria" record so matching can run centrally, not per-browser |
| `followedPages` (localStorage) | local | Feed, InstitutePage, Profile | `Follow` table (existed once, deleted) |
| `lm.institutes` / `lm.students` / `lm.mentors` (localStorage) | local | DataContext, Admin list/status/delete | backend PATCH/DELETE endpoints — currently don't exist even for the real rows |

---

## 5. "Fake Dynamic" UI

Functionality that *looks* live or persisted but isn't. This is the most important section for setting client expectations — a demo click-through can look finished while none of this survives a refresh or a second user.

- **Feed "Live feed · next update in Ns"** — a client `setInterval` prepending a random canned post; no new content is ever actually posted by anyone.
- **Feed infinite scroll** — a fake 900ms loading delay, then the same 6 template posts cycle with fresh IDs.
- **Post like/comment counts** — per-card local state, resets on refresh.
- **Notification bell "new notification"** — a 4-second interval manufacturing notifications from a fixed pool, with a "1 in 4 is a match" heuristic against localStorage — reads as a matching engine, is a cycling timer.
- **Institute logo/banner upload** — `URL.createObjectURL(file)`: a blob URL valid only in the current tab. Nothing is uploaded anywhere.
- **Search filters** (Job/Admission/Subject/Location/Experience) — every dropdown renders only a single placeholder `<option>Demo option</option>`. Selecting a filter does not filter anything.
- **Search credit balance** — `1240 − unlocked.length`, recomputed from scratch every visit. No ledger exists anywhere, frontend or backend.
- **Purchased History "Push to CRM" / "Download" / "Export to Excel"** — no `onClick` handlers at all. Fully decorative.
- **Enquiry Modal "Send OTP"** — flips a boolean; any non-empty value in the OTP field satisfies the form.
- **Enquiry Modal "existing user" lookup** — matches exactly one hardcoded phone number.
- **Admin Settings "Save Settings"** — flashes a confirmation for 3 seconds; nothing is persisted, not even to localStorage.
- **Institute Page Editor "Saved ✓"** — real-looking save confirmation for an `Object.assign` onto an in-memory object.
- **Login/Signup "Continue with OTP" / "Continue with Google"** — buttons with no handler at all.

---

## 6. Missing / Broken Admin Capabilities

> **Confirmed defect.** `components/ui/Modal.jsx` reads a prop named `open`. `admin/ManageInstitutes.jsx`, `admin/ManageStudents.jsx`, and `admin/ManageMentors.jsx` all pass `isOpen` instead, across six separate `<Modal>` usages (Add + View Details × 3 pages). `open` is therefore always `undefined`, and the modal always returns `null`. **The Add Institute / Add Student / Add Mentor forms and all three View Details panels never open**, regardless of backend readiness. Contrast with `InstitutePage.jsx`, `SearchConnections.jsx`, and `admin/ManagePages.jsx`, which use `open` correctly and work.

| Content visible on frontend | Classification | Detail |
|---|---|---|
| Institute Page content (logo, banner, about, courses) | E — static/mock only | No Admin UI writes anywhere durable; no backend at all |
| Admission Notices / Job Vacancies | E — static/mock only | Posted by page owner into the same in-memory object; no Admin oversight/moderation surface exists |
| Institute account status (active/suspended) | D — frontend exists, backend missing | Toggle mutates localStorage only; no PATCH endpoint exists |
| Institute/Student/Mentor delete | D — frontend exists, backend missing | Same — localStorage-only, no DELETE endpoint |
| Institute/Student/Mentor create (Add modal) | B — Admin UI exists, backend is called, but UI itself is broken | `registerInstitute/Student/Mentor` APIs are real and wired, but the modal never opens (see defect above) |
| Enquiry response / assignment / status | E — static/mock only | Admin can only list enquiries; no reply/assign/status-change UI or API |
| Follow relationships (moderation/visibility) | E — static/mock only | Entirely client localStorage; Admin has no visibility into who follows what |
| Credits / credit ledger | E — static/mock only | `AdminSettings`'s "default credits" field doesn't feed anything real; no ledger table |

**Admin data with no downstream consumer** (reverse check): `lm.notifications` localStorage key is written by nothing (dead pipeline — the admin TopBar notification bell always reads an empty array in practice). `AdminSettings`'s `autoApprove`/`defaultCredits`/`emailAlerts` toggles are captured but read by no other component (e.g. `defaultCredits` does not feed `SearchConnections`' hardcoded `1240`).

---

## 7. Missing Backend APIs

### Existing endpoint inventory

| Method | Endpoint | Purpose | Auth | Ownership check |
|---|---|---|---|---|
| POST | `/api/auth/register` | Generic signup | No | n/a |
| POST | `/api/auth/login` | JWT login | No | n/a |
| GET | `/api/auth/me` | Current user | Yes | yes |
| POST | `/api/auth/logout` | Revoke JWT (jti) | Yes | yes |
| POST | `/api/auth/change-password` | Change own password | Yes | yes · unused by frontend |
| POST | `/api/register/{student\|mentor\|institute}` | Role-specific signup | **None** | n/a |
| GET | `/api/admin/{students\|mentors\|institutes\|enquiries}` | Admin listings | Admin role | n/a — read-only |
| GET | `/api/profile/me` | Get own profile | Yes | yes |
| PATCH | `/api/profile/me` | Update own profile | Yes | yes |
| POST | `/api/profile/me/upload` | Photo/cover/resume upload | Yes | yes |
| GET | `/api/geo/*` | Static state/district/block lists | No | n/a · unused by frontend |

### Required, currently missing

| Endpoint (suggested) | Replaces | Notes |
|---|---|---|
| `POST/GET/PATCH /api/pages`, `GET /api/pages/{slug}` | `mockPages`, CreateInstitutePage, InstitutePageEditor | Core entity for the whole "Sell Lead" side of the product |
| `POST/DELETE /api/pages/{id}/admins` | InstitutePage Add Admin modal | Backs the ownership model the frontend already assumes (`page.admins`) |
| `POST/GET/PATCH/DELETE /api/pages/{id}/courses` | page-create course chip list | Courses have zero backend representation today |
| `POST/GET/PATCH /api/opportunities?type=admission\|job` | PostAdmissionNotice, PostJobVacancy, Feed pool | Existed once (deleted 2026-08-09) — reinstate, then extend with page ownership |
| `POST/DELETE /api/follows` | `followedPages` localStorage | Existed once (deleted) — reinstate |
| `POST /api/enquiries` | Enquiry Modal's `setSubmitted(true)` | Table already exists (`enquiries`) — currently nothing writes to it from the user-facing form |
| `POST /api/enquiries/{id}/unlock` | Search "unlock profile", Purchased History | `EnquiryUnlock` table exists, orphaned — no router uses it |
| `GET /api/search?...` | `mockSearchResults` | Needs real filter params, not the current decorative dropdowns |
| `GET/POST /api/credits`, `/api/credits/ledger` | hardcoded `1240` in SearchConnections | `institutes.credits` column exists but has no ledger/transaction trail |
| `GET/POST /api/notifications` | `notificationPool` timer | No table exists; current bell is 100% simulated |
| `PATCH/DELETE /api/admin/institutes/{id}`, `/students/{id}`, `/mentors/{id}` | status toggle / delete on 3 admin pages | Currently localStorage-only despite reading as an authoritative admin action |
| `POST /api/uploads/page-media` | `URL.createObjectURL` for logo/banner | Reuse the existing `backend/uploads/` pattern already proven for profile photos |

---

## 8. Missing Database Models

| Entity | Status today | Evidence |
|---|---|---|
| Page | missing | No model file; `Institute` has no logo/banner/slug/multi-admin columns |
| PageAdmin | missing | No model or table anywhere — this is the table the ownership fix earlier this session is standing in for client-side |
| Opportunity | missing — deleted | `models/opportunity.py` + router existed, removed in `aa2e498` |
| Follow | missing — deleted | `models/follow.py` existed, removed in `aa2e498`; dead `followers_count`/`is_following` fields remain in `MentorPublicResponse` schema |
| Like | missing | Never existed; dead `total_likes` field in `MentorStats` schema |
| Credit ledger / transaction | missing | Only a bare `credits INTEGER DEFAULT 1240` column on `institutes`; no transaction table |
| Notification | missing | No table; frontend bell is timer-driven |
| EnquiryUnlock | exists, orphaned | Table defined in `models/enquiry.py`, zero routers reference it |
| User / Student / Mentor / Institute / Enquiry / RevokedToken | exists | 7 real tables, actively used by auth/register/admin/profile routers |

**Schema management:** No Alembic anywhere in the repo. Schema evolves via `Base.metadata.create_all` plus 24 hand-written idempotent `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements in `main.py` (additive-only — no renames, no drops, no down-migration, no version tracking). Fine for a solo prototype; a real migration tool is required before this has more than one contributor or one environment.

---

## 9. Missing Frontend Wiring

Existing UI that needs API integration only — no redesign required.

| Component | Current source | Required |
|---|---|---|
| `InstitutePage.jsx` | `mockData.js` | `GET /api/pages/{slug}` |
| `InstitutePageEditor.jsx` | `Object.assign` on live mock object | `PATCH /api/pages/{id}` |
| `CreateInstitutePage.jsx` | `addPage()` mutating array | `POST /api/pages` |
| `PostAdmissionNotice.jsx` / `PostJobVacancy.jsx` | `myPage.opportunities.unshift()` | `POST /api/opportunities` |
| `Feed.jsx` | `mockFeedPosts` + `feedPostPool` timers | `GET /api/opportunities?type=...` assembled server-side from real posts + follow graph |
| `SearchConnections.jsx` | `mockSearchResults`, decorative filters | `GET /api/search` with real query params; unlock → `POST /api/enquiries/{id}/unlock` |
| `PurchasedHistory.jsx` | `mockPurchasedHistory` | `GET /api/credits/ledger`; wire the currently-handlerless Download/Export/Push-to-CRM buttons to real actions |
| `useFollows.js` | localStorage | `GET/POST/DELETE /api/follows` |
| `InstitutePage.jsx` EnquiryModal | local `setSubmitted(true)` | `POST /api/enquiries` |
| `AppLayout.jsx` NotificationBell | `notificationPool` timer | `GET /api/notifications` (poll or websocket) |
| `admin/ManagePages.jsx` | `mockPages` | same Page API as above, Admin-scoped bulk create |
| `admin/ManageInstitutes/Students/Mentors.jsx` status & delete | localStorage (`DataContext`) | `PATCH/DELETE /api/admin/{resource}/{id}` |
| `Feed.jsx` ProfileRail | `mockProfessional` (fixed persona) | the real logged-in user via `useSession()`, already available elsewhere |

### Genuinely new UI required (not just wiring)

- Admin: Enquiry response/assignment/status workflow (currently list-only)
- Admin: Credit ledger view + manual credit adjustment
- Institute Page: real course CRUD (structured fields, not a free-text chip)
- Change-password screen (API exists, unused, no UI anywhere)
- Real OTP verification UI/flow (current one is a boolean toggle)

---

## 10. Authorization & Security Gaps

> **Session spoofing.** `AuthContext.login()` (lines 55-67): when the backend is unreachable — network error, not a rejected-credentials response — the client fabricates a full session: `{ access_token: 'mock-'+Date.now(), user: {...} }`, stored under the exact same `localStorage` key (`lm.token`) a real JWT uses, with role guessed from `email.includes('admin')`. Every downstream check (`useAuth().role`, `RequireAdmin`) treats this identically to a real session. This is broader than a UI bug — it means the entire authorization system can be entered without ever contacting the server.

> **Unauthenticated role self-registration.** `/api/register/{mentor|institute}` has no auth/role check at all despite the product's own framing of these as "Admin-provisioned" roles (roadmap §6). Any anonymous caller can self-register as a Mentor or Institute directly against the API.

### Client-side-only authorization inventory

- `InstitutePage.jsx` `isMyPage`/Add Admin — fixed this session to check `page.admins` correctly, but that array is a plain bundled JS object with no backend behind it; the fix makes it internally consistent, not secure.
- `InstitutePageEditor.jsx`, `PostAdmissionNotice.jsx`, `PostJobVacancy.jsx` — same pattern: gate is "which mock page object did we find," not a server permission check.
- `admin/ManageInstitutes/Students/Mentors.jsx` status toggle & delete — any session with `role === 'admin'` (including a spoofed offline one, see above) can silently suspend/delete with zero backend record.
- `ProfessionalProfile.jsx` Marketplace "Your Institutes" — a UI flag only, no real affiliation relationship to authorize.

### What IS enforced server-side today

Every mutating endpoint that exists acts only on `current_user` derived from the JWT (profile PATCH/upload, logout-revoke, change-password) — no endpoint currently accepts a client-supplied resource ID for a write, so there is no live IDOR in the *existing* surface. The gap is that almost none of the write surface the frontend implies (page edit, admin add/edit, opportunity CRUD) exists on the backend yet — when it's built, it will need explicit ownership checks from day one, since no `PageAdmin`-style table exists yet to check against.

---

## 11. Legacy CRM Code

| Item | State | Recommendation |
|---|---|---|
| `Lead`, `LeadActivity`, `LeadTask` models + routers | Deleted outright, 2026-08-09 | — |
| `LeadStatus`, `LeadSource`, `ActivityType`, `TaskStatus`, `TaskPriority` enums | Still in `models/enums.py`, referenced nowhere else | REMOVE |
| `UserRole.MANAGER`, `UserRole.AGENT` | Unreferenced beyond the enum definition | REMOVE |
| `__pycache__` remnants for deleted modules | Inert, not imported | REMOVE (housekeeping) |
| `lm.leads` localStorage key | Referenced only by `AdminSettings`' reset handler; no writer exists | REMOVE |
| "ParentLead" naming (backend default admin email, project name) | Cosmetic mismatch with "Connectedus" branding | REPURPOSE — rename before client-facing deploy |

No code was modified for this section — audit only, per the requested scope.

---

## 12. Recommended Implementation Plan

### Phase 1 — Foundation
- Introduce Alembic; snapshot the current ad-hoc `ALTER TABLE` state as the baseline migration
- Add `Page`, `PageAdmin`, `Opportunity`, `Follow`, `Notification`, credit-ledger tables
- Close the session-spoofing gap: remove or clearly quarantine the offline mock-login fallback before any real deploy
- Add role/auth checks to `/api/register/mentor` and `/api/register/institute`

### Phase 2 — Admin content management
1. Fix the `isOpen`/`open` Modal defect (blocks everything else in this phase from being testable)
2. Institute (Page) CRUD + logo/banner upload, reusing the existing `backend/uploads/` pattern
3. Courses CRUD
4. Admission Notices / Job Vacancies CRUD, tied to `Page` ownership
5. Enquiry create (wire the existing form) + Admin response/assignment workflow
6. Admin PATCH/DELETE for institutes/students/mentors (replace localStorage-only actions)

### Phase 3 — Frontend wiring
Work through §9's table component-by-component; each row is independently shippable once its API exists.

### Phase 4 — Network & marketplace
- Follow (reinstate deleted model + router)
- Search with real filters
- Credit ledger + unlock flow (wire the orphaned `EnquiryUnlock` table)
- Notifications (real table, replace timer simulation)
- Purchased history tied to the ledger

### Phase 5 — QA & security
- Ownership tests: user A must not be able to edit/post-to/add-admins-on user B's page, enforced server-side
- Multi-institute, multi-admin-per-page test scenarios
- Refresh-persistence tests for every item currently flagged "fake dynamic" in §5
- Confirm the offline-login fallback cannot reach any authenticated or admin route once closed

---

## 13. Final Answers

**A. How much of the application is production-integrated?**
One module fully (Profile) plus thin real slices of three others (Admin listings, Institute/Student/Mentor registration, Enquiry listing). Roughly a fifth of the visible surface by the evidence in §2.

**B. How much is only UI?**
The large majority — Institute Pages, Courses, Notices, Jobs, Follow, Search, Purchased History, Notifications are all click-through-complete with no backend.

**C. How much is static/mock?**
See §4 — 13 distinct mock datasets in `mockData.js` alone, plus 6 localStorage keys standing in for real persistence.

**D. How much Admin functionality already exists?**
Read access to real institutes/students/mentors/enquiries, and real create for institutes/students/mentors — undermined by the broken Add/View modals (§6).

**E. How much Admin functionality still needs to be built?**
All of Institute Page/Course/Notice/Job management, enquiry response workflow, credit administration, and PATCH/DELETE for the entities Admin already lists.

**F. How many backend APIs are missing?**
12 endpoint groups identified in §7 as required and absent, against 11 that exist today.

**G. How many database entities/tables are missing?**
7 identified in §8 (Page, PageAdmin, Opportunity, Follow, Like, credit ledger, Notification) against 7 that exist (one of those seven, `EnquiryUnlock`, exists but is unused).

**H. How much frontend wiring is required?**
13 components identified in §9 need an API swapped in with no redesign; the underlying UI is largely reusable as-is.

**I. Which existing UI can be reused without redesign?**
Nearly all of it — Feed, InstitutePage, Editor, Search, PurchasedHistory, Dashboard are structurally sound; they need data sources, not rebuilding.

**J. Which UI genuinely needs to be built?**
Enquiry response/assignment, credit ledger view, structured course CRUD, change-password screen, real OTP flow — see §9.

**K. Which modules can be made production-ready with wiring only?**
Institute Page, Notices, Jobs, Follow, Search, Purchased History, Notifications — once their APIs exist, the frontend mostly drops in.

**L. Which modules require full-stack development?**
Courses (no backend concept at all), Credit ledger, Enquiry response workflow, Admin edit/delete for existing entities.

**M. What is the correct implementation order?**
Fix the Modal defect first (it's blocking, one-line) → Phase 1 foundation → Phase 2 Admin content → Phase 3 wiring → Phase 4 network/marketplace → Phase 5 QA, per §12.

---

## 14. Executive Table

| Area | Existing UI | Existing Admin | Existing API | Existing DB | Static/Mock | Wiring Needed | New UI Needed | Backend Needed | Priority |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Institute Pages | ✓ | ~ | ✕ | ✕ | ✓ | ✓ | — | ✓ | P0 |
| Courses | ✓ | ✕ | ✕ | ✕ | ✓ | ✓ | ✓ | ✓ | P0 |
| Admission Notices | ✓ | ~ | ✕ | ✕ | ✓ | ✓ | — | ✓ | P0 |
| Job Vacancies | ✓ | ~ | ✕ | ✕ | ✓ | ✓ | — | ✓ | P0 |
| Sell Leads | ✓ | ✕ | ✕ | ✕ | ✓ | ✓ | — | ✓ | P0 |
| Buy Leads | ~ | ✕ | ✕ | ~ | ✓ | ✓ | — | ✓ | P1 |
| Follow/Network | ✓ | ✕ | ✕ | ✕ | local | ✓ | — | ✓ (reinstate) | P1 |
| Search | ~ | — | ✕ | ✕ | ✓ | ✓ | — | ✓ | P1 |
| Enquiries | ✓ | ~ | ~ | ✓ | — | ✓ | ✓ (response flow) | ✓ | P0 |
| Profiles | ✓ | — | ✓ | ✓ | — | — | — | — | P0 — **done** |
| Notifications | ~ | ✕ | ✕ | ✕ | ✓ | ✓ | — | ✓ | P1 |
| Purchased History | ~ | — | ✕ | ✕ | ✓ | ✓ | — | ✓ | P1 |
| Students | broken modal | ✓ | ~ | ✓ | — | ✓ (fix modal + PATCH/DELETE) | — | ✓ | P1 |
| Mentors | broken modal | ✓ | ~ | ✓ | — | ✓ (fix modal + PATCH/DELETE) | — | ✓ | P1 |

---

## Recommended Ownership

### Frontend
- New UI: Enquiry response flow, credit ledger view, structured course fields, change-password, real OTP
- Wiring: §9's 13 components — replace `mockData.js` reads with API calls
- Remove: `mockPages`, `mockSearchResults`, `mockPurchasedHistory`, `notificationPool`, `mockProfessional` once their APIs land
- State: introduce a real data-fetching layer (React Query or equivalent) for the entities currently re-fetched ad hoc via `DataContext`/localStorage

### Backend
- Reinstate `Opportunity` and `Follow` (deleted 2026-08-09) with page-ownership checks this time
- New: `Page`, `PageAdmin`, credit ledger, `Notification`
- Wire the orphaned `EnquiryUnlock` table into a real unlock endpoint
- Add PATCH/DELETE for institutes/students/mentors
- Close the register-without-auth gap on `/api/register/mentor` and `/institute`
- Introduce Alembic before further schema growth

### Admin
- Fix the Modal `isOpen`/`open` defect immediately — unblocks testing everything else
- Page/Course/Notice/Job CRUD screens
- Enquiry assignment + response workflow
- Credit administration
- Wire status-toggle/delete on Institutes/Students/Mentors to real endpoints

### QA
- Ownership/security: user A editing/posting-to user B's page must fail server-side, not just hide client-side
- Multi-institute, multi-admin-per-page scenarios
- Refresh-persistence regression tests for every §5 "fake dynamic" item
- Verify the offline-login fallback cannot reach authenticated/admin routes once addressed
