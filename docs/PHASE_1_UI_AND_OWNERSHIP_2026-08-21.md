# Connectedus — Phase 1: Missing UI + Admin Ownership Hierarchy

**Date:** 2026-08-21
**Scope:** Frontend only. No backend models, APIs, or database work — as specified.
**Predecessor:** [CONNECTEDUS_INTEGRATION_AUDIT_2026-08-20.md](CONNECTEDUS_INTEGRATION_AUDIT_2026-08-20.md)

---

## 0. Pre-Implementation Classification

### A. Already complete — kept as-is, not rebuilt

| Screen | Status |
|---|---|
| `Feed.jsx` | UI COMPLETE — DATA WIRING PENDING |
| `ProfessionalProfile.jsx` | COMPLETE + backend-wired (the one real end-to-end module) |
| `ProfessionalDashboard.jsx` | UI COMPLETE — DATA WIRING PENDING |
| `SearchConnections.jsx` | UI COMPLETE — filters are placeholders, wiring pending |
| `PurchasedHistory.jsx` | UI COMPLETE — DATA WIRING PENDING |
| `Login.jsx` / `Signup.jsx` | COMPLETE |
| `admin/Dashboard.jsx` | COMPLETE |
| `admin/ManageEnquiries.jsx` | COMPLETE (copy clarified only) |
| Marketplace / My Network tab | UI COMPLETE — DATA WIRING PENDING |
| `pageBuilderContent.js` option banks | Correct as static platform config |

### B. Partial — targeted work only

| Screen | What was missing |
|---|---|
| `admin/ManagePages.jsx` | No slug control, no admin assignment, no enable/disable, no admin column |
| `admin/ManageInstitutes/Students/Mentors.jsx` | Add + View modals never opened (`isOpen` vs `open` defect) |
| `InstitutePage.jsx` | No structured course section, no gallery, no social links, enquiry went nowhere |
| `InstitutePageEditor.jsx` | No contact, social or gallery tabs; resolved its page by email rather than context |
| `AdminLayout.jsx` | Flat nav with no platform/accounts/oversight distinction |
| `Sidebar.jsx` | No grouped-navigation or context-header support |
| `AppLayout.jsx` / `Feed.jsx` | Offered institute management links to users who administer nothing |

### C. Genuinely missing — built

Institute Admin console (layout + context + 5 screens), platform taxonomy management, course CRUD, notice/vacancy lifecycle management, institute enquiry workflow, shared table/empty-state/status primitives.

---

## 1. UI Completion

### Previously missing → implemented

| Area | File | What it does |
|---|---|---|
| Institute Admin shell | `layouts/InstituteAdminLayout.jsx` | Dedicated console with grouped nav, institute identity block, multi-page switcher, "not assigned" state |
| Institute context | `context/InstituteContext.jsx` | Resolves *which* institute is being managed; client-side stand-in for the future `PageAdmin` table |
| Institute overview | `pages/institute/InstituteDashboard.jsx` | Counts, recent Sell Leads, course summary, page-completeness checklist, assigned admins |
| Course management | `pages/institute/ManageCourses.jsx` | Full CRUD, Draft/Published lifecycle, specializations, admissions-open flag, search + filter, detail modal |
| Admission Notices | `pages/institute/ManageOpportunities.jsx` (`type="admission"`) | Create/edit/publish/expire/delete, course association, push-to-top, All/Draft/Published/Expired/Closed tabs |
| Job Vacancies | `pages/institute/ManageOpportunities.jsx` (`type="job"`) | Same lifecycle + department, employment type, location, salary, skills, apply-before |
| Institute enquiries | `pages/institute/InstituteEnquiries.jsx` | List, filter, detail, status workflow (New → Contacted → Responded → Closed), response log |
| Platform taxonomy | `pages/admin/PlatformTaxonomy.jsx` | Institute types, course categories, levels, locations, affiliations per type |
| Profile/Branding tabs | `pages/InstitutePageEditor.jsx` | Added **Contact & Social** and **Gallery** tabs to the existing builder |
| Public course section | `pages/InstitutePage.jsx` | Course cards + detail modal that feeds the enquiry funnel |
| Public gallery | `pages/InstitutePage.jsx` | Gallery grid with captions; social links in Details |
| Shared primitives | `components/ui/DataTable.jsx`, `EmptyState.jsx`, `StatusBadge.jsx` | One table shell, one empty state, one status vocabulary across both consoles |

### Bugs fixed along the way

