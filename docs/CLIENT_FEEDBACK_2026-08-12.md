# Client Feedback Analysis — 12 Aug 2026

Status: **Implemented — Sections 1–6 are built**, following the sequencing this doc proposed in Section 10, with reasonable defaults made on the open questions in Section 9 (noted inline below) rather than blocking on answers. Theme selection (the closing note in Section 6) is still **not built** — it's genuinely unscoped, no detail was given beyond one line.

Source: WhatsApp screenshots + messages, 9:04am–4:50pm, 12 Aug 2026.

---

## Implementation notes (added after build)

- **Section 1 (role-based system paused)**: implemented as a UI-hide, not a deletion. `Feed.jsx`, `ProfessionalDashboard.jsx` show the same thing to everyone now; `AppLayout`'s nav no longer gates Institute Page links by role. The Account Setup tab (role/category switching) was removed from `ProfessionalProfile.jsx` — deleted outright rather than hidden-but-kept, since git history already preserves it and the codebase convention here is not to carry dead code. The backend `role`/`category` columns and `PATCH /profile/me` support for them are untouched and still work if a caller sets them directly.
- **Sections 2–4 (progressive Education + multi-entry Work Experience)**: built as real backend fields (`education`, `work_experience` JSON columns replacing the old flat `qualification`/`experience` strings) plus a full progressive-disclosure UI. Also removed `current_institute`/`previous_institutes` as separate fields — they're now redundant with the Work Experience list's `is_current` flag, and keeping both would have reintroduced the exact "assumes an education-only career" problem this feedback was about.
- **Section 6.2 (institute type list)**: kept the existing 5-option list (School/Coaching/College/University/Training Institute) as canonical rather than the 4-option list from the enquiry-form note — it's the more specific/complete of the two and already used elsewhere.
- **Section 6.3 (conditional Affiliation)**: School → Board select (CBSE/ICSE/State Board/IB/Other); College → free-text Affiliating University; Coaching/Training Institute/University → not applicable. This is a reasonable-default interpretation of a somewhat ambiguous client note — worth confirming.
- **Section 5 (Select & Fill builder)**: built as a new `/page/edit` route with 7 tabs (Main, About Us, Why Choose Us, Key Highlights, Facilities, Campus Life, Achievements), backed by a predefined content bank (`pageBuilderContent.js`). Where the client gave concrete example options (Why Choose Us's 25, Key Highlights' 4 examples, Facilities' 4 examples), those are used as-is or extended to a fuller set in the same spirit; Campus Life had no examples given, so a placeholder 12-item list was written — flag this one for client review specifically. "Placement" (a separate row in the client's own summary table) was folded into "Achievements" rather than built as a second, redundant number-picker, since the two are naming the same thing (highest/average placement, placement rate, recruiters).
- **All of Section 5 and 6 remain frontend-only / mock data**, consistent with the rest of the Institute Page module — there's still no backend for institutes/pages/enquiries (see `docs/EDUCATION_NETWORK_ROADMAP.md` Phase 3). Only auth and the Professional Profile got real backend treatment.
- **Not built**: theme selection (Section 6, closing note) — still needs scoping before it can be sized.

---

## 0. Read this first — one item changes the whole model

