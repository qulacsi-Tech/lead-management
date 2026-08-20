# Connectedus — Phase 2: Backend Foundation, Data Model & Secure Ownership

**Date:** 2026-08-21
**Scope:** Backend. The frontend was not rewired (that is Phase 3); the only frontend change is the P0 authentication fix, which could not be left in place.
**Predecessors:** [Integration Audit](CONNECTEDUS_INTEGRATION_AUDIT_2026-08-20.md) · [Phase 1 Report](PHASE_1_UI_AND_OWNERSHIP_2026-08-21.md)

---

## 1. Security Fixes

### P0-1 — Offline authentication forgery (removed)

`AuthContext.login()` previously fabricated a session whenever the backend was
unreachable, with the role guessed from the email string:

```js
const determinedRole = requestedRole || (email.includes('admin') ? 'admin' : 'student');
const mockToken = JSON.stringify({ access_token: `mock-${Date.now()}`, user: mockUser });
setToken(mockToken);   // same localStorage key a real JWT uses
```

Anyone could reach `/admin` by logging in with an email containing "admin" while
the API was down or blocked. Two supporting paths made it worse: session restore
fell back to `JSON.parse(token)` on a locally-forged token, and `register()`
swallowed backend errors before attempting login.

**All three removed.** Login now propagates failure, a stored token is only
trusted after `/auth/me` confirms it, and registration errors surface. There is
no code path left that produces a session the server did not issue.

### P0-2 — Unauthenticated role provisioning (blocked)

`/api/register/mentor` and `/api/register/institute` had no auth check at all,
despite the product describing both as admin-provisioned. Anyone could
self-promote by calling the API directly.

Both now require an authenticated Main Admin. They also no longer return a JWT
for the created account — handing the caller a session for someone else's
account is itself a privilege leak — they return the created user record.

Verified live:

```
POST /api/register/institute  (no auth)          -> 401
POST /api/register/mentor     (no auth)          -> 401
POST /api/register/mentor     (normal user)      -> 403
POST /api/register/institute  (institute admin)  -> 403
POST /api/register/mentor     (Main Admin)       -> 200
```

### P0-3 — Server-side ownership (new)

Ownership was previously decided in the browser against a bundled JS array.
It is now a database relationship (`page_admins`) checked against the JWT-derived
user in `core/authz.py`. Nothing is read from a request body — not role, not
user id, not page ownership.

---

## 2. Database Changes

### Reconciliation before creating anything

The live database was inspected first, and it did **not** match the ORM models.
Eight tables exist with no model at all — leftovers from commit `aa2e498` — several holding rows:

| Orphan table | Rows | Verdict |
|---|--:|---|
| `job_postings` | 0 | **Not reusable** for Opportunity — mentor-scoped (`mentor_id`), models a mentor advertising availability, not an institute posting a vacancy |
| `mentor_follows` | 1 | **Not reusable** for Follow — student→mentor, not user→page |
| `papers`, `paper_questions`, `paper_attempts` | 1/2/1 | Unrelated legacy (guess papers) |
| `leads`, `lead_activities`, `lead_tasks` | 0 | Unrelated legacy (original CRM) |

Plus four drift columns on `users` (`qualification`, `experience`,
`current_institute`, `previous_institutes`) removed from the model but never
dropped from the database.

Nothing was destroyed. All of it is excluded from Alembic autogenerate via
`LEGACY_UNMANAGED_TABLES` / `LEGACY_UNMANAGED_COLUMNS` in `alembic/env.py` —
otherwise every future `--autogenerate` would propose dropping them.

### Entity audit

| Entity | Existing model | Existing table | Existing data | Reuse? |
|---|---|---|---|---|
| Page | none | none | — | **Create.** `institutes` is a 1:1 account record with no slug/media/multi-admin — a different concept, kept separate |
| PageAdmin | none | none | — | **Create** |
| Opportunity | deleted `aa2e498` | `job_postings` (unrelated shape) | 0 | **Create fresh**, not restored verbatim — predates Page and the Draft/Published lifecycle |
| Follow | deleted `aa2e498` | `mentor_follows` (wrong target) | 1 | **Create fresh** |
| Notification | none | none | — | **Create** |
| Credit ledger | none | `institutes.credits` int only | 2 rows | **Create ledger**; column left as a cache for the legacy screen |
| Enquiry (page) | `enquiries` = different concept | `enquiries` | 1 | **Create `page_enquiries`.** `enquiries` is a marketplace Buy Lead (state+course, no institute); a page enquiry is addressed to one institute. Same word, different entity |