1. **Modal defect (from the audit).** `Modal` reads `open`; three admin pages passed `isOpen` across six usages, so Add Institute / Add Student / Add Mentor and all three View Details panels never rendered. Fixed, and widened to 440px so the two-column forms fit.
2. **`Badge variant=` → `tone=`.** Eight usages passed a prop `Badge` doesn't read, so every status badge in the admin portal silently rendered neutral grey. Also corrected an invalid `secondary` tone to `tertiary`.
3. **Feed suggestion rail** filtered out "your own page" by hardcoded slug; now resolved from actual admin membership.

### Still missing (deliberately deferred)

- Real OTP verification flow (UI placeholder retained)
- Change-password screen (API exists, still unused)
- Credit ledger view — deferred to Phase 4 with the rest of the marketplace
- Notification management — deferred to Phase 4

---

## 2. Main Admin

**Existing:** Dashboard, institute/student/mentor account lists, platform-wide enquiry oversight, system settings.

**Added:**
- Institute creation now includes **page slug** (with live `connectedus.in/<slug>` preview and collision warning) and **Institute Admin assignment** in the same flow
- **Manage admins** modal per institute — assign, view role and assignment date, revoke
- **Enable/disable** an institute's public page
- Institute list now shows Location, assigned Institute Admin (or an `Unassigned` badge), content counts and page status
- **Types & Categories** screen for platform-owned vocabularies
- Sidebar regrouped: Overview / Platform / Accounts / Oversight, with a "Whole platform · Main Admin access" context header

**Remaining:** PATCH/DELETE of institute/student/mentor accounts still writes to localStorage only (no backend endpoint exists — Phase 2). Platform moderation of institute content is not built; Main Admin has oversight but is deliberately not the content owner.

---

## 3. Institute Admin

**Existing before:** nothing coherent — institute management was scattered across `/page`, `/page/edit`, `/page/post-admission`, `/page/post-job` inside user space, with no indication of which institute was being managed.

**Added:** a dedicated console at `/institute` with:

```
My Institute → Overview, Profile & Branding
Academic     → Courses
Admissions   → Admission Notices
Careers      → Job Vacancies
Leads        → Enquiries
```

The sidebar always names the institute being managed. A user administering several pages gets a switcher; one administering none gets an explanatory empty state rather than a broken screen. The old `/page/*` routes now redirect into the console, so existing links keep working.

**Remaining:** applications-received view for vacancies (Phase 4, needs the Buy Lead side); bulk course import.

---

## 4. User

**Existing:** feed, profile, dashboard, search, purchased history, network/marketplace, own Buy Leads (Looking for Job / Looking for Admission), desired criteria.

**Added:** the "My Institute Page" menu entry now appears only for users who actually administer a page, and points at the console; everyone else sees "Create Institute Page". The public Institute Page gained a course detail → enquiry path, and submitting an enquiry now records it against that institute so it appears in that institute's console.

**Remaining:** unchanged from the audit — none of the user-side modules gained or lost ownership in this phase, which was the intent.

---

## 5. Final Data Ownership Model

```
MAIN / PLATFORM ADMIN
   │
   ├── Institute/Page existence, type, slug, enable/disable
   ├── Institute Admin assignment & revocation
   ├── Platform taxonomy (types, categories, levels, locations, affiliations)
   ├── Account records (institutes, students, mentors)
   └── Platform-wide oversight (all enquiries, dashboard)
          │
          ▼
   INSTITUTE / PAGE ADMIN  ── manages exactly the page(s) assigned to them
          │
          ├── Profile & branding (tagline, logo, banners, about, facilities,
          │   campus life, achievements, highlights)
          ├── Contact details & social links
          ├── Gallery
          ├── Courses (create / edit / publish / unpublish / delete)
          ├── Admission Notices  ─┐
          ├── Job Vacancies      ─┴─ Sell Leads (Draft → Published → Expired/Closed)
          └── Enquiries received by this institute

CONNECTEDUS USER
   │
   ├── Own profile (education, experience, skills, resume, photo)
   ├── Buy Leads (Looking for Job / Looking for Admission)
   ├── Desired criteria
   ├── Follow / network relationships
   └── Enquiries they submit
```

**No duplicate ownership was created.** Main Admin establishes institutes and platform configuration; it does not manage any institute's courses, notices, vacancies or enquiry responses. Its enquiry screen is explicitly labelled oversight.

---

## 6. Components Ready for Phase 2 Backend Wiring

