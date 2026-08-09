# Education Professional Network — Roadmap & Requirements

Status: **Approved, promoted to the app root, and running on a single real, dynamic backend login.** The prototype UI (Section 5) is no longer a side route — it *is* the app now for Professional/Student users. The old Student/Mentor/Institute self-service dashboards, and the corresponding backend routers/models, have been deleted (frontend and backend). There is now **one login page for everyone, Admin included** — no separate admin login, no role picker; the backend resolves role from the account and the frontend redirects accordingly. See [Section 4](#4-phased-roadmap) for what changed and [Section 6](#6-where-things-live-in-the-repo) for the current file map.

---

## 1. Project Vision (client's words)

> हम एक ऐसा Education Portal बना रहे हैं जो Education Industry के लिए LinkedIn की तरह काम करेगा।
> We are building an Education Portal that works like LinkedIn for the education industry.

Core idea: an **Education Professional Network** connecting teaching professionals, institutes, and students — profiles, pages, job/admission postings, search & unlock (credit-based), and reputation — modeled closely on LinkedIn + Facebook Pages.

---

## 2. Functional Flow (as specified by client)

### 2.1 Authentication
- Sign Up / Sign In
- Google Login
- OTP Verification

### 2.2 User Types
Only **two** user types, chosen at profile creation:
- **I am Professional**
- **I am Student** — cannot create a Page, and does not see "Looking for a Job" or "Expert Opinion" options.

**Professional** sub-categories: School Teacher, Coaching Faculty, College Professor, Guest Faculty, Mentor, Trainer, Tuition Teacher.

**Institute** is not a third user type — it is a **Page** that a Professional user creates and administers (like a Facebook Page). The software owner (super admin) can also create pages and later assign/change admins on them.

### 2.3 Institute Page

**A) Create Institute Page**
- User selects type: School / Coaching / College / University / Training Institute
- User creates the Page
- Creator automatically becomes the Page's first Admin
- Creator can add more Admins later — exactly like a Facebook Page

**B) Institute Page contents** (acts as a landing page)
- Logo / Cover / About / Address / Website / Contact / Courses / Enquiry form

**C) Institute Page features** — a Page can publish exactly two types of Opportunity posts:

1. **Admission Open Notice**
   Course / Session / Admission Start Date / Admission End Date / Eligibility / Description

2. **Job Vacancy Notification**
   Position / Subject / Experience / Qualification / Apply Before / Description

### 2.4 Professional Profile (LinkedIn-style)

Visible on the user's Profile:
- Followers / Likes / Downloads / Reputation Score / Recommendations
- Profile Photo / Cover Photo / Headline / About
- Qualification / Experience / Subjects / Skills
- Current Institute / Previous Institutes / Resume
- Contact Details

### 2.5 Professional Dashboard

**My Account**
- Manage Profile / Our Membership / Desired History / Referral Code

**Looking for Job?**
- Desired Job Details, including a desired job/stream **location** — used to match relevant leads in the "buy lead" section
- Manage Post: Edit / Last Updated Date / Reach / Views / Current Ranking / Push to top

**Expert Opinion**
- Upload Guess Paper / Manage Paper: Edit / Last Updated Date / Reach / Views / Current Ranking / Push to top

**Looking for Admission?**
- Desired (my) Admission Details — user can post an enquiry for any stream/crash course, for themself
- Post Admission Lead for a Friend — build a checkbox-style enquiry form the user can share with their students
- Manage Lead: Edit / Last Updated Date / Reach / Views / Current Ranking / Push to top

### 2.6 Search Connections

- Filters: Job / Admission / Subject / Location / Preferred Location / Experience
- Results shown as **masked profile cards** (name/phone partially hidden, e.g. `R*****h S****a`, `+91-7*******9`) with key details (role/qualification, experience, preferred location, open-for-job/admission flag) and a **credit cost** per profile
- `[Unlock Profile]` button — spends credits to reveal full contact details

### 2.7 Purchased History / My Buy Lead
- Download / Export to Excel / mark "Interested" → push to any company CRM

---

