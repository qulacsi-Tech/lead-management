// ---------------------------------------------------------------------------
// PLATFORM-OWNED ad copy — the predecided titles an institute picks from when
// publishing an Admission Notice, a Job Vacancy or a Guess Paper.
//
// Descriptions used to live here too. They moved to the backend
// (`ad_description_templates`, seeded by alembic 0009 with the same text) so
// the Main Admin can edit them — see hooks/useAdDescriptionTemplates.js.
//
// Client feedback 22 Sep 2026, row 5:
//   "Ad Notice title - in One Line (Select Any One) should be predecided"
//   "Ad description - 3 Line (Select Any One) - should be predecided"
//
// Titles are a *closed* list, not placeholders: the title field is a <select>
// over exactly these options with no free-text escape. That is the point of
// predeciding them — every ad on the platform reads in the same register and
// the same length, which is what free text was failing to do.
//
// Shape mirrors pageBuilderContent.js (the "Select & Fill" builder): options
// keyed by the section they belong to, so one import serves both the Platform
// Admin's editor (components/AdsTab.jsx) and the Institute Console
// (pages/institute/ManageOpportunities.jsx) and the two cannot drift.
//
// `{name}` is substituted with the institute's name at render/save time — see
// `fillAdTemplate` below. Nothing else is interpolated.
// ---------------------------------------------------------------------------

/** One-line headlines. `admission | job | paper`. */
export const AD_TITLE_OPTIONS = {
  admission: [
    'Admissions Open — Apply Now',
    'Admissions Open for the New Session',
    'Limited Seats Available — Enrol Today',
    'Early Bird Admissions Now Open',
    'New Batch Starting Soon — Register Now',
    'Last Date Approaching — Secure Your Seat',
    'Scholarship Admissions Open',
    'Direct Admission Available — Enquire Now',
  ],
  job: [
    'We Are Hiring — Apply Now',
    'Faculty Vacancy — Applications Invited',
    'Join Our Teaching Team',
    'Urgent Requirement — Experienced Faculty',
    'Multiple Teaching Positions Open',
    'Walk-in Interview — Apply Today',
    'Hiring Qualified Subject Experts',
    'Career Opportunity for Educators',
  ],
  paper: [
    'Free Guess Paper — Download Now',
    'Download Free Study Material',
    'Previous Year Question Paper — Free Download',
    'Important Questions — Free PDF',
    'Chapter-wise Notes — Download Free',
    'Complete Syllabus PDF — Download Now',
    'Sample Paper with Solutions — Free',
    'Revision Notes — Free Download',
  ],
};

/** Replaces `{name}` with the institute's name. The only substitution made. */
export function fillAdTemplate(template, instituteName) {
  if (!template) return '';
  return template.replaceAll('{name}', instituteName || 'our institute');
}

/**
 * The stored value may be a filled-in string from before this list existed, or
 * a template that no longer appears in it. Either way the <select> must still
 * show what is actually saved rather than silently snapping to the first
 * option, so callers append the current value when it is not a known one.
 */
export function withCurrent(options, current) {
  if (!current || options.includes(current)) return options;
  return [current, ...options];
}