| Component | Expected data | Future API | Owner | Current source |
|---|---|---|---|---|
| `InstituteAdminLayout` / `InstituteContext` | pages the user administers | `GET /api/me/pages` | Platform (assignment) | `pagesAdministeredBy()` over `mockPages` |
| `InstituteDashboard` | page summary + counts | `GET /api/pages/{id}/summary` | Institute | `mockPages` |
| `ManageCourses` | course records | `GET/POST/PATCH/DELETE /api/pages/{id}/courses` | Institute | `page.courses` |
| `ManageOpportunities` (both types) | opportunity records | `GET/POST/PATCH/DELETE /api/opportunities?pageId=` | Institute | `page.opportunities` |
| `InstituteEnquiries` | enquiries for this page | `GET /api/pages/{id}/enquiries`, `PATCH /api/enquiries/{id}` | Institute | `mockInstituteEnquiries` |
| `InstitutePageEditor` | page content + gallery + socials | `PATCH /api/pages/{id}`, `POST /api/uploads/page-media` | Institute | live `mockPages` object |
| `InstitutePage` (public) | published courses + opportunities | `GET /api/pages/{slug}` | Institute | `publicCourses()` / `publicOpportunities()` |
| `InstitutePage` enquiry modal | enquiry submission | `POST /api/enquiries` | User → Institute | `addEnquiry()` |
| `admin/ManagePages` | institute list + admin assignment | `GET/POST/PATCH /api/pages`, `POST/DELETE /api/pages/{id}/admins` | Platform | `mockPages`, `assignPageAdmin()` |
| `admin/PlatformTaxonomy` | platform vocabularies | `GET/PUT /api/platform/taxonomy` | Platform | constants in `mockData.js` |

Every mutation now funnels through a named helper in `mockData.js` (`upsertCourse`, `removeCourse`, `upsertOpportunity`, `removeOpportunity`, `assignPageAdmin`, `removePageAdmin`, `addEnquiry`, `updateEnquiry`) rather than scattered inline object mutation — so Phase 2 replaces a handful of functions rather than hunting through components.

---

## 7. Data Model Changes (mock layer only)

Extended the existing `mockData.js` — no second mock architecture introduced.

- **Courses** promoted from `string[]` to records: `{ id, name, category, level, duration, fees, intake, eligibility, specializations[], description, status, admissionOpen, updatedAt }`
- **Opportunities** gained `status`, `publishedAt`, `courseId`, `applyUrl`, and for jobs `department`, `employmentType`, `location`, `salary`, `skills[]`
- **Pages** gained `gallery[]`, `socialLinks{}`, `enabled`, `createdAt`; admins gained `assignedAt`
- **New platform constants:** `AFFILIATION_OPTIONS`, `COURSE_CATEGORIES`, `COURSE_LEVELS`, `PLATFORM_LOCATIONS`, `OPPORTUNITY_STATUSES`, `EMPLOYMENT_TYPES`, `ENQUIRY_STATUSES`
- **New enquiry store:** `mockInstituteEnquiries` keyed by page slug

Legacy `MY_PAGE_SLUG` is gone entirely — no screen resolves ownership by hardcoded slug any more.

---

## 8. Verification

- `vite build` passes clean
- `oxlint src/` reports no errors (only pre-existing warnings)
- All new modules resolve through the dev server
- Removed: `PostAdmissionNotice.jsx`, `PostJobVacancy.jsx` (superseded by `ManageOpportunities`, routes redirect)

### Manual paths worth walking

1. **Main Admin:** `/admin/pages` → Create Institute (set slug, assign admin) → Manage admins → disable/enable page
2. **Institute Admin:** log in as an assigned admin → `/institute` → add a course → publish it → create an admission notice linked to it → see it on the public page
3. **User:** open any institute page → click a course → Enquire → submit → confirm it appears in that institute's `/institute/enquiries`
4. **Ownership:** open an institute you don't administer → confirm no management controls appear

---

## 9. Security Note Carried Forward

Everything above decides **what the UI offers**, not **what a server permits**. Ownership is still evaluated in the browser against a bundled JS array. The two gaps from the audit remain open and are Phase 2 work:

- `AuthContext` still issues a self-signed session (with a guessed role) when the backend is unreachable
- No server-side ownership check exists, because the write endpoints themselves don't exist yet

The value delivered here is that the ownership model is now *explicit and consistent* — so the Phase 2 backend has an unambiguous specification to enforce, rather than a UI that contradicts itself.