## 3. Gap Analysis vs. Existing Build

The existing `lead-management-complete` app is a **lead-gen marketplace** (Student submits enquiry → Institute pays credits to unlock contact), not a social/professional network. Summary of what's reusable vs. net-new:

**Reusable foundation**
- Auth (JWT), to be extended with OTP + Google login
- Institute entity & credit-based unlock mechanic (conceptual ancestor of Search Connections → Unlock Profile)
- Mentor entity (conceptual ancestor of "Professional") — has title/company/subjects/experience already
- React + FastAPI + PostgreSQL stack, existing `components/ui` design system

**Net-new (this roadmap)**
- Institute Page as a multi-admin, Facebook-Page-style entity separate from the user account
- Two structured opportunity post types (Admission Notice, Job Vacancy) authored by Institute Pages, not Mentors
- Full Professional Dashboard (My Account, Looking for Job, Expert Opinion, Looking for Admission, Manage Lead)
- Social/reputation layer: Followers, Likes, Downloads, Reputation Score, Recommendations
- Search Connections with masked-profile cards, multi-field filters, per-profile credit pricing
- Purchased History with export/CRM-push actions
- Collapse of current 6 roles (Admin/Manager/Agent/Student/Mentor/Institute) down to 2 (Professional/Student) + Institute-as-Page + Admin as super admin
- The existing CRM `Lead`/`LeadActivity`/`LeadTask` backend subsystem is unused by the frontend today and orthogonal to this direction — decide keep/repurpose/drop before backend work starts.

---

## 4. Phased Roadmap

### Phase 1 — UI Prototype ✅ built and approved
- A **static, backend-free** prototype of every screen in Section 2, using mock/local data only (`localStorage`, no API calls)
- Built first in an isolated `/prototype` route, then reworked mid-build (on feedback) from a flat "menu of 9 screens" into an actual **LinkedIn-style experience** — see Section 5 for what changed and why
- Screens built: Login, Signup, common Feed dashboard, Create Institute Page, Institute Page (public + admin), Post Admission Notice, Post Job Vacancy, Professional Profile, Professional Dashboard (My Account / Looking for Job / Expert Opinion / Looking for Admission), Search Connections, Purchased History

### Phase 1.5 — Promotion & Old-Dashboard Removal ✅ done
Once approved, the prototype was promoted to be the real app for Professional/Student users, and the dashboards it replaces were deleted outright rather than left running side-by-side:
- **Frontend deleted**: `pages/student/*`, `pages/mentor/*`, `pages/institute/*`, their layouts (`StudentLayout`, `MentorLayout`, `InstituteLayout`), the three role-specific registration modals, and the old combined Login/Signup/ForgotPassword pages
- **Frontend promoted**: `pages/prototype/*` moved to `pages/*` (e.g. `Feed.jsx`, `ProfessionalProfile.jsx`), `PrototypeLayout.jsx` → `layouts/AppLayout.jsx`
- **Routing**: `/` is now Login, `/signup` Signup, `/feed` `/profile` `/dashboard` `/search` `/purchased` `/page*` `/create-page` all live under the promoted shell. `/admin/*` is untouched.
- **Backend deleted**: self-service-only routers (`mentor.py`, `opportunities.py`, `mentors_public.py`, `students.py`, `institute.py`, `papers.py`, `enquiries.py`) and unused legacy CRM scaffolding (`leads.py`, `users.py`, `dashboard.py`, `activities.py`, `tasks.py`) plus their now-orphaned models (`lead`, `task`, `activity`, `opportunity`, `paper`, `follow`)
- **Backend kept**: `auth.py`, `register.py`, `admin_data.py`, `geo.py`, and the `student`/`mentor`/`institute`/`enquiry`/`user` models — Admin still lists and provisions these entities via `/admin/*` and `/register/*`
- **`DataContext.jsx` refactored**, not deleted: dropped the referral-lead marketplace (`addLead`/`unlockLead`/`verifyLead`/credit wallet — nothing produces those anymore with the self-service UI gone) but kept institutes/students/mentors listing + notifications, since Admin's Manage* pages and `TopBar` depend on it

