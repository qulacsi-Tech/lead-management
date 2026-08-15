// The "Select & Fill" content bank for the Institute Page builder — an
// institute picks from these predefined options instead of writing prose.
// See docs/CLIENT_FEEDBACK_2026-08-12.md, Section 5.

export const WHY_CHOOSE_US_OPTIONS = [
  'Experienced & Qualified Faculty',
  'Modern Infrastructure',
  'Advanced Laboratories',
  'Industry-Oriented Curriculum',
  'Strong Placement Support',
  'Internship Opportunities',
  'Research & Innovation',
  'Digital Learning Environment',
  'Student-Centric Education',
  'Personality Development',
  'Career Guidance',
  'Excellent Academic Results',
  'Scholarships & Financial Support',
  'Sports & Extracurricular Activities',
  'Safe & Secure Campus',
  'Hostel Facilities',
  'Library & Digital Resources',
  'Industry Exposure',
  'International Exposure',
  'Entrepreneurship Support',
  'Skill Development Programs',
  'Strong Alumni Network',
  'Regular Seminars & Workshops',
  'Holistic Development',
  'Vibrant Campus Life',
];

// Each Key Highlight carries its own fill-in number, unlike Why Choose Us
// which is just a checkbox list.
export const KEY_HIGHLIGHTS_OPTIONS = [
  { key: 'faculty', label: 'Experienced Faculty', field: 'Faculty Members', placeholder: 'e.g. 250+' },
  { key: 'placement', label: 'Placement Record', field: 'Placement Rate', placeholder: 'e.g. 92%' },
  { key: 'industry', label: 'Industry Exposure', field: 'Industry Partners', placeholder: 'e.g. 150+' },
  { key: 'alumni', label: 'Alumni Network', field: 'Alumni', placeholder: 'e.g. 20,000+' },
  { key: 'batches', label: 'Small Batch Size', field: 'Avg. Batch Size', placeholder: 'e.g. 30 students' },
  { key: 'years', label: 'Years of Operation', field: 'Years', placeholder: 'e.g. 15+' },
  { key: 'branches', label: 'Multiple Branches', field: 'Branches', placeholder: 'e.g. 8' },
  { key: 'toppers', label: 'Board / Exam Toppers', field: 'Toppers Produced', placeholder: 'e.g. 40+' },
  { key: 'scholarships', label: 'Scholarships Awarded', field: 'Scholarships Given', placeholder: 'e.g. 500+' },
  { key: 'onlineStudents', label: 'Online Learners', field: 'Students Online', placeholder: 'e.g. 10,000+' },
  { key: 'testSeries', label: 'Test Series Conducted', field: 'Tests Conducted', placeholder: 'e.g. 1,200+' },
  { key: 'library', label: 'Library Collection', field: 'Books Available', placeholder: 'e.g. 50,000+' },
  { key: 'labs', label: 'Laboratories', field: 'Labs on Campus', placeholder: 'e.g. 25' },
  { key: 'internships', label: 'Internships Facilitated', field: 'Internships', placeholder: 'e.g. 300+' },
  { key: 'events', label: 'Events & Workshops', field: 'Events per Year', placeholder: 'e.g. 40+' },
  { key: 'satisfaction', label: 'Student Satisfaction', field: 'Satisfaction Score', placeholder: 'e.g. 4.8/5' },
  { key: 'mentors', label: 'Mentorship Network', field: 'Mentors Available', placeholder: 'e.g. 60+' },
  { key: 'awards', label: 'Institutional Awards', field: 'Awards Won', placeholder: 'e.g. 12' },
  { key: 'internationalTieups', label: 'International Tie-ups', field: 'Partner Universities', placeholder: 'e.g. 10+' },
  { key: 'digitalContent', label: 'Digital Content Library', field: 'Video Lectures', placeholder: 'e.g. 5,000+' },
];

