# Lead Management — Flow Design

A React + Vite single-page app (react-router, Tailwind, Context API). Three role-based portals — **Student**, **Mentor**, **Institute** — share one login screen. No backend exists: everything below the login form is client-side mock state.

## 1. Route / navigation tree

```
/ (App.jsx)
└── AuthProvider (role, displayName — in-memory only, no persistence)
    └── BrowserRouter
        ├── /login  → Login.jsx
        │     • Role picker: Student | Mentor | Institute
        │     • Tab: Email+Password  |  Mobile+OTP
        │     • On submit: fake 600ms delay → login(role, name) → navigate(/role)
        │     • No real auth call, no validation beyond "non-empty", no signup page
        │
        ├── /student  (RequireRole "student") → StudentLayout
        │     ├── index            → Dashboard.jsx
        │     ├── profile          → StudentCareerProfile.jsx
        │     ├── roadmap          → AICareerRoadmap.jsx
        │     ├── post-lead        → PostLead.jsx      (refer a friend → earn points)
        │     └── practice-tests   → PracticeTests.jsx
        │
        ├── /mentor  (RequireRole "mentor") → MentorLayout
        │     ├── index              → Dashboard.jsx
        │     ├── profile             → MentorProfile.jsx
        │     ├── practice-tests      → MentorPracticeTests.jsx
        │     └── post-opportunity    → PostOpportunity.jsx  (post job / college referral)
        │
        ├── /institute  (RequireRole "institute") → InstituteLayout
        │     ├── index        → Dashboard.jsx
        │     ├── profile       → InstituteProfile.jsx
        │     └── buy-leads     → BuyLeads.jsx   (discover & "purchase" student leads)
        │
        └── *  → redirect to /login
```

`RequireRole` only checks client-side context state — reloading the page wipes `role`, so every protected route bounces back to `/login` on refresh.

## 2. The intended business flow (as far as the UI implies it)

```
STUDENT                         MENTOR                        INSTITUTE
───────                         ──────                        ─────────
1. Refer a friend          2. Post a job / college       3. Search & "buy"
   (PostLead.jsx)             referral                      student leads
   → OTP-verify mobile        (PostOpportunity.jsx)          (BuyLeads.jsx)
   → lead saved to                                           → spend "credits"
     LOCAL state only                                          to unlock profile
   → status: pending                                         → update lead
     → (nothing ever                                            status manually
        makes it "verified")

        ⇣ intended handoff, but no shared store exists ⇣

   Lead created here  ──────X (no connection)──────►   Lead expected here
```

Each page invents **its own hard-coded lead list** (`initialLeads` in `PostLead.jsx`, `initialLeads`/`initialCandidates` in `BuyLeads.jsx`). A lead a student "submits" never reaches the mentor or institute screens — they're three independent mock datasets, not one flow.

## 3. What's missing

### No backend / persistence layer
- Zero `fetch`/`axios`/API calls anywhere in `src/`.
- No database, no server, no `.env`, no API client module.
- All "submit" actions (`PostLead`, `PostOpportunity`, `BuyLeads` unlock/status-update) just do `setTimeout(...)` + local `useState` mutation. Refresh the page → gone.

### No real authentication
- `AuthContext` stores `role`/`displayName` in memory only — no token, no session, no `localStorage`/cookie.
- `Login.jsx` accepts **any** email/password or mobile/OTP; nothing is verified against a backend.
- OTP flows (login page + PostLead mobile verify) are fully fake — no SMS provider, code is never checked against anything sent.
- "Forgot password" and "Sign up as a new student" are dead links (`href="#"`).
- No logout-triggered redirect guard beyond the in-memory flag; no "remember me" persistence despite the checkbox existing.

### No shared data model connecting the three roles
- Student-submitted leads, mentor-posted opportunities, and institute-purchasable candidates are three separate hard-coded arrays — there's no single `Lead` entity flowing between them.
- "Verified" status for a lead is never actually set anywhere (no verification workflow/admin action exists).
- Institute's "credits" balance (1,240) and per-candidate cost are static numbers — no wallet, no payment/purchase transaction, no ledger.
- Mentor's job posting and institute's lead discovery don't intersect at all, despite the UI implying a marketplace.

### No role-crossing views
- A student can't see whether their referred lead was picked up by an institute.
- An institute "unlocking" a profile or "updating status" doesn't notify/appear anywhere on the student or mentor side.
- No admin/ops role to verify leads, approve mentor job posts, or moderate content.

### Missing pages implied by the UI itself
- Signup flow (referenced on Login page, not built).
- Password reset flow (referenced, not built).
- "Download Report" button (PostLead) — no export logic.
- "View Full Leaderboard" / "View Full History" / "View Impact Analytics" — all dead-end buttons with no destination.
- Practice test *taking* flow — dashboards reference practice tests, but no test-attempt/scoring page exists (only list/management-style pages).

### No cross-cutting infrastructure
- No form validation library — every form hand-rolls minimal checks (e.g., `!f.name || !f.mobile`), several fields (city, notes) are optional with no validation at all.
- No error boundary, no toast/notification system for success/failure feedback beyond inline text.
- No loading/empty/error states for data that would come from a real API.
- No tests (no `*.test.*` files found) and no CI config.

## 4. Net picture

This is a **UI-only prototype / design mockup**: navigation, layout, and role-based screens are fully fleshed out with polished Tailwind styling, but there is no backend, no auth, no persistence, and — most importantly — no wiring between the three portals that would make it an actual *lead management* system. The "flow" a viewer expects (student refers → gets verified → mentor/institute discovers → purchases → status updates → student sees points) is **implied by copy and layout but not implemented**; each screen fakes its own slice of it independently.