### Migrations

Alembic introduced. `main.py` no longer touches the schema — the 24 ad-hoc
`ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements are gone, replaced by a
fail-fast check.

| Revision | Contents |
|---|---|
| `0001` | Baseline: the pre-Phase-2 schema, so a fresh database can be built from zero |
| `0002` | Phase 2: 8 new tables. Purely additive — no existing table altered or dropped |

`backend/migrate.py` detects empty / pre-Alembic / already-managed databases and
does the right thing for each. A pre-Alembic database is **stamped**, never
recreated.

### New tables

| Table | Key relationships | Indexes / constraints |
|---|---|---|
| `pages` | `created_by → users` | unique `slug`; indexes on slug, city, state |
| `page_admins` | `page_id → pages` CASCADE, `user_id → users` CASCADE | **unique (page_id, user_id)**; composite (user_id, page_id) |
| `courses` | `page_id → pages` CASCADE | composite (page_id, status) |
| `opportunities` | `page_id → pages` CASCADE, `course_id → courses` SET NULL | composite (page_id, type, status) |
| `page_enquiries` | `page_id → pages` CASCADE, `user_id → users` SET NULL, `course_id → courses` SET NULL | composite (page_id, status) |
| `follows` | `user_id → users` CASCADE, `page_id → pages` CASCADE | **unique (user_id, page_id)** |
| `notifications` | `user_id → users` CASCADE | composite (user_id, is_read) |
| `credit_transactions` | `user_id → users` CASCADE, `page_id → pages` SET NULL | composite (user_id, created_at) |

### Migration validation

- **Fresh database** → `upgrade head` → 16 tables → application starts ✅
- **Existing development database** → stamp + upgrade → **all data intact** (12 users, 2 students, 1 mentor, 2 institutes, 1 enquiry, 13 revoked tokens) ✅
- **`downgrade base` → `upgrade head`** round-trips cleanly ✅

---

## 3. API Inventory

31 new endpoints. Every mutation runs authentication → role → resource ownership → validation → business logic → database.

| Method | Endpoint | Role required | Owner |
|---|---|---|---|
| POST | `/api/pages` | Main Admin | Platform |
| GET | `/api/pages` | Main Admin | Platform |
| GET | `/api/pages/mine` | Any signed-in | User |
| GET | `/api/pages/slug/{slug}` | **Public** | Public read |
| GET | `/api/pages/{page_id}` | Page Admin | Institute |
| PATCH | `/api/pages/{page_id}` | Page Admin* | Institute |
| DELETE | `/api/pages/{page_id}` | Main Admin | Platform |
| GET | `/api/pages/{page_id}/admins` | Page Admin | Institute |
| POST | `/api/pages/{page_id}/admins` | **Main Admin** | Platform |
| DELETE | `/api/pages/{page_id}/admins/{user_id}` | **Main Admin** | Platform |
| GET | `/api/pages/{page_id}/courses` | Public (drafts hidden) | Institute |
| POST · PATCH · DELETE | `/api/pages/{page_id}/courses[/{id}]` | Page Admin | Institute |
| GET | `/api/pages/{page_id}/courses/{course_id}` | Public if Published | Institute |
| GET | `/api/pages/{page_id}/opportunities` | Public (drafts hidden) | Institute |
| POST · PATCH · DELETE | `/api/pages/{page_id}/opportunities[/{id}]` | Page Admin | Institute |
| POST | `/api/pages/{page_id}/opportunities/{id}/push-to-top` | Page Admin | Institute |
| GET | `/api/opportunities` | Public | Public feed |
| POST | `/api/pages/{page_id}/enquiries` | **Public** (anonymous allowed) | User → Institute |
| GET | `/api/pages/{page_id}/enquiries` | Page Admin | Institute |
| PATCH | `/api/pages/{page_id}/enquiries/{id}` | Page Admin | Institute |
| GET | `/api/enquiries/all` | Main Admin | Platform oversight |
| POST · DELETE | `/api/pages/{page_id}/media` | Page Admin | Institute |
| GET | `/api/follows` | Any signed-in | User |
| POST · DELETE | `/api/follows/{page_id}` | Any signed-in | User |
| GET | `/api/notifications` | Any signed-in | User |
| GET | `/api/notifications/unread-count` | Any signed-in | User |
| POST | `/api/notifications/{id}/read` · `/read-all` | Any signed-in | User |
| GET | `/api/credits/me` | Any signed-in | User |
| GET | `/api/credits/{user_id}` | Main Admin | Platform |
| POST | `/api/credits/grant` | Main Admin | Platform |

\* `type`, `slug` and `is_enabled` are platform-owned and rejected for Page Admins even on their own page.

---

## 4. Authorization Model

```
Main Admin  (users.role = "Admin")
     └── require_main_admin
            → create/delete pages, assign & revoke page admins,
              platform vocabularies, credit grants, cross-institute oversight

