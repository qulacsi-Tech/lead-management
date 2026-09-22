// ---------------------------------------------------------------------------
// PLATFORM-OWNED ad copy — the predecided titles and descriptions an institute
// picks from when publishing an Admission Notice, a Job Vacancy or a Guess
// Paper.
//
// Client feedback 22 Sep 2026, row 5:
//   "Ad Notice title - in One Line (Select Any One) should be predecided"
//   "Ad description - 3 Line (Select Any One) - should be predecided"
//
// These are *closed* lists, not placeholders: the title and description fields
// are a <select> over exactly these options with no free-text escape. That is
// the point of predeciding them — every ad on the platform reads in the same
// register and the same length, which is what free text was failing to do.
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

/** Three-line bodies. Each entry is exactly three lines. */
export const AD_DESCRIPTION_OPTIONS = {
  admission: [
    'Admissions for the upcoming session are now open at {name}.\nExperienced faculty, proven results and a structured learning plan.\nSubmit an enquiry to check eligibility and reserve your seat.',
    'Seats are filling fast for the current admission cycle.\nChoose from our full range of courses with flexible batch timings.\nEnquire today and our admission team will guide you through the process.',
    'Begin your preparation with a team that has delivered consistent results.\nSmall batches, regular assessments and one-to-one doubt clearing.\nApply now — admission closes once the batch is full.',
    'Merit-based scholarships are available for eligible students this session.\nFee concessions are decided on past academic performance.\nSend an enquiry to know the scholarship criteria and last date.',
    'A new batch is starting shortly at {name}.\nComplete syllabus coverage, study material and test series included.\nRegister now to confirm your place in this batch.',
    'Admission is open across all streams and class levels.\nQualified faculty, modern infrastructure and a safe campus.\nContact us for the prospectus, fee structure and admission form.',
  ],
  job: [
    '{name} is hiring qualified and motivated teaching professionals.\nCompetitive salary, a supportive team and long-term growth.\nApply directly through this post — no separate form needed.',
    'We are looking for experienced faculty to join our academic team.\nThe role involves classroom teaching, assessment and student mentoring.\nApply now with your qualification and teaching experience.',
    'Applications are invited for teaching and academic staff positions.\nCandidates with relevant subject expertise are preferred.\nApply here — shortlisted candidates will be contacted for an interview.',
    'Join an institution that invests in its teachers.\nStructured induction, teaching resources and professional development.\nSubmit your application through this post to be considered.',
    'Multiple vacancies are open across subjects and departments.\nBoth full-time and visiting faculty positions are available.\nApply now and mention your subject and availability.',
    'A rewarding opportunity for educators who want to make an impact.\nWork with a committed academic team and motivated students.\nApply directly — we review every application we receive.',
  ],
  paper: [
    'Download this study material free of cost — no enquiry form required.\nPrepared by the faculty at {name} from the latest syllabus.\nUse it for revision, practice and self-assessment.',
    'This paper covers the important questions for the current exam pattern.\nQuestions are arranged chapter-wise for systematic revision.\nDownload the PDF and start practising today.',
    'Free and complete — solutions are included with every question.\nBased on previous years and the most recent examination trend.\nDownload now and check your preparation level.',
    'A quick-revision resource compiled by experienced subject teachers.\nCovers every key concept you need before the exam.\nDownload the PDF — no sign-up or payment needed.',
    'Practise with a paper that follows the real exam format and marking.\nAttempt it in exam conditions to judge your speed and accuracy.\nDownload it free and review the answer key afterwards.',
    'Complete notes for the full syllabus, in one downloadable file.\nWritten in simple language with diagrams and worked examples.\nDownload now and keep it handy through the session.',
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