// Facilities carry an Available checkbox plus a facility-specific detail
// field, shown once checked.
export const FACILITIES_OPTIONS = [
  { key: 'hostel', label: 'Hostel', field: 'Capacity', placeholder: 'e.g. 1200' },
  { key: 'library', label: 'Library', field: 'Books', placeholder: 'e.g. 50,000+' },
  { key: 'labs', label: 'Laboratories', field: 'Number of Labs', placeholder: 'e.g. 25' },
  { key: 'sports', label: 'Sports', field: 'Sports Facilities', placeholder: 'e.g. 12' },
  { key: 'transport', label: 'Transport', field: 'Buses/Routes', placeholder: 'e.g. 18 routes' },
  { key: 'cafeteria', label: 'Cafeteria', field: 'Seating Capacity', placeholder: 'e.g. 500' },
  { key: 'medical', label: 'Medical Room', field: 'Staff on Duty', placeholder: 'e.g. 24x7 nurse' },
  { key: 'wifi', label: 'Wi-Fi Campus', field: 'Coverage', placeholder: 'e.g. Full campus' },
  { key: 'auditorium', label: 'Auditorium', field: 'Seating Capacity', placeholder: 'e.g. 800' },
  { key: 'computerLab', label: 'Computer Lab', field: 'Systems Available', placeholder: 'e.g. 120' },
  { key: 'smartClassrooms', label: 'Smart Classrooms', field: 'Rooms Equipped', placeholder: 'e.g. 40' },
  { key: 'gym', label: 'Gymnasium', field: 'Equipment Sets', placeholder: 'e.g. 30' },
  { key: 'counseling', label: 'Counseling Center', field: 'Counselors', placeholder: 'e.g. 3' },
  { key: 'parking', label: 'Parking', field: 'Vehicle Capacity', placeholder: 'e.g. 200' },
  { key: 'security', label: 'CCTV & Security', field: 'Cameras Installed', placeholder: 'e.g. 60+' },
];

// Simpler than Why Choose Us/Key Highlights — a plain multi-select, no
// per-item numeric field.
export const CAMPUS_LIFE_OPTIONS = [
  'Cultural Festivals',
  'Sports Meet',
  'Student Clubs & Societies',
  'Community Service Programs',
  'Green & Eco-Friendly Campus',
  'Music & Arts Society',
  'Debate & Literary Club',
  'Entrepreneurship Cell',
  'Regular Guest Lectures',
  'Alumni Meet-ups',
  'Adventure & Outdoor Trips',
  'Wellness & Yoga Sessions',
];

export const ABOUT_US_STAT_FIELDS = [
  { key: 'establishedYear', label: 'Established Year', placeholder: 'e.g. 1998' },
  { key: 'students', label: 'Students', placeholder: 'e.g. 5000+' },
  { key: 'faculty', label: 'Faculty', placeholder: 'e.g. 250+' },
  { key: 'programs', label: 'Programs', placeholder: 'e.g. 35' },
  { key: 'campusArea', label: 'Campus Area', placeholder: 'e.g. 25 Acres' },
];

/** Builds the About Us paragraph from selected stats — the institute never
 * writes this by hand. `establishedYear` also drives an auto-calculated
 * "Years of Excellence" instead of asking for it separately. */
export function buildAboutParagraph(name, stats, currentYear = new Date().getFullYear()) {
  if (!stats || !Object.values(stats).some(Boolean)) return '';

  const parts = [];
  if (stats.establishedYear) {
    const years = currentYear - Number(stats.establishedYear);
    parts.push(`Established in ${stats.establishedYear}`);
    if (Number.isFinite(years) && years > 0) parts.push(`with ${years}+ years of excellence`);
  }
  let sentence = parts.length ? `${name} — ${parts.join(', ')}.` : `${name}.`;

  const highlights = [];
  if (stats.students) highlights.push(`${stats.students} students`);
  if (stats.faculty) highlights.push(`${stats.faculty} faculty members`);
  if (stats.programs) highlights.push(`${stats.programs} programs`);
  if (stats.campusArea) highlights.push(`a campus spread across ${stats.campusArea}`);

  if (highlights.length) {
    sentence += ` Today, the institute is home to ${highlights.join(', ')}.`;
  }
  return sentence;
}