Institute Admin  (a row in page_admins, NOT a user role)
     └── require_page_admin(page_id)
            → exactly the page(s) assigned to them:
              profile & media, courses, notices, vacancies, enquiries

Normal User  (any authenticated account)
     └── get_current_active_user
            → own profile, own follows, own notifications, own credits,
              submitting enquiries
```

Being an Institute Admin is a **relationship, not a role** — a user's `role`
stays Professional/Student, and page administration is granted per page. That
avoids a second RBAC system alongside the existing role column, and it means one
person can administer several institutes without any role gymnastics.

All of it lives in `core/authz.py`; no router re-implements an ownership check.

### The subtle guard

`assert_belongs_to_page()` closes the case that a page-level check alone misses:

```
PATCH /api/pages/{page_I_own}/courses/{course_I_do_not_own}
```

The page-admin check passes — the caller genuinely administers that page — and
without a second check the handler would happily edit another institute's
course. This is covered by a dedicated test.

---

## 5. Data Ownership Matrix

| Entity | Owner | Created by | Editable by | Readable by |
|---|---|---|---|---|
| Page (identity: type, slug, enabled) | Platform | Main Admin | Main Admin only | Public |
| Page (content: tagline, media, about) | Institute | Main Admin | Page Admin, Main Admin | Public |
| PageAdmin | Platform | Main Admin | Main Admin only | Page Admins |
| Course | Institute | Page Admin | Page Admin | Public when Published; drafts to Page Admins |
| Opportunity | Institute | Page Admin | Page Admin | Public when Published |
| Page media | Institute | Page Admin | Page Admin | Public |
| PageEnquiry | Created by enquirer, worked by institute | Anyone (auth optional) | Receiving Page Admin | Receiving Page Admin; Main Admin read-only |
| Follow | User | User (self only) | User (self only) | Aggregate counts public |
| Notification | User | System | Recipient (mark read) | Recipient only |
| Credit transaction | User | Main Admin / system | Nobody — append-only | Owner; Main Admin |
| Profile | User | User | User | As permitted |

---

## 6. Multi-Tenant Isolation Test — **21/21 passing**

`backend/tests/test_isolation.py`, run with `py -m pytest tests/ -v`. Two
institutes, two admins, one platform admin, one normal user, on a throwaway
SQLite database.

**Admin A can** read/edit Institute A, create its courses, notices and
vacancies, read its enquiries, and sees only Institute A in `/pages/mine`.

**Admin A cannot** — every one returns 403/404 from the server:

| Attempt | Result |
|---|---|
| Read Institute B's management view | 403 |
| Edit Institute B | 403 |
| Create a course or vacancy on Institute B | 403 |
| Delete Institute B's course | 403 |
| Read Institute B's enquiries | 403 |
| **Pair own page with B's course id** | 404 — and B's course verified unchanged |
| **Assign themselves as admin of Institute B** | 403 |
| Change `slug`/`type`/`is_enabled` on their own page | 403 |
| Delete their own page | 403 |

**Normal user cannot** mutate institute content, create pages, list all pages,
read platform enquiries, or grant credits. **Unauthenticated** requests to
protected routes return 401.

Also verified: draft courses are hidden from the public but visible to the
owner; an enquiry is visible only to the receiving institute; one user cannot
read or mark-read another's notifications; follows are scoped to the
authenticated user with no endpoint accepting a `user_id`; the credit balance
derives from the ledger and overspend returns 402.

### Confirmed live against Postgres

```
Main Admin creates institute + assigns admin   -> 201, slug auto-generated
Assigned admin  GET page / POST course         -> 200 / 201
Unrelated user  GET page / POST course         -> 403 / 403
Unrelated user  self-assign as admin           -> 403
Public, no auth GET /pages/slug/{slug}         -> 200
```

---

## 7. File Upload Architecture

Audited before adding anything. The existing profile-photo/resume upload was the
only mechanism; rather than build a second one, it was extracted into
`core/storage.py` and both now share it:

```
UploadFile
  → validate MIME + size (5MB)
  → write  uploads/{scope}/{owner_id}/{kind}-{rand}{ext}
  → return /uploads/{scope}/{owner_id}/{kind}-{rand}{ext}
  → caller stores that URL on its own column
  → served by the StaticFiles mount in main.py