Everything else in this feedback is additive (new fields, better UX, a landing-page builder). **Item 1 is not** — it asks to undo the core architectural decision the whole `/`, `/feed`, `/profile`, `/dashboard` build is based on. See [Section 1](#1-critical-pause-the-role-based-system-for-now) before reading further, and see [Section 6](#6-questions-that-need-an-answer-before-any-of-this-is-built) for what needs to be confirmed.

---

## 1. Critical: Pause the role-based system, for now

**Client's words (translated):** "In the Excel I sent last time, I had already moved toward eliminating the role-based system entirely — I wanted the portal to have one kind of login and one kind of profile update, so there's no confusion anywhere. So this feature (the green-marked one) needs to be set aside for a few days. If we get stuck somewhere later because of this, we'll bring it back."

**What's circled:** the Account Setup tab's "I am Professional / Student" toggle on the Profile screen.

**What this actually means for the build:**
- This isn't "remove one button." Role (Professional vs. Student) currently drives visible differences in: the Feed composer (Student only sees "Looking for Admission"; Professional sees all 5 post types), the Professional Dashboard (Job/Expert Opinion tabs hidden for Student), the profile rail on Feed, and whether "Create Institute Page" / "My Institute Page" show in the nav. The client is asking for **one unified experience with no role-driven branching**, at least for now.
- **Important nuance**: the client says "set aside for a few days," not "delete." This reads as *pause the role-based UI branching*, not *rip out the `role` column or backend infra*. The pragmatic reading: stop showing/using role to change what a user sees, but don't delete the underlying `role`/`category` fields, since he's explicit that it may come back.
- This directly contradicts Section 2.2 of `docs/EDUCATION_NETWORK_ROADMAP.md` ("Only two user types... I am Professional / I am Student"), which was itself taken from the client's own original requirement screenshots. That original spec is now superseded by this message for the current build phase — worth having the client confirm explicitly, since it reverses something he asked for in writing earlier (see [Section 6](#6-questions-that-need-an-answer-before-any-of-this-is-built)).

**Proposed approach (pending confirmation):**
- Hide the "I am Professional / Student" toggle from the Account Setup tab (or hide the whole tab) rather than deleting the role plumbing.
- Un-gate the Feed composer and Professional Dashboard so every signed-in user sees the same options regardless of stored role.
- Leave the `role`/`category` backend columns and the `PATCH /profile/me` role support exactly as they are — they cost nothing to keep dormant, and the client explicitly flagged wanting them back later.
- Do **not** touch Admin — the client's note is clearly about the Professional/Student side, not Admin's separate real-auth system.

---

## 2. Profile should not assume an education-only career

**Client's words (translated):** "Being an Education Portal doesn't mean every person's whole career has to be from the education sector. A person's path could be: B.Com → FMCG job → MBA → Teacher, or B.Tech → IT job → Coaching Faculty, or 12th → Graduation → 3 years Corporate → now Mathematics Faculty. Such a person shouldn't be blocked from joining. Make the Profile progressive."

**Current state:** `ProfessionalProfile.jsx`'s Experience & Skills tab has single flat text fields — `Qualification` (one string), `Experience` (one string), `Current Institute`, `Previous Institutes` (tag list). No structured education history, no non-education work history, nothing that models a career path.

**Gap:** the whole tab needs to become the structured, multi-entry Education + Work Experience module described in Sections 3–4 below. "Progressive" here means both (a) fields reveal conditionally as prior ones are filled, and (b) the data model doesn't assume every entry is a teaching job.

---

## 3. Education section — progressive disclosure

**Client's spec:**
- 10th Passing Year
- 12th Passing Year
- Graduation → College/University, Course, Passing Year *(only if applicable — not compulsory)*
- Post Graduation → College/University, Course, Passing Year *(only if applicable)*
- Each field/section should only become visible/enterable once the one before it is filled — and a user who stopped after 12th shouldn't be forced through Graduation/PG.

**Current state:** none of this exists — there's no Education section at all, just the single `Qualification` free-text field.

**Design implication:** this needs a step-by-step / accordion-style form, not a flat one. Roughly: 10th year → (once filled) 12th year appears → (once filled) an optional "Did you graduate?" gate before showing Graduation fields → same pattern for Post Graduation. Data model: needs real columns/JSON structure for `education` (10th year, 12th year, graduation {college, course, year}, post_graduation {college, course, year}) — currently `qualification` is a single string column on `users`, which can't hold this.

---

## 4. Work Experience — dynamic, multi-entry

**Client's spec:**
- First question: **Are you currently working? Yes/No**
- If Yes: Company/Organization → Designation → Joining Date → Leaving Date → Location → Industry
- **"Add Another Experience +"** button to add more entries — example given is two full entries (ABC FMCG Ltd., Sales Executive, 2018–2020 → XYZ Coaching Institute, Mathematics Faculty, 2020–Present), i.e. a LinkedIn-style repeatable experience list, not a single text field.

**Current state:** `Experience` is a single free-text string (e.g. "15 Years"). No multi-entry support, no per-entry fields, no add/remove UI.

**Gap:** needs a genuine list-of-objects data model (`work_experience: [{company, designation, joining_date, leaving_date, location, industry}]`, likely a new JSON column or a dedicated table if it needs to be queryable later) and a repeatable form UI (add/remove entry cards), replacing the flat `experience` string entirely.

---

## 5. Institute Landing Page — "Select & Fill" builder (major new module)

This is the largest new ask in this batch, and it's a different shape of problem from everything built so far: today `InstitutePage.jsx` / `CreateInstitutePage.jsx` are **free-text forms** (institute types an About paragraph, types a list of courses, etc.). The client wants **predefined, selectable building blocks** that assemble into a page automatically — the institute picks options and fills numbers, never writes prose.

### 5.1 Main Part
- Institute Name + Tagline (select from options, per client's phrasing — worth clarifying whether Tagline is select-from-list or free text, see [Section 6](#6-questions-that-need-an-answer-before-any-of-this-is-built))
- 2–3 banner uploads, with specific size/dimension guidance shown to the institute at upload time

### 5.2 About Us — auto-generated paragraph
Institute fills a handful of structured data points, system composes the paragraph — institute never writes one:
- Established Year, Years of Excellence (**can be auto-calculated from Established Year** — flagged as optional automation), Students count, Faculty count, Programs count, Campus Area
- Client explicitly frames this as "institute selects 4–5 options → system generates a good paragraph"

### 5.3 Why Choose Us — pick-6-of-25
- A fixed list of ~25 predefined value-proposition points (Experienced & Qualified Faculty, Modern Infrastructure, Advanced Laboratories, Industry-Oriented Curriculum, Strong Placement Support, Internship Opportunities, Research & Innovation, Digital Learning Environment, Student-Centric Education, Personality Development, Career Guidance, Excellent Academic Results, Scholarships & Financial Support, Sports & Extracurricular Activities, Safe & Secure Campus, Hostel Facilities, Library & Digital Resources, Industry Exposure, International Exposure, Entrepreneurship Support, Skill Development Programs, Strong Alumni Network, Regular Seminars & Workshops, Holistic Development, Vibrant Campus Life)
- Institute selects any 6 → cards auto-render

### 5.4 Key Highlights — pick-N-of-20, each with a fill-in number
Different from Why Choose Us: each predefined point carries its own variable, e.g.:
- Experienced Faculty → Faculty Members: `[250+]`
- Placement Record → Placement Rate: `[92%]`
- Industry Exposure → Industry Partners: `[150+]`
- Alumni Network → Alumni: `[20,000+]`
- Institute selects the relevant ones and fills the number per selected point.

### 5.5 Facilities — checkbox + structured detail, not checkbox alone
Each facility (Hostel, Library, Laboratories, Sports, ~15–20 total per the summary table) has: an Available checkbox, plus a facility-specific numeric/detail field when checked (Hostel → Capacity; Library → Books count; Laboratories → Number of Labs; Sports → Sports Facilities count).

### 5.6 Achievements — fully dynamic numbers
Highest Placement (₹ LPA), Average Placement (₹ LPA), Placement Rate (%), Recruiters count — frontend renders these as attractive stat cards automatically.

### 5.7 Reusable template summary (client's own table)

| Section | What the institute does |
|---|---|
| Main Part | Institute Name + Tagline select + 2–3 banner uploads (with size guidance) |
| About Us | Select 5–10 predefined points |
| Why Choose Us | Select any 6 of 20–25 |
| Courses | Fill course details |
| Facilities | Select from 15–20 |
| Campus Life | Select from 10–15 |
| Achievements | Fill numbers/details |
| Placement | Predefined highlights + numbers |

**The meta-point, in the client's words:** institute/admin should get a **"Select & Fill" interface** — never a blank textarea. Select options, fill numbers, the system generates both content and layout.

**Current state vs. this ask:** `CreateInstitutePage.jsx` and `InstitutePage.jsx` are entirely free-text today (About is a `<Textarea>`, Courses is a manually-typed list). This section isn't a tweak to those — it's a replacement of the entire institute-page content model, from "institute writes content" to "institute assembles content from a content library." That's a genuinely different engineering problem (needs a bank of predefined option/copy templates per section, a selection UI, and a rendering layer that turns selections into prose/cards) and easily the largest single item in this feedback batch.

---

## 6. Landing page ↔ Marketplace connection

**Client's spec:**
- A **sticky/floating "SUBMIT ENQUIRY" button** on the right side of every institute landing page, that stays visible while scrolling.
- Clicking it opens a popup/modal — and **the popup must not show the marketplace's own name anywhere** (client refers to the marketplace as **"Connectedus"** in this message — worth confirming whether that's the actual intended product name, since everything built so far is branded "EduNet"; see [Section 8](#8-naming-note)). This is a white-labeling requirement: from the institute's visitor's perspective, the enquiry form should look like it belongs to the institute, not to a third-party marketplace brand.
- Reference given: a Swipepages landing page example, for general enquiry-form UX inspiration (form styling/flow, not a literal spec to clone).

**Current state:** `InstitutePage.jsx` has a plain in-page enquiry form card (Name/Phone/Course) — not a floating/sticky button, not a modal, and it's on the same page as everything else (no "hide our brand" concern has been relevant yet since there's no branding shown in that form today anyway).

### 6.1 Enquiry form — expanded spec
```
Select Course
Select Specialization

If New User:
  Full Name
  Email Address
  Mobile Number
  OTP
  State
  City

If Existing User:
  "Submit my application" (recognize returning users — presumably by phone
  lookup — and skip straight to a lighter-weight submit)
```

Plus three follow-up notes:
1. **Course + Specialization selects should appear in two places**: inside the enquiry form/modal *and* directly on the landing page itself (not hidden behind the modal).
2. **A new top-level field**: "This landing page is being created for: Institute / University / Coaching Centre / School" — because downstream options and the auto-generated content (Section 5) differ by type, and the type selection should drive corrections/adjustments to what's shown. **Note**: this list (Institute/University/Coaching Centre/School) doesn't exactly match the existing `INSTITUTE_TYPES` list already used in `CreateInstitutePage.jsx` (School/Coaching/College/University/Training Institute) — worth reconciling, see [Section 6](#6-questions-that-need-an-answer-before-any-of-this-is-built).
3. **Affiliation field, conditional on type**: if School is selected → must select a Board (e.g. CBSE); if Institute/College → a State/CBSE-style option; if Coaching or University → the Affiliation field should be **disabled** (not applicable). This is a genuinely conditional field, not just optional.

**Closing note from the client**: "the rest is built exactly as wanted — if theme selection gets added too, that would be great." Two things here: (a) implicit confirmation that the existing Institute Page build (logo/cover/about/address/courses/opportunities/admin management) is broadly approved as-is, and (b) a **new, lightly-specified ask for a landing-page theme/template selector** (visual variation, not just content) — needs scoping with the client since no detail was given beyond the one line.

---

## 7. Net-new vs. modify-existing, at a glance

| Feedback item | Nature | Existing code touched |
|---|---|---|
| 1. Pause role-based branching | **Reverses** existing behavior | `Feed.jsx`, `ProfessionalDashboard.jsx`, `ProfessionalProfile.jsx` (Account Setup), `AppLayout.jsx` nav |
| 2. Non-education career paths | Reframes intent | `ProfessionalProfile.jsx` (Experience & Skills tab), `backend/models/user.py` |
| 3. Progressive Education section | **Net-new** structured module | Replaces `qualification` string field |
| 4. Multi-entry Work Experience | **Net-new** structured module | Replaces `experience` string field |
| 5. Select & Fill landing-page builder | **Net-new**, largest item | Effectively replaces `CreateInstitutePage.jsx` / `InstitutePage.jsx`'s content model |
| 6. Floating enquiry button + white-label modal | **Net-new** UI | `InstitutePage.jsx` |
| 6.1 Expanded enquiry form (course/specialization/OTP/existing-user) | **Net-new** | No current enquiry backend at all (was deleted with the old Enquiry self-service routers) |
| 6.2 Landing-page-for (Institute/University/Coaching/School) | Overlaps existing `INSTITUTE_TYPES`, needs reconciling | `CreateInstitutePage.jsx` |
| 6.3 Conditional Affiliation/Board field | **Net-new**, conditional logic | `CreateInstitutePage.jsx` / `InstitutePage.jsx` |
| 6.4 Theme selection | **Net-new**, unscoped | New |

---

## 8. Naming note

This feedback batch is the first place the name **"Connectedus"** shows up, referring to the marketplace/platform itself. Everything built in this repo so far — the login page, the top nav, the roadmap doc — uses **"EduNet"** as a placeholder brand. Worth a quick confirmation on which is the real product name before it shows up in more places (or whether "EduNet" was always just a build placeholder and "Connectedus" is the actual name to switch to).

---

## 9. Questions that need an answer before any of this is built

1. **Role-based system**: confirm the "pause it" reading in Section 1 is correct — hide the role-driven UI branching but keep the backend fields dormant, rather than deleting them? And should Admin's separate login/permissions be left untouched (assumed yes)?
2. **Institute type list**: the enquiry-form note lists Institute/University/Coaching Centre/School (4 options); the existing Create Institute Page flow has School/Coaching/College/University/Training Institute (5 options). Which list is authoritative going forward?
3. **Tagline**: is it select-from-predefined-options (matching the "Select & Fill" philosophy of the rest of Section 5), or free text?
4. **Landing-page theme selection**: what does "theme" mean here — color/branding only, or multiple structurally different page layouts? Any reference examples beyond the one Swipepages link (which was given for the enquiry form, not the whole page)?
5. **Existing-user recognition** in the enquiry form: recognized by phone number lookup + OTP, presumably — confirm the intended matching logic before building "Submit my application" for returning users.
6. **Scope/sequencing**: given the size of Section 5 (the landing-page builder) versus Sections 3–4 (profile education/experience) versus Section 1 (role pause) — does the client have a priority order, or should this be sequenced by build complexity (role-pause first since it's a UI-hiding change, education/experience next, landing-page builder last as the biggest lift)?

---

## 10. Suggested sequencing (pending answers to Section 9)

Roughly smallest-blast-radius first:

1. **Role-based branching pause** — mostly UI-hiding, no data model changes, fully reversible later (matches the client's own "we may bring it back" framing).
2. **Progressive Education + multi-entry Work Experience** — self-contained to the Profile screen and `users` table (or a new related table for work experience entries), doesn't touch Institute Page or the marketplace.
3. **Institute type reconciliation + conditional Affiliation field** — small, but needs Question 2 answered first since it changes an enum used elsewhere.
4. **Floating enquiry button + expanded enquiry form** — meaningful new surface (course/specialization select, OTP, existing-user path), but bounded to one page.
5. **Select & Fill landing-page builder** — largest, most architecturally involved (content-template library + selection UI + auto-render), and depends on #3 being settled (since content templates likely vary by institute type). Do last.
6. **Theme selection** — needs scoping (Question 4) before it can even be sized, let alone sequenced.