### Phase 1.6 — Unified, Dynamic Auth ✅ done
Initially Admin kept its own separate login page hitting the real backend, while Professional/Student ran on a `useProtoAuth` localStorage mock (a pre-seeded fake accounts list, no real password check). That split was closed:
- **One login page for everyone** (`/`, `pages/Login.jsx`) — no role selector, no separate `/admin/login`. It authenticates against the real backend for any account, admin included, and redirects based on the role the backend returns (`role === 'admin' → /admin`, else `/feed`).
- **`useSession` rewritten** (`context/useSession.js`) from a localStorage mock into a thin adapter over `AuthContext`'s real `useAuth()` — same small external shape (`role`, `name`, `email`, `signup`, `login`, `logout`, …) so none of the Feed/Profile/Dashboard/etc. pages needed to change, but `login`/`signup` now hit the real backend.
- **Registration is dynamic, not per-role**: Signup posts to the existing generic `POST /auth/register` with `role: "student"` (backend already accepted any `UserRole` string — this was true before this change too, it just wasn't being used that way from Signup). Added `PROFESSIONAL` to `UserRole` (`backend/models/enums.py`) so the enum matches the 2-role signup model.
- **Fixed a real bug while unifying**: `AuthContext.login()` used to silently fall back to a fake mock session on *any* login failure, including a plain wrong password — so bad credentials never actually errored, they just logged you into a fabricated account. Now it only falls back when the backend is genuinely unreachable (a network error, not an `ApiError` response); a rejected login (wrong password, unknown email) correctly throws and the Login/Signup screens show it.
- **Verified end-to-end against the real Postgres DB**: registered a new student via `/auth/register`, confirmed a wrong password on `/auth/login` returns 400 (previously would have silently "succeeded"), confirmed the right password logs in, and confirmed `admin@parentlead.com` (seeded by `backend/seed.py`, already present in the dev DB) logs in with `role: "Admin"` through the same endpoint.
### Phase 1.7 — Real, Editable Profile + Proper Logout ✅ done
The Profile screen's "Account Setup" was previously flagged as a known local-only limitation (role/category changes didn't persist). That, plus the rest of the profile, is now fully real:
- **`users` table extended** (`backend/models/user.py`): `headline`, `about`, `category`, `qualification`, `experience`, `subjects` (JSON), `skills` (JSON), `current_institute`, `previous_institutes` (JSON), `profile_photo_url`, `cover_photo_url`, `resume_url` — all nullable, added via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` in `main.py`'s lifespan, same pattern as the existing Student/Mentor/Institute columns.
- **New `routers/profile.py`**: `GET /profile/me`, `PATCH /profile/me` (partial update — send only what changed), `POST /profile/me/upload` (multipart, `kind` = `photo` | `cover` | `resume`, 5MB cap, image-type-checked for photo/cover and PDF-checked for resume). Files are saved under `backend/uploads/{user_id}/` and served back at `/uploads/...` (mounted as static files in `main.py`).
- **`pages/ProfessionalProfile.jsx` rewritten** as a single route with an internal 4-tab layout (Overview, Experience & Skills, Resume & Contact, Account Setup) instead of spreading profile concerns across cards/pages — every field is a live input bound to the real profile, with a Save Changes button per tab and inline tag editors for Subjects/Skills/Previous Institutes. Cover and profile photo are click-to-upload tiles right on the header card; Account Setup's role/category buttons save immediately (no separate Save step) since flipping account type is a single atomic action, not a form.
- **Proper logout, not just a client-side token drop**: JWTs now carry a `jti` claim (`core/security.py`); a new `revoked_tokens` table (`backend/models/revoked_token.py`) records logged-out `jti`s until their natural expiry; `core/deps.py`'s auth dependency rejects any request bearing a revoked `jti`; `POST /auth/logout` is what actually revokes it. `AuthContext.logout()` is now async and calls it before clearing local state. Verified end-to-end: login → logout → reusing the same (still unexpired) token now correctly gets 401 instead of continuing to work.
- Account type (Professional/Student) and category selection, chosen in the Account Setup tab, now call `PATCH /profile/me` directly and take effect immediately — the earlier "local-only, doesn't persist" limitation no longer applies.

### Phase 2 — Data Model & Backend (next)
- Design new/updated tables: `Page` (institute page), `PageAdmin`, `Opportunity` (type: admission/job, shared or split tables), `Follow`, `Like`, `Recommendation`, `SearchUnlock`/credit ledger, `Referral`
- Migrate/relabel `Mentor` → `Professional` where applicable; migrate `Institute` model into `Page` + `PageAdmin`
- OTP + Google login integration

### Phase 3 — Integration
- Wire remaining prototype UI (Institute Page, Search Connections, Purchased History, feed posts) to real APIs, replace mock data
- Credit purchase / payment flow
- Excel export, CRM webhook/push
- Ranking/"push to top" logic, reputation score calculation, follower/like/recommendation counts (currently mocked on Feed/Profile's stat cards)

### Phase 4 — Migration & Cutover
- Decide how existing Institute/Mentor/Student accounts map into the new model
- Rollout plan, staged release, client UAT sign-off

---

## 5. Prototype Design Decisions

The client spec (Section 2) describes *screens and fields*; it doesn't prescribe a page-to-page navigation model. The first prototype pass built one page per feature with a flat sidebar menu — functionally complete, but it read like a spec checklist, not a network. Based on review feedback, it was reworked to actually feel like LinkedIn:

**Auth split into Login vs. Signup, matching how real credentials work**
- **Login** (`/`) has no role selector — email/password only (+ OTP/Google buttons, non-functional placeholders), and is now the single login for every role including Admin (see Phase 1.6). Role is resolved server-side from the real account record and the frontend redirects accordingly.
- **Signup** (`/signup`) intentionally asks almost nothing — just name/phone/email/password. Account type (**I am Professional / I am Student**), professional category, and Institute Page creation all moved *out* of signup and into the Profile screen's "Account Setup" card, reached right after signup — mirrors how LinkedIn treats those as profile-completion steps, not signup fields. Every signup registers as `Student` on the backend today; upgrading to Professional in Account Setup is local-only until Phase 2 (see Phase 1.6's known limitation).

**One combined Feed as the common landing point after login**
- Every post type from the spec — Admission Open Notice, Job Vacancy, Expert Opinion (guess paper), "Looking for Job", "Looking for Admission" — normalizes into one shared post-card shape (`mockFeedPosts` / `feedPostPool`) and renders in a single reverse-chronological feed, the way LinkedIn mixes job posts, articles, and updates in one stream instead of separate inboxes per type.
- 3-column LinkedIn layout: left = profile rail (mini profile card, recently viewed, admissions closing soon), center = composer + feed, right = pages-to-follow, trending topics, "who's hiring". Role determines what the composer offers (Student only sees "Looking for Admission"; Professional sees all five post types) and what the profile rail links to (Professional gets "My Institute Page"; Student doesn't).
- Detail screens (Institute Page, post-a-notice forms, Search Connections, etc.) are reached *from* the feed (via post CTAs, profile-rail links, or the "Me" menu) rather than sitting as siblings in a flat menu — mirrors how LinkedIn treats most pages as destinations you arrive at from the feed, not a persistent nav list.

**Feed feels alive, not static**
- Infinite scroll: an `IntersectionObserver` on a sentinel at the bottom of the post list loads more posts (from `feedPostPool`) with a spinner, capped at 24 posts with a "You're all caught up" end state.
- Auto-refresh: a countdown banner above the composer ("Live feed · next update in Ns") ticks down and prepends a new post automatically when it hits zero, briefly highlighting it as "New."
- Notification bell in the top nav (visible on every prototype screen, not just the feed): red unread-count badge, a dropdown of notifications, and the same live-simulation pattern — a new notification arrives on a timer, briefly appears as an auto-dismissing toast near the bell, and increments the badge.
- All of the above is timer/`IntersectionObserver`-driven client state for demo purposes only — Phase 2/3 replaces it with real data (actual new posts/notifications from the backend), at which point the "live" feel comes from real activity instead of a mock pool cycling on an interval.

---

## 6. Where things live in the repo

**Frontend (`frontend/src/`)**
- `App.jsx` — `/` (unified Login, all roles) and `/signup` are public; `/feed`, `/profile`, `/dashboard`, `/search`, `/purchased`, `/create-page`, `/page*` live under `layouts/AppLayout.jsx` (session-gated, redirects to `/` if not signed in); `/admin/*` lives under `layouts/AdminLayout.jsx` (redirects to `/` if not signed in, to `/feed` if signed in but not admin) — no separate admin login page
- `layouts/AppLayout.jsx` — top nav (search bar, Home/Search/Dashboard, notification bell, "Me" menu) for every Professional/Student screen
- `context/AuthContext.jsx` — the one real, backend-authenticated session (`login`, `register`, `logout`, `switchRole`), used by both Admin and everyone else now
- `context/useSession.js` — thin adapter over `AuthContext`'s `useAuth()`, giving Feed/Profile/Dashboard/etc. the same small surface (`role`, `name`, `email`, `profile`, `profilePhotoUrl`, `coverPhotoUrl`, `resumeUrl`, `signup`, `login`, `updateProfile`, `uploadFile`, `logout`) — `profile` is the real user record (all the fields below), `updateProfile`/`uploadFile` PATCH/upload to the real backend
- `pages/Login.jsx`, `pages/Signup.jsx` — the two auth entry points, both against the real backend
- `pages/Feed.jsx` — the common post-login dashboard
- `pages/ProfessionalProfile.jsx` — single route, 4 internal tabs (Overview / Experience & Skills / Resume & Contact / Account Setup), fully editable, click-to-upload cover/profile photo and resume
- `pages/CreateInstitutePage.jsx`, `InstitutePage.jsx`, `PostAdmissionNotice.jsx`, `PostJobVacancy.jsx`, `ProfessionalDashboard.jsx`, `SearchConnections.jsx`, `PurchasedHistory.jsx` — feature screens (still mock data — see Phase 3)
- `pages/mockData.js` — institute/page data, feed post pool, notification pool, search results, purchased history (no longer holds auth/profile data — that's real now, see `useSession`)
- `pages/admin/*`, `layouts/AdminLayout.jsx` — untouched by the earlier deletion pass; now also share the same login page as everyone else
- `context/DataContext.jsx` — refactored to Admin-only concerns (institutes/students/mentors listing, notifications); the referral-lead marketplace it used to drive was removed
- `Api/Api.js` — auth (incl. `logoutApi`), geo, `/register/*`, `/admin/*`, `/profile/*` (`fetchMyProfile`, `updateMyProfile`, `uploadProfileFile`), plus `resolveAssetUrl()` for turning `/uploads/...` paths into absolute URLs and a dedicated `apiUpload()` for multipart requests

**Backend (`backend/`)**
- `routers/`: `auth.py` (incl. `/logout`), `register.py`, `admin_data.py`, `geo.py`, `profile.py`
- `models/`: `user.py` (now carries all Professional Profile fields), `enums.py`, `student.py`, `mentor.py`, `institute.py`, `enquiry.py`, `revoked_token.py`
- `models/enums.py` — `UserRole` now includes `PROFESSIONAL`, alongside `ADMIN`/`STUDENT` (current model) and legacy `MANAGER`/`AGENT`/`MENTOR`/`INSTITUTE` (still used by Admin-provisioned accounts via `/register/mentor`, `/register/institute`)
- `core/security.py` — `create_access_token` now embeds a `jti`; `core/deps.py` rejects revoked ones
- `uploads/` (gitignored, created at startup) — uploaded photos/resumes, served at `/uploads/{user_id}/...`
- `main.py` — router wiring trimmed to match, mounts `/uploads`; `seed.py` still bootstraps the admin account (`admin@parentlead.com`, confirmed present in the dev DB)

**Docs**
- `docs/EDUCATION_NETWORK_ROADMAP.md` (this file)