```

`scope` (`users` / `pages`) keeps namespaces apart. `owner_id` always comes from
an already-authorized object — for page media, the `Page` returned by
`require_page_admin` — so a caller cannot write into another owner's directory.
Pre-Phase-2 uploads at `uploads/{user_id}/` keep working, since stored URLs are
absolute from `/uploads`.

---

## 8. Phase 3 Wiring Map

The Phase 1 mapping is preserved and now has real endpoints behind it.

| Component | Current mock source | New API | Expected response |
|---|---|---|---|
| `InstituteContext` | `pagesAdministeredBy()` | `GET /api/pages/mine` | `PageResponse[]` |
| `InstitutePage` (public) | `findPageBySlug()` | `GET /api/pages/slug/{slug}` | `PageDetailResponse` incl. `is_page_admin`, `is_following` |
| `InstitutePageEditor` | `Object.assign(page,…)` | `PATCH /api/pages/{id}` + `POST /api/pages/{id}/media` | `PageResponse` |
| `CreateInstitutePage` / `admin/ManagePages` | `addPage()` | `POST /api/pages` | `PageDetailResponse` |
| `admin/ManagePages` admin modal | `assignPageAdmin()` | `POST`/`DELETE /api/pages/{id}/admins` | `PageAdminResponse[]` |
| `ManageCourses` | `page.courses`, `upsertCourse()` | `GET/POST/PATCH/DELETE /api/pages/{id}/courses` | `CourseResponse[]` |
| `ManageOpportunities` | `page.opportunities`, `upsertOpportunity()` | `…/opportunities` + `/push-to-top` | `OpportunityResponse[]` |
| `InstituteEnquiries` | `enquiriesForPage()`, `updateEnquiry()` | `GET/PATCH /api/pages/{id}/enquiries` | `PageEnquiryResponse[]` |
| `InstitutePage` EnquiryModal | `addEnquiry()` | `POST /api/pages/{id}/enquiries` | `PageEnquiryResponse` |
| `Feed` | `mockFeedPosts`, `feedPostPool` | `GET /api/opportunities?following_only=true` | `OpportunityResponse[]` |
| `useFollows` | `localStorage` | `GET/POST/DELETE /api/follows` | `FollowResponse` |
| `AppLayout` NotificationBell | `notificationPool` timer | `GET /api/notifications` | `NotificationResponse[]` |
| `SearchConnections` credits | hardcoded `1240` | `GET /api/credits/me` | `CreditBalanceResponse` |

Still to build in Phase 3+: search over profiles, the credit-gated unlock flow
(`enquiry_unlocks` remains orphaned), and the Buy Lead side.

---

## 9. Status After Phase 2

| Dimension | After Phase 1 | After Phase 2 |
|---|---:|---:|
| Frontend UI | ~97% | ~97% (unchanged by design) |
| Admin UI | ~90% | ~90% (unchanged by design) |
| Backend API | 20% | **~80%** |
| Database | 25% | **~85%** |
| Frontend↔API wiring | 18% | 18% — **Phase 3** |
| Authorization | 20% | **~90%** |
| **Overall** | ~40% | **~65%** |

The server is now the source of truth. The frontend still reads its mock layer
and will keep working until Phase 3 rewires it component by component.

---

## 10. Known Gaps Carried Forward

- **Wiring is untouched by design** — the UI still runs on `mockData.js`.
- **`enquiry_unlocks` is still orphaned.** The ledger exists and can record an
  unlock, but no endpoint spends credits against an enquiry yet — that is the
  Buy Lead marketplace, Phase 4.
- **Legacy tables and drift columns are excluded, not resolved.** Eight tables
  and four columns are held harmless pending an explicit decision.
- **`institutes.credits` still exists** alongside the ledger. Treated as a cache
  for the legacy admin screen; retire it when that screen is rewired.
- **Notification delivery is not implemented** — rows are written and readable,
  but nothing pushes or emails. Deliberate: Phase 2 was the persistence
  foundation.
- **`PROJECT_NAME` still says "ParentLead Management API"** and the seeded admin
  is `admin@parentlead.com`. Cosmetic, but it should be renamed before anything
  client-facing.
