// ---------------------------------------------------------------------------
// PLATFORM-OWNED taxonomy — the controlled vocabularies Main Admin governs and
// Institute Admins pick from but cannot extend.
//
// These are configuration, not sample records: they ship with the app rather
// than coming from the API, and every screen (admin or institute) reads the
// same list so platform-wide search and filtering stay possible.
// ---------------------------------------------------------------------------

export const INSTITUTE_TYPES = ['School', 'Coaching', 'College', 'University', 'Training Institute'];

export const AFFILIATION_OPTIONS = {
  School: ['CBSE', 'ICSE', 'State Board', 'IB', 'NIOS'],
  College: ['Devi Ahilya Vishwavidyalaya', 'RGPV', 'AICTE Approved', 'UGC Recognised'],
  University: ['UGC', 'AICTE', 'NAAC A++', 'NAAC A+'],
  Coaching: [],
  'Training Institute': [],
};

// ---------------------------------------------------------------------------
// Course categories & subcategories, scoped by institute type
//
// Client feedback 22 Sep 2026, row 4: "Just like you created separate sections
// for Affiliation & accreditation under types and categories for school &
// colleges, please create a similar structure for courses as well — there
// should be separate course categories and sub categories for school, college
// & universities."
//
// So this deliberately mirrors AFFILIATION_OPTIONS above: keyed by institute
// type first, because a category list that is right for a School ("Senior
// Secondary") is nonsense for a Coaching centre ("NEET UG"), and offering both
// lists to both is what produced the type-agnostic dropdowns the client
// flagged. Each type maps category -> [subcategory, ...].
// ---------------------------------------------------------------------------

export const COURSE_CATEGORIES_BY_TYPE = {
  School: {
    'Pre-Primary': ['Playgroup', 'Nursery', 'LKG', 'UKG'],
    'Primary (I-V)': ['Class I', 'Class II', 'Class III', 'Class IV', 'Class V'],
    'Middle (VI-VIII)': ['Class VI', 'Class VII', 'Class VIII'],
    'Secondary (IX-X)': ['Class IX', 'Class X'],
    'Senior Secondary (XI-XII)': [
      'Science (PCM)',
      'Science (PCB)',
      'Commerce',
      'Arts / Humanities',
      'Vocational',
    ],
  },
  Coaching: {
    'Engineering Entrance': ['JEE Main', 'JEE Advanced', 'BITSAT', 'State CET'],
    'Medical Entrance': ['NEET UG', 'NEET PG', 'AIIMS / JIPMER'],
    'School / Board Preparation': ['Foundation (Class 6-8)', 'Class 9-10 Board', 'Class 11-12 Board'],
    'Government & Competitive Exams': [
      'UPSC / State PSC',
      'SSC',
      'Banking (IBPS / SBI)',
      'Railway (RRB)',
      'Police / Defence (NDA / CDS)',
    ],
    'Management & Law Entrance': ['CAT / MAT / CMAT', 'CLAT', 'IPMAT'],
    'Commerce & Professional': ['CA Foundation / Inter', 'CS', 'CMA'],
    'Other Entrance Exams': ['CUET', 'NTSE / Olympiad', 'GATE', 'Teaching (CTET / TET)'],
  },
  College: {
    'Engineering & Technology': ['B.Tech / B.E.', 'M.Tech / M.E.', 'Diploma in Engineering', 'B.Arch', 'BCA', 'MCA'],
    'Medical & Health Sciences': [
      'MBBS',
      'BDS',
      'BAMS / BHMS',
      'B.Sc Nursing',
      'B.Pharm / M.Pharm',
      'Physiotherapy (BPT)',
      'Paramedical',
    ],
    'Management & Commerce': ['BBA', 'MBA / PGDM', 'B.Com', 'M.Com', 'CA / CS / CMA'],
    Science: ['B.Sc', 'M.Sc', 'B.Sc (Agriculture)', 'Biotechnology'],
    'Arts & Humanities': ['BA', 'MA', 'Journalism & Mass Communication', 'Fine Arts (BFA)', 'Social Work (BSW / MSW)'],
    Law: ['LLB', 'BA LLB', 'LLM'],
    Education: ['B.Ed', 'M.Ed', 'D.El.Ed', 'B.P.Ed'],
  },
  University: {
    'Engineering & Technology': ['B.Tech / B.E.', 'M.Tech / M.E.', 'B.Arch', 'MCA'],
    'Medical & Health Sciences': ['MBBS', 'BDS', 'B.Sc Nursing', 'B.Pharm / M.Pharm', 'Physiotherapy (BPT)'],
    'Management & Commerce': ['BBA', 'MBA / PGDM', 'B.Com', 'M.Com'],
    Science: ['B.Sc', 'M.Sc', 'Biotechnology', 'Environmental Science'],
    'Arts & Humanities': ['BA', 'MA', 'Journalism & Mass Communication', 'Fine Arts (BFA)'],
    Law: ['BA LLB', 'LLM'],
    Education: ['B.Ed', 'M.Ed'],
    'Doctoral & Research': ['Ph.D', 'M.Phil', 'Post-Doctoral Fellowship'],
    'Distance & Online': ['Online Degree Programme', 'Distance Education', 'Online Certificate'],
  },
  'Training Institute': {
    'IT & Software': [
      'Full Stack Development',
      'Data Science & AI',
      'Cloud & DevOps',
      'Cyber Security',
      'Software Testing',
    ],
    'Design & Multimedia': ['Graphic Design', 'UI/UX Design', 'Animation & VFX', 'Video Editing'],
    'Digital Marketing': ['SEO & SEM', 'Social Media Marketing', 'Content Marketing'],
    'Finance & Accounting': ['Tally & GST', 'Advanced Excel', 'Financial Modelling'],
    'Language & Communication': ['Spoken English', 'IELTS / TOEFL', 'Personality Development', 'Foreign Languages'],
    'Skill & Vocational': ['ITI Trades', 'Beauty & Wellness', 'Hospitality & Tourism', 'Fashion Designing'],
  },
};

/** Category names offered to a given institute type. Unknown type -> []. */
export function courseCategoriesFor(type) {
  return Object.keys(COURSE_CATEGORIES_BY_TYPE[type] || {});
}

/** Subcategories under one category of one institute type. */
export function courseSubcategoriesFor(type, category) {
  return COURSE_CATEGORIES_BY_TYPE[type]?.[category] || [];
}

/**
 * Every category across every type, de-duplicated.
 *
 * Kept because the course catalogue (ManageCourses) still presents one flat
 * list; the per-type map above is the source of truth and this is derived from
 * it, so the two can never drift apart.
 */
export const COURSE_CATEGORIES = [
  ...new Set(Object.values(COURSE_CATEGORIES_BY_TYPE).flatMap((byCategory) => Object.keys(byCategory))),
];

export const COURSE_LEVELS = ['Foundation', 'Intermediate', 'Advanced', 'Crash Course', 'Certification'];

export const PLATFORM_LOCATIONS = ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Pune', 'Nagpur'];

/** Lifecycle shared by Admission Notices and Job Vacancies (Sell Leads). */
export const OPPORTUNITY_STATUSES = ['Draft', 'Published', 'Expired', 'Closed'];

export const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Visiting Faculty'];

export const PROFESSIONAL_CATEGORIES = [
  'School Teacher',
  'Coaching Faculty',
  'College Professor',
  'Guest Faculty',
  'Mentor',
  'Trainer',
  'Tuition Teacher',
];

/** URL-safe slug from a display name. Mirrors the backend's `slugify`. */
export function slugify(name) {
  return (name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
