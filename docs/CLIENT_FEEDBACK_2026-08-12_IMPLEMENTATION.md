# Feedback Implementation Summary — 12 Aug 2026 batch

This document maps each item from your 12 Aug feedback to what's been built, where to see it in the app, and where it lives in the codebase. Everything below is live on the `main` branch.

---

## 1. Role-based system — paused

**Your ask:** One kind of login, one kind of profile update — no Professional/Student split for now, so there's no confusion. Bring it back later if needed.

**What's built:** Every signed-in user now sees the same Feed, the same Dashboard tabs, and the same navigation — the Professional/Student distinction no longer changes what's shown anywhere. The "I am Professional / Student" toggle is removed from the Profile screen.

**Where to see it:**
- Home feed: `/feed`
- Dashboard: `/dashboard`

**Files:**
- `frontend/src/pages/Feed.jsx`
- `frontend/src/pages/ProfessionalDashboard.jsx`
- `frontend/src/layouts/AppLayout.jsx`
- `frontend/src/pages/ProfessionalProfile.jsx`

**Note:** This is reversible — the underlying account fields for role/category still exist on the backend, they're just not driving the UI right now.

---

## 2–4. Profile supports any career path (not education-only)

**Your ask:** A person's career doesn't have to be entirely in education (e.g. B.Com → FMCG job → MBA → Teacher). The Profile should reflect that — with education fields that reveal progressively (10th → 12th → optional Graduation → optional Post-Graduation), and a repeatable Work Experience list (Are you currently working? → Company, Designation, Dates, Location, Industry → Add Another Experience).

**What's built:**
- **Education**: 10th Passing Year → (once filled) 12th Passing Year → (once filled) a Yes/No choice for Graduation → if Yes, College/University + Course + Passing Year → then a Yes/No choice for Post-Graduation, same pattern. Nothing beyond 12th is required.
- **Work Experience**: an "Add Another Experience +" list. Each entry has Company, Designation, Industry, Location, Joining Date, Leaving Date, and a "Currently working here" checkbox. Any industry, not just education.

**Where to see it:**
- Profile → Experience & Skills tab: `/profile`

**Files:**
- `frontend/src/pages/ProfessionalProfile.jsx` (Education and Work Experience editors)
- `backend/models/user.py` (`education`, `work_experience` fields)
- `backend/routers/profile.py` (save endpoint)

---

## 5. Institute Landing Page — "Select & Fill" builder

**Your ask:** Institutes shouldn't have to write their own page content. Give them predefined options to select and numbers to fill in, and auto-generate the paragraph/cards/layout — About Us, Why Choose Us (pick 6 of ~25), Key Highlights (pick + fill a number), Facilities (checkbox + detail), Campus Life, Achievements, all from a reusable template.

**What's built:** A new "Edit Page" screen with 7 sections, each using your select-and-fill approach:
- **Main** — Institute Name, Tagline, and 2–3 banner image uploads
- **About Us** — fill in Established Year / Students / Faculty / Programs / Campus Area, and the paragraph is generated automatically (Years of Excellence is calculated from the Established Year, as you suggested)
- **Why Choose Us** — pick from the list of value-proposition points, renders as cards
- **Key Highlights** — pick the relevant ones (Faculty Members, Placement Rate, Alumni, etc.) and fill in your number for each
- **Facilities** — check what's available (Hostel, Library, Labs, Sports, etc.) and fill in the detail for each
- **Campus Life** — pick what applies (Cultural Festivals, Sports Meet, etc.)
- **Achievements & Placement** — Highest Placement, Average Placement, Placement Rate, Recruiters — rendered as stat cards

Everything selected here shows up automatically on the public Institute Page.

**Where to see it:**
- Edit the page: `/page/edit`
- Public page (with your selections rendered): `/page`

**Files:**
- `frontend/src/pages/InstitutePageEditor.jsx` (the builder)
- `frontend/src/pages/pageBuilderContent.js` (the predefined option lists — this is what you'd add to if you want more/different options)
- `frontend/src/pages/InstitutePage.jsx` (public page rendering)

**Needs your review:** the "Campus Life" option list (12 items) was written without a specific example from you — worth checking it matches what you had in mind.

---

## 6. Landing page ↔ marketplace connection

**Your ask:** A floating "Submit Enquiry" button that stays visible while scrolling, opening a form with no marketplace branding shown (institute's own identity only). Course + Specialization selectable both on the page and in the form. New User (Name/Email/Mobile/OTP/State/City) vs Existing User (recognized, lighter submit) paths. A top-level "who is this page for" selection, and a conditional Affiliation field (Board for Schools, different for Colleges, not applicable for Coaching/University).

**What's built:**
- A floating "Submit Enquiry" button, fixed in place on the right side of the Institute Page, stays visible on scroll
- Clicking it opens a form showing only the institute's own name/logo — no platform branding anywhere in the popup
- Course and Specialization selects appear both directly on the page (a "Quick Enquiry" widget) and inside the form
- **New User** path: Full Name, Email, Mobile, OTP verification, State, City
- **Existing User** path: enter your registered mobile number, the system recognizes you and shows a one-click "Submit my application"
- Institute type selection already existed at page-creation time (School/Coaching/College/University/Training Institute); it now also drives a conditional **Affiliation** field — School asks for a Board (CBSE/ICSE/State Board/IB/Other), College asks for the affiliating university, Coaching/Training Institute/University show "not applicable"

**Where to see it:**
- Public Institute Page: `/page` (floating button + Quick Enquiry widget)
- Institute type + Affiliation: `/create-page`

**Files:**
- `frontend/src/pages/InstitutePage.jsx` (floating button, enquiry modal, Quick Enquiry widget)
- `frontend/src/pages/CreateInstitutePage.jsx` (conditional Affiliation field)
- `frontend/src/pages/mockData.js` (course/specialization options, demo "existing user" record)

**Not built:** Theme selection (the closing line in your message). This needs a bit more detail from you before it can be scoped — color/branding only, or different page layouts to choose from?

---

## What's still front-end only (not connected to a real backend yet)

Everything in Sections 5 and 6 above (Institute Page, the builder, the enquiry form) currently runs on local demo data in the browser — it looks and works fully, but isn't saved to a server yet. Login, Signup, and the Profile screen (Sections 1–4) *are* fully connected to the real backend and persist for real. Connecting the Institute Page side to a real backend is planned as a later phase — happy to talk through timing whenever you'd like.
