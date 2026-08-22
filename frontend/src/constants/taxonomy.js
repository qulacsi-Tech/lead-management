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

export const COURSE_CATEGORIES = [
  'Engineering Entrance',
  'Medical Entrance',
  'School Curriculum',
  'Commerce',
  'Competitive Exam',
  'Skill / Vocational',
  'Language',
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
