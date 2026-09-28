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

export const COURSE_CATEGORIES_BY_TYPE = {};

/** Category names offered to a given institute type. Unknown type -> []. */
export function courseCategoriesFor(type) {
  return Object.keys(COURSE_CATEGORIES_BY_TYPE[type] || {});
}

/** Subcategories under one category of one institute type. */
export function courseSubcategoriesFor(type, category) {
  return COURSE_CATEGORIES_BY_TYPE[type]?.[category] || [];
}

export const COURSE_CATEGORIES = [];

export const COURSE_LEVELS = [];

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
