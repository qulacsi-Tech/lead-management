# Education Professional Network — Roadmap & Requirements

Status: **UI prototype in progress** (static, no backend). Existing product (lead-management-complete) is untouched and continues to run as-is.

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

### Phase 1 — UI Prototype (current phase)
- Build a **static, backend-free** prototype of every screen above, using mock/local data only
- Lives in a separate route (`/prototype`) inside the existing frontend, isolated from existing role-based routes/layouts (`/student`, `/mentor`, `/institute`, `/admin`) — zero risk to the live product
- Goal: get client sign-off on flows, fields, and layout before any backend investment
- Out of scope for this phase: real auth, real data persistence, payments/credit purchase, actual file upload/export, CRM integrations

### Phase 2 — Data Model & Backend (after client approval)
- Design new/updated tables: `Page` (institute page), `PageAdmin`, `Opportunity` (type: admission/job, shared or split tables), `ProfessionalProfile` extensions (skills, resume, current/previous institute, reputation fields), `Follow`, `Like`, `Recommendation`, `SearchUnlock`/credit ledger, `Referral`
- Decide fate of existing CRM Lead subsystem
- Migrate/relabel `Mentor` → `Professional` where applicable; migrate `Institute` model into `Page` + `PageAdmin`
- OTP + Google login integration

### Phase 3 — Integration
- Wire prototype UI to real APIs, replace mock data
- Credit purchase / payment flow
- Real file upload (resume, logo, cover), Excel export, CRM webhook/push
- Ranking/"push to top" logic, reputation score calculation

### Phase 4 — Migration & Cutover
- Decide how existing Institute/Mentor/Student accounts map into the new model
- Rollout plan, staged release, client UAT sign-off

---

## 5. Where things live in the repo

- Roadmap: `docs/EDUCATION_NETWORK_ROADMAP.md` (this file)
- Prototype UI: `frontend/src/pages/prototype/*`, layout at `frontend/src/layouts/PrototypeLayout.jsx`, mock data at `frontend/src/pages/prototype/mockData.js`
- Route: `/prototype` (added in `frontend/src/App.jsx`), not gated by role/auth — for internal + client review only
- Existing product: untouched
