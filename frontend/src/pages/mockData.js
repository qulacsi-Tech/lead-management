// Static mock data for the Education Network UI prototype.
// No backend calls — everything here is local, in-memory demo state.

export const INSTITUTE_TYPES = ['School', 'Coaching', 'College', 'University', 'Training Institute'];

// ---------------------------------------------------------------------------
// PLATFORM-OWNED taxonomy — Main Admin controls these lists; Institute Admins
// pick from them but cannot add to them. Keeping them here (rather than inline
// in each form) is what makes that ownership boundary explicit in the UI.
// ---------------------------------------------------------------------------

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

export function slugify(name) {
  return (name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Multi-page model — every Institute Page (whether created by a Professional
// from their own account, or bulk-created by Admin) lives here with its own
// unique slug, so each gets its own URL: connectedus.in/<slug>. See
// docs/CLIENT_FEEDBACK_2026-08-16.md, Section 6.
export const mockPages = [
  {
    id: 'page1',
    slug: 'bright-future-coaching',
    name: 'Bright Future Coaching Institute',
    type: 'Coaching',
    logo: 'BF',
    logoUrl: null,
    about:
      'Bright Future Coaching Institute has been preparing students for JEE, NEET and board exams since 2010, with a 92% selection ratio in the last 5 years.',
    address: 'MG Road, Indore, Madhya Pradesh',
    website: 'www.brightfuturecoaching.in',
    contact: '+91-731-4567890',
    affiliation: '',
    // INSTITUTE-OWNED: Courses are first-class records managed by the Institute
    // Admin (see /institute/courses), not a free-text list typed at page setup.
    courses: [
      {
        id: 'crs-1', name: 'JEE Main & Advanced', category: 'Engineering Entrance', level: 'Advanced',
        duration: '2 Years', fees: '1,80,000', intake: '120', eligibility: 'Class 10 pass, PCM stream',
        specializations: ['PCM Foundation', 'Advanced Problem Solving', 'Crash Course'],
        description: 'Two-year integrated programme covering the complete JEE Main and Advanced syllabus with weekly tests.',
        status: 'Published', admissionOpen: true, updatedAt: '2026-08-14',
      },
      {
        id: 'crs-2', name: 'NEET', category: 'Medical Entrance', level: 'Advanced',
        duration: '2 Years', fees: '1,75,000', intake: '100', eligibility: 'Class 10 pass, PCB stream',
        specializations: ['PCB Foundation', 'Biology Intensive', 'Crash Course'],
        description: 'Full NEET preparation with daily biology drills, NCERT mastery and all-India mock ranking.',
        status: 'Published', admissionOpen: true, updatedAt: '2026-08-14',
      },
      {
        id: 'crs-3', name: 'Class 11-12 Foundation', category: 'School Curriculum', level: 'Foundation',
        duration: '2 Years', fees: '90,000', intake: '150', eligibility: 'Class 10 pass',
        specializations: ['Science Stream', 'Commerce Stream'],
        description: 'Board-aligned coaching that runs alongside school, building the base for entrance preparation.',
        status: 'Published', admissionOpen: true, updatedAt: '2026-08-10',
      },
      {
        id: 'crs-4', name: 'Crash Course (60 Days)', category: 'Competitive Exam', level: 'Crash Course',
        duration: '60 Days', fees: '35,000', intake: '80', eligibility: 'Class 12 pass / appearing',
        specializations: ['JEE Focus', 'NEET Focus'],
        description: 'Intensive final-stretch revision with daily full-length mocks and doubt clinics.',
        status: 'Published', admissionOpen: true, updatedAt: '2026-08-18',
      },
    ],
    admins: [
      { name: 'Ramesh Sharma', role: 'Owner / Primary Admin', email: 'ramesh@brightfuture.in', assignedAt: '2026-07-02' },
      { name: 'Sunita Verma', role: 'Admin', email: 'sunita@brightfuture.in', assignedAt: '2026-07-20' },
    ],
    followers: 1240,
    tagline: 'Where Ambition Meets Achievement',
    banners: [],
    gallery: [],
    socialLinks: { facebook: '', instagram: '', youtube: '', linkedin: '' },
    enabled: true,
    // The "Select & Fill" landing-page builder state — everything here is
    // chosen from the predefined option banks in pageBuilderContent.js, not
    // typed as prose. See docs/CLIENT_FEEDBACK_2026-08-12.md, Section 5.
    content: {
      aboutStats: {
        establishedYear: '2010',
        students: '5000+',
        faculty: '250+',
        programs: '18',
        campusArea: '6 Acres',
      },
      whyChooseUs: [
        'Experienced & Qualified Faculty',
        'Strong Placement Support',
        'Digital Learning Environment',
        'Excellent Academic Results',
        'Career Guidance',
        'Regular Seminars & Workshops',
      ],
      keyHighlights: [
        { key: 'faculty', value: '250+' },
        { key: 'placement', value: '92%' },
        { key: 'toppers', value: '40+' },
        { key: 'testSeries', value: '1,200+' },
      ],
      facilities: [
        { key: 'library', value: '50,000+' },
        { key: 'labs', value: '25' },
        { key: 'wifi', value: 'Full campus' },
        { key: 'computerLab', value: '120' },
      ],
      campusLife: ['Cultural Festivals', 'Sports Meet', 'Regular Guest Lectures', 'Entrepreneurship Cell'],
      achievements: {
        highestPlacement: '24',
        averagePlacement: '7.5',
        placementRate: '92',
        recruiters: '180+',
      },
    },
    opportunities: [
      {
        id: 'op1',
        type: 'admission',
        course: 'JEE Advanced Crash Course',
        courseId: 'crs-4',
        session: '2026-27',
        startDate: '2026-08-10',
        endDate: '2026-09-15',
        eligibility: 'Class 12 pass / appearing, PCM',
        description: '60-day intensive crash course with daily mock tests and doubt sessions.',
        applyUrl: 'www.brightfuturecoaching.in/apply',
        status: 'Published',
        publishedAt: '2026-08-10',
        reach: 3400,
        views: 890,
        ranking: 3,
      },
      {
        id: 'op2',
        type: 'job',
        position: 'Physics Faculty',
        subject: 'Physics',
        department: 'Science',
        employmentType: 'Full-time',
        location: 'Indore Campus',
        salary: '6,00,000 – 9,00,000 / yr',
        skills: ['JEE Physics', 'Mechanics', 'Doubt Handling'],
        experience: '3+ years',
        qualification: 'M.Sc Physics / B.Tech',
        applyBefore: '2026-08-20',
        applyUrl: 'careers@brightfuturecoaching.in',
        description: 'Looking for an experienced Physics faculty for JEE/NEET batches, full-time, Indore campus.',
        status: 'Published',
        publishedAt: '2026-08-05',
        reach: 2100,
        views: 540,
        ranking: 1,
      },
    ],
  },
  {
    id: 'page2',
    slug: 'horizon-public-school',
    name: 'Horizon Public School',
    type: 'School',
    logo: 'HS',
    logoUrl: null,
    about: 'Horizon Public School has been nurturing well-rounded students from Nursery to Class 12 since 1998.',
    address: 'Vijay Nagar, Indore, Madhya Pradesh',
    website: 'www.horizonpublicschool.in',
    contact: '+91-731-2345678',
    affiliation: 'CBSE',
    courses: [
      {
        id: 'crs-5', name: 'Nursery to Class 5', category: 'School Curriculum', level: 'Foundation',
        duration: '6 Years', fees: '48,000 / yr', intake: '200', eligibility: 'Age 3+ as on 31 March',
        specializations: [], description: 'Primary wing with activity-based learning and a low student-teacher ratio.',
        status: 'Published', admissionOpen: true, updatedAt: '2026-08-01',
      },
      {
        id: 'crs-6', name: 'Class 6-10', category: 'School Curriculum', level: 'Intermediate',
        duration: '5 Years', fees: '62,000 / yr', intake: '180', eligibility: 'Class 5 pass',
        specializations: [], description: 'CBSE middle and secondary school with integrated olympiad training.',
        status: 'Published', admissionOpen: true, updatedAt: '2026-08-01',
      },
      {
        id: 'crs-7', name: 'Class 11-12 Science', category: 'School Curriculum', level: 'Advanced',
        duration: '2 Years', fees: '78,000 / yr', intake: '120', eligibility: 'Class 10 with 60%+',
        specializations: ['PCM', 'PCB'], description: 'Senior secondary science with in-house entrance coaching.',
        status: 'Published', admissionOpen: true, updatedAt: '2026-08-05',
      },
      {
        id: 'crs-8', name: 'Class 11-12 Commerce', category: 'Commerce', level: 'Advanced',
        duration: '2 Years', fees: '70,000 / yr', intake: '80', eligibility: 'Class 10 pass',
        specializations: ['With Maths', 'Without Maths'], description: 'Commerce stream with CA foundation guidance.',
        status: 'Draft', admissionOpen: false, updatedAt: '2026-08-12',
      },
    ],
    admins: [{ name: 'Anita Rao', role: 'Owner / Primary Admin', email: 'anita@horizonschool.in', assignedAt: '2026-06-15' }],
    followers: 640,
    tagline: "Nurturing Tomorrow's Leaders",
    banners: [],
    gallery: [],
    socialLinks: { facebook: '', instagram: '', youtube: '', linkedin: '' },
    enabled: true,
    content: {
      aboutStats: { establishedYear: '1998', students: '2200+', faculty: '140+', programs: '4', campusArea: '10 Acres' },
      whyChooseUs: ['Safe & Secure Campus', 'Holistic Development', 'Sports & Extracurricular Activities', 'Excellent Academic Results'],
      keyHighlights: [{ key: 'faculty', value: '140+' }, { key: 'years', value: '25+' }],
      facilities: [{ key: 'sports', value: '8' }, { key: 'transport', value: '18 routes' }],
      campusLife: ['Cultural Festivals', 'Sports Meet', 'Wellness & Yoga Sessions'],
      achievements: { highestPlacement: '', averagePlacement: '', placementRate: '', recruiters: '' },
    },
    opportunities: [
      {
        id: 'op3',
        type: 'admission',
        course: 'Nursery to Class 5',
        session: '2026-27',
        startDate: '2026-08-01',
        endDate: '2026-09-30',
        eligibility: 'Age-appropriate, see admission office',
        description: 'Limited seats left for the 2026-27 session. Sibling and staff-ward discounts available.',
        courseId: 'crs-5',
        applyUrl: 'www.horizonpublicschool.in/admissions',
        status: 'Published',
        publishedAt: '2026-08-01',
        reach: 1900,
        views: 410,
        ranking: 1,
      },
    ],
  },
  {
    id: 'page3',
    slug: 'zenith-training-institute',
    name: 'Zenith Training Institute',
    type: 'Training Institute',
    logo: 'ZT',
    logoUrl: null,
    about: 'Zenith Training Institute runs short-term professional and spoken-skills courses for working professionals.',
    address: 'Palasia, Indore, Madhya Pradesh',
    website: 'www.zenithtraining.in',
    contact: '+91-731-9988776',
    affiliation: '',
    courses: [
      {
        id: 'crs-9', name: 'Spoken English', category: 'Language', level: 'Certification',
        duration: '3 Months', fees: '12,000', intake: '40', eligibility: 'Open to all',
        specializations: ['Basic', 'Business English'], description: 'Conversation-led spoken English with weekend batches for working professionals.',
        status: 'Published', admissionOpen: true, updatedAt: '2026-08-08',
      },
      {
        id: 'crs-10', name: 'Corporate Communication', category: 'Skill / Vocational', level: 'Certification',
        duration: '2 Months', fees: '15,000', intake: '30', eligibility: 'Graduate / working professional',
        specializations: [], description: 'Presentation, email and client-facing communication skills for corporate teams.',
        status: 'Published', admissionOpen: true, updatedAt: '2026-08-08',
      },
      {
        id: 'crs-11', name: 'Tally & Accounting', category: 'Skill / Vocational', level: 'Certification',
        duration: '4 Months', fees: '18,000', intake: '35', eligibility: 'Class 12 Commerce preferred',
        specializations: ['Tally Prime', 'GST Filing'], description: 'Job-ready accounting certification with live GST filing practice.',
        status: 'Published', admissionOpen: true, updatedAt: '2026-08-08',
      },
    ],
    admins: [{ name: 'Vikram Joshi', role: 'Owner / Primary Admin', email: 'vikram@zenithtraining.in', assignedAt: '2026-07-11' }],
    followers: 310,
    tagline: 'Skills That Get You Hired',
    banners: [],
    gallery: [],
    socialLinks: { facebook: '', instagram: '', youtube: '', linkedin: '' },
    enabled: true,
    content: {
      aboutStats: { establishedYear: '2016', students: '1500+', faculty: '20+', programs: '6', campusArea: '' },
      whyChooseUs: ['Industry-Oriented Curriculum', 'Skill Development Programs', 'Career Guidance'],
      keyHighlights: [{ key: 'placement', value: '78%' }],
      facilities: [{ key: 'wifi', value: 'Full campus' }],
      campusLife: [],
      achievements: { highestPlacement: '', averagePlacement: '', placementRate: '78', recruiters: '40+' },
    },
    opportunities: [
      {
        id: 'op4',
        type: 'job',
        position: 'Spoken English Trainer',
        subject: 'Spoken English',
        experience: '2+ years',
        qualification: 'Any Graduate, fluent English',
        applyBefore: '2026-09-01',
        description: 'Part-time / full-time Spoken English trainer needed for corporate batches. Weekend batches also available.',
        department: 'Languages',
        employmentType: 'Part-time',
        location: 'Palasia, Indore',
        salary: '3,00,000 – 4,50,000 / yr',
        skills: ['Spoken English', 'Corporate Training'],
        applyUrl: 'hr@zenithtraining.in',
        status: 'Published',
        publishedAt: '2026-08-02',
        reach: 640,
        views: 150,
        ranking: 2,
      },
    ],
  },
];

/** Returns the live object reference (not a copy) so edits made through it
 * persist for the session, matching how the rest of this mock layer works. */
export function findPageBySlug(slug) {
  return mockPages.find((p) => p.slug === slug);
}

/** Ownership lookup: a page belongs to whoever is listed in its `admins`
 * array, matched by the logged-in user's email. This is the single source
 * of truth for "is this my page" — never a hardcoded slug — so that Edit
 * Page / Add Admin / Post Notice never leak across accounts. */
export function findPageByAdminEmail(email) {
  if (!email) return undefined;
  const normalized = email.trim().toLowerCase();
  return mockPages.find((p) => p.admins?.some((a) => a.email?.toLowerCase() === normalized));
}

/** Course names only — the Enquiry dropdowns and any "pick a course" UI read
 * this rather than the full course records. */
export function courseNames(page) {
  return (page?.courses || []).map((c) => (typeof c === 'string' ? c : c.name));
}

/** Only Published courses appear on the public Institute Page; Drafts stay
 * visible to the Institute Admin alone. */
export function publicCourses(page) {
  return (page?.courses || []).filter((c) => typeof c === 'string' || c.status === 'Published');
}

/** Only Published opportunities reach the public page / feed — the Draft,
 * Expired and Closed states exist for the Institute Admin's own workflow. */
export function publicOpportunities(page) {
  return (page?.opportunities || []).filter((o) => !o.status || o.status === 'Published');
}

/** Every page the given user administers. A user may hold admin rights on more
 * than one page, so the Institute Console works off a list, not a single page. */
export function pagesAdministeredBy(email) {
  if (!email) return [];
  const normalized = email.trim().toLowerCase();
  return mockPages.filter((p) => p.admins?.some((a) => a.email?.toLowerCase() === normalized));
}

/** INSTITUTE-OWNED writes — all course mutations funnel through here so the
 * ownership boundary lives in one place when this moves to a real API. */
export function upsertCourse(page, course) {
  const existing = page.courses.findIndex((c) => c.id === course.id);
  if (existing >= 0) page.courses[existing] = { ...page.courses[existing], ...course };
  else page.courses.push({ ...course, id: course.id || `crs-${Date.now()}` });
  return page.courses;
}

export function removeCourse(page, courseId) {
  page.courses = page.courses.filter((c) => c.id !== courseId);
  return page.courses;
}

export function upsertOpportunity(page, opportunity) {
  const existing = page.opportunities.findIndex((o) => o.id === opportunity.id);
  if (existing >= 0) page.opportunities[existing] = { ...page.opportunities[existing], ...opportunity };
  else page.opportunities.unshift({ ...opportunity, id: opportunity.id || `op-${Date.now()}` });
  return page.opportunities;
}

export function removeOpportunity(page, opportunityId) {
  page.opportunities = page.opportunities.filter((o) => o.id !== opportunityId);
  return page.opportunities;
}

/** PLATFORM-OWNED write — assigning who administers a page belongs to Main
 * Admin, never to the Institute Admin being assigned. */
export function assignPageAdmin(page, { name, email, role = 'Admin' }) {
  const normalized = email.trim().toLowerCase();
  if (page.admins.some((a) => a.email?.toLowerCase() === normalized)) return page.admins;
  page.admins = [
    ...page.admins,
    { name: name || email.split('@')[0], email, role, assignedAt: new Date().toISOString().slice(0, 10) },
  ];
  return page.admins;
}

export function removePageAdmin(page, email) {
  const normalized = email.trim().toLowerCase();
  page.admins = page.admins.filter((a) => a.email?.toLowerCase() !== normalized);
  return page.admins;
}

/** Admin bulk-creates a page — see docs/CLIENT_FEEDBACK_2026-08-16.md, Section 5. */
export function addPage({ name, type, logoUrl, banners, tagline, address, website, contact, affiliation, courses, slug: desiredSlug }) {
  const baseSlug = slugify(desiredSlug || name) || `institute-${mockPages.length + 1}`;
  let slug = baseSlug;
  let i = 2;
  while (findPageBySlug(slug)) {
    slug = `${baseSlug}-${i}`;
    i += 1;
  }
  const page = {
    id: `page-${Date.now()}`,
    slug,
    name,
    type,
    logo: (name || '?').trim().slice(0, 2).toUpperCase(),
    logoUrl: logoUrl || null,
    about: '',
    address: address || '',
    website: website || '',
    contact: contact || '',
    affiliation: affiliation || '',
    courses: courses?.length ? courses : [],
    admins: [],
    followers: 0,
    tagline: tagline || '',
    banners: banners || [],
    gallery: [],
    socialLinks: { facebook: '', instagram: '', youtube: '', linkedin: '' },
    enabled: true,
    createdAt: new Date().toISOString().slice(0, 10),
    content: {
      aboutStats: { establishedYear: '', students: '', faculty: '', programs: '', campusArea: '' },
      whyChooseUs: [],
      keyHighlights: [],
      facilities: [],
      campusLife: [],
      achievements: { highestPlacement: '', averagePlacement: '', placementRate: '', recruiters: '' },
    },
    opportunities: [],
  };
  mockPages.push(page);
  return page;
}

// Specializations offered under each course, shown on the landing page and
// in the Enquiry modal both. See docs/CLIENT_FEEDBACK_2026-08-12.md,
// Section 6.1.
export const COURSE_SPECIALIZATIONS = {
  'JEE Main & Advanced': ['PCM Foundation', 'Advanced Problem Solving', 'Crash Course'],
  'NEET': ['PCB Foundation', 'Biology Intensive', 'Crash Course'],
  'Class 11-12 Foundation': ['Science Stream', 'Commerce Stream'],
  'Crash Course (60 Days)': ['JEE Focus', 'NEET Focus'],
};

// Demo phone number that resolves as an "existing user" in the Enquiry
// modal's returning-visitor path — everything here is mock, no backend.
export const EXISTING_ENQUIRY_USER = { phone: '9998887770', name: 'Rohit Das' };

// INSTITUTE-OWNED. Enquiries submitted through an Institute Page's enquiry form
// land with that institute's admin, not with the platform. Main Admin retains a
// read-only platform-wide view at /admin/enquiries for oversight.
export const ENQUIRY_STATUSES = ['New', 'Contacted', 'Responded', 'Closed'];

export const mockInstituteEnquiries = [
  {
    id: 'enq-1', pageSlug: 'bright-future-coaching', name: 'Aarav Gupta',
    email: 'aarav.gupta@example.com', phone: '9876543210', city: 'Indore', state: 'Madhya Pradesh',
    course: 'JEE Main & Advanced', specialization: 'Crash Course', status: 'New',
    submittedAt: '2026-08-19', note: '',
  },
  {
    id: 'enq-2', pageSlug: 'bright-future-coaching', name: 'Priya Nair',
    email: 'priya.nair@example.com', phone: '9823456701', city: 'Indore', state: 'Madhya Pradesh',
    course: 'NEET', specialization: 'Biology Intensive', status: 'Contacted',
    submittedAt: '2026-08-17', note: 'Called on 18 Aug, asked for a fee structure over email.',
  },
  {
    id: 'enq-3', pageSlug: 'bright-future-coaching', name: 'Rohit Das',
    email: 'rohit.das@example.com', phone: '9998887770', city: 'Bhopal', state: 'Madhya Pradesh',
    course: 'Class 11-12 Foundation', specialization: 'Science Stream', status: 'Responded',
    submittedAt: '2026-08-14', note: 'Sent brochure + demo class invite.',
  },
  {
    id: 'enq-4', pageSlug: 'horizon-public-school', name: 'Meera Joshi',
    email: 'meera.joshi@example.com', phone: '9812233445', city: 'Indore', state: 'Madhya Pradesh',
    course: 'Nursery to Class 5', specialization: '', status: 'New',
    submittedAt: '2026-08-20', note: '',
  },
  {
    id: 'enq-5', pageSlug: 'zenith-training-institute', name: 'Kabir Shah',
    email: 'kabir.shah@example.com', phone: '9801122334', city: 'Indore', state: 'Madhya Pradesh',
    course: 'Spoken English', specialization: 'Business English', status: 'New',
    submittedAt: '2026-08-20', note: '',
  },
];

export function enquiriesForPage(slug) {
  return mockInstituteEnquiries.filter((e) => e.pageSlug === slug);
}

export function updateEnquiry(id, patch) {
  const idx = mockInstituteEnquiries.findIndex((e) => e.id === id);
  if (idx >= 0) mockInstituteEnquiries[idx] = { ...mockInstituteEnquiries[idx], ...patch };
  return mockInstituteEnquiries[idx];
}

/** Called by the public Institute Page enquiry form so a submitted enquiry
 * actually shows up in that institute's console for the rest of the session. */
export function addEnquiry(enquiry) {
  const record = {
    id: `enq-${Date.now()}`,
    status: 'New',
    submittedAt: new Date().toISOString().slice(0, 10),
    note: '',
    ...enquiry,
  };
  mockInstituteEnquiries.unshift(record);
  return record;
}

export const mockProfessional = {
  name: 'Rakesh Sharma',
  headline: 'Math Faculty | JEE & NEET | 15 Years Experience',
  about:
    'Passionate Mathematics educator with 15 years of experience teaching JEE and NEET aspirants. Known for simplifying complex problems into intuitive concepts.',
  category: 'Coaching Faculty',
  qualification: 'M.Sc Mathematics, B.Ed',
  experience: '15 Years',
  subjects: ['Mathematics', 'Algebra', 'Calculus', 'Trigonometry'],
  skills: ['Doubt Solving', 'Test Series Design', 'Online Teaching'],
  currentInstitute: 'Bright Future Coaching Institute',
  previousInstitutes: ['Allen Career Institute', 'Resonance'],
  resumeUploaded: true,
  contact: '+91-7XXXXXXX9',
  stats: {
    followers: 860,
    likes: 1520,
    downloads: 340,
    reputationScore: 92,
    recommendations: 24,
  },
};

export const mockDesiredJob = {
  role: 'Senior Math Faculty',
  stream: 'JEE / NEET',
  preferredLocation: 'Indore, Bhopal',
  expectedSalary: '₹60,000 - ₹80,000/month',
  postedOn: '2026-07-12',
  reach: 1800,
  views: 420,
  ranking: 2,
};

export const mockGuessPapers = [
  {
    id: 'gp1',
    title: 'JEE Main 2026 - Math Guess Paper Set A',
    updatedOn: '2026-07-28',
    reach: 4200,
    views: 1100,
    ranking: 1,
  },
  {
    id: 'gp2',
    title: 'NEET 2026 - Physics Important Questions',
    updatedOn: '2026-07-05',
    reach: 2300,
    views: 610,
    ranking: 4,
  },
];

export const mockAdmissionLeads = [
  {
    id: 'al1',
    type: 'self',
    stream: 'MBA Admission',
    course: 'Executive MBA',
    postedOn: '2026-07-20',
    reach: 900,
    views: 210,
    ranking: 2,
  },
  {
    id: 'al2',
    type: 'friend',
    stream: 'B.Tech Admission',
    course: 'Computer Science',
    postedOn: '2026-06-30',
    reach: 1500,
    views: 380,
    ranking: 1,
  },
];

export const mockSearchResults = [
  {
    id: 'sr1',
    maskedName: 'R*****h S****a',
    maskedPhone: '+91-7*******9',
    type: 'job',
    title: 'Math Faculty',
    experience: '15 Years Experience',
    credits: 200,
    preferredLocation: 'Indore',
    expectedSalary: '••••••••',
    openFor: 'Open for Job',
  },
  {
    id: 'sr2',
    maskedName: 'S***q Q****i',
    maskedPhone: '+91-7******9',
    type: 'admission',
    title: 'Bachelor of Engineering, Computer Science',
    credits: 350,
    preferredLocation: 'MP / Gujrat / CG',
    percent12th: '*****',
    jeeScore: '*****',
    currentCity: '*****',
    hostelRequired: 'Yes',
    openFor: 'Open for Admission',
  },
  {
    id: 'sr3',
    maskedName: 'P****a M****a',
    maskedPhone: '+91-9*******2',
    type: 'job',
    title: 'Chemistry Faculty',
    experience: '8 Years Experience',
    credits: 180,
    preferredLocation: 'Bhopal, Indore',
    expectedSalary: '••••••••',
    openFor: 'Open for Job',
  },
];

// Combined feed — every post type (institute opportunity posts, professional
// "looking for job/admission" posts, guess papers) normalized into one shape
// so they can render as a single LinkedIn-style feed.
export const mockFeedPosts = [
  {
    id: 'f1',
    postType: 'admission',
    author: { name: 'Bright Future Coaching Institute', sub: 'Coaching Institute', avatar: 'BF', kind: 'page' },
    time: '3h',
    title: 'Admission Open: JEE Advanced Crash Course',
    body: '60-day intensive crash course with daily mock tests and doubt sessions. Session 2026-27. Eligibility: Class 12 pass / appearing, PCM. Starts 10 Aug, ends 15 Sep.',
    likes: 86,
    comments: 12,
    ctaLabel: 'View Notice',
    ctaTo: '/page',
  },
  {
    id: 'f2',
    postType: 'job',
    author: { name: 'Bright Future Coaching Institute', sub: 'Coaching Institute', avatar: 'BF', kind: 'page' },
    time: '5h',
    title: 'Hiring: Physics Faculty',
    body: 'Looking for an experienced Physics faculty for JEE/NEET batches, full-time, Indore campus. 3+ years experience, M.Sc Physics / B.Tech preferred. Apply before 20 Aug.',
    likes: 54,
    comments: 6,
    ctaLabel: 'View Vacancy',
    ctaTo: '/page',
  },
  {
    id: 'f3',
    postType: 'expert',
    author: { name: 'Rakesh Sharma', sub: 'Math Faculty · 15 yrs experience', avatar: 'RS', kind: 'professional' },
    time: '1d',
    title: 'Uploaded: JEE Main 2026 - Math Guess Paper Set A',
    body: 'Sharing my predicted question set for JEE Main 2026, based on last 5 years\' trend analysis. Download and practice before the exam.',
    likes: 210,
    comments: 34,
    ctaLabel: 'Download Paper',
    ctaTo: '/dashboard',
  },
  {
    id: 'f4',
    postType: 'lookingForJob',
    author: { name: 'Priya Mehta', sub: 'Chemistry Faculty · 8 yrs experience', avatar: 'PM', kind: 'professional' },
    time: '1d',
    title: 'Open to work: Senior Chemistry Faculty',
    body: 'Looking for a full-time Chemistry faculty role in Bhopal or Indore. Open to coaching institutes and senior secondary schools.',
    likes: 32,
    comments: 4,
    ctaLabel: 'Unlock Profile · 180 credits',
    ctaTo: '/search',
  },
  {
    id: 'f5',
    postType: 'admission',
    author: { name: 'Horizon Public School', sub: 'School', avatar: 'HS', kind: 'page' },
    time: '2d',
    title: 'Admission Open: Class 11 Science Stream',
    body: 'Admissions open for Class 11 Science (PCM/PCB) for session 2026-27. Merit-based scholarships available for board toppers.',
    likes: 41,
    comments: 9,
    ctaLabel: 'View Notice',
    ctaTo: '/horizon-public-school',
  },
  {
    id: 'f6',
    postType: 'lookingForAdmission',
    author: { name: 'Saniya Qureshi', sub: 'Bachelor of Engineering aspirant', avatar: 'SQ', kind: 'student' },
    time: '2d',
    title: 'Looking for Admission: B.Tech Computer Science',
    body: 'Preferred locations: MP / Gujrat / CG. Hostel required. Sharing my enquiry in case any institute has open seats for this session.',
    likes: 18,
    comments: 2,
    ctaLabel: 'Unlock Profile · 350 credits',
    ctaTo: '/search',
  },
];

// Extra pool of posts used to simulate infinite scroll (older posts loading
// further down) and a "live" feed (new posts appearing automatically every
// so often). Cycled/re-tagged with fresh ids so the demo never runs dry.
export const feedPostPool = [
  {
    postType: 'job',
    author: { name: 'Zenith Training Institute', sub: 'Training Institute', avatar: 'ZT', kind: 'page' },
    title: 'Hiring: Spoken English Trainer',
    body: 'Part-time / full-time Spoken English trainer needed for corporate batches. Weekend batches also available.',
    likes: 22, comments: 3, ctaLabel: 'View Vacancy', ctaTo: '/zenith-training-institute',
  },
  {
    postType: 'admission',
    author: { name: 'Horizon Public School', sub: 'School', avatar: 'HS', kind: 'page' },
    title: 'Admission Open: Nursery to Class 5',
    body: 'Limited seats left for the 2026-27 session. Sibling and staff-ward discounts available.',
    likes: 29, comments: 5, ctaLabel: 'View Notice', ctaTo: '/horizon-public-school',
  },
  {
    postType: 'expert',
    author: { name: 'Ankit Verma', sub: 'Chemistry Faculty · 10 yrs experience', avatar: 'AV', kind: 'professional' },
    title: 'Uploaded: NEET 2026 - Organic Chemistry Guess Paper',
    body: 'Covers the most repeated organic chemistry reaction mechanisms from the last 6 years of NEET papers.',
    likes: 132, comments: 19, ctaLabel: 'Download Paper', ctaTo: '/dashboard',
  },
  {
    postType: 'lookingForJob',
    author: { name: 'Neha Kulkarni', sub: 'Biology Faculty · 6 yrs experience', avatar: 'NK', kind: 'professional' },
    title: 'Open to work: Biology Faculty (NEET)',
    body: 'Looking for a full-time role in Pune or Nagpur. Available to join within 30 days.',
    likes: 16, comments: 1, ctaLabel: 'Unlock Profile · 220 credits', ctaTo: '/search',
  },
  {
    postType: 'lookingForAdmission',
    author: { name: 'Rohit Das', sub: 'Class 12 PCM student', avatar: 'RD', kind: 'student' },
    title: 'Looking for Admission: JEE Coaching (Crash Course)',
    body: 'Preferred location: Kota or Indore. Hostel required. Open to 60-90 day crash course programs.',
    likes: 9, comments: 0, ctaLabel: 'Unlock Profile · 150 credits', ctaTo: '/search',
  },
  {
    postType: 'job',
    author: { name: 'Bright Future Coaching Institute', sub: 'Coaching Institute', avatar: 'BF', kind: 'page' },
    title: 'Hiring: Front Desk / Admission Counsellor',
    body: 'Looking for a proactive admission counsellor to handle walk-ins and enquiry follow-ups. Indore campus.',
    likes: 12, comments: 2, ctaLabel: 'View Vacancy', ctaTo: '/page',
  },
];

export const RECENTLY_VIEWED = [
  { name: 'Horizon Public School', sub: 'Viewed 2h ago', avatar: 'HS' },
  { name: 'Priya Mehta', sub: 'Chemistry Faculty · viewed yesterday', avatar: 'PM' },
];

export const TRENDING_TOPICS = [
  { tag: '#JEE2026', posts: '3.2k posts' },
  { tag: '#NEETPrep', posts: '2.1k posts' },
  { tag: '#TeacherHiring', posts: '980 posts' },
  { tag: '#AdmissionsOpen', posts: '640 posts' },
];

export const CLOSING_SOON = [
  { course: 'JEE Advanced Crash Course', institute: 'Bright Future Coaching', closesIn: '3 days' },
  { course: 'Class 11 Science Admission', institute: 'Horizon Public School', closesIn: '6 days' },
];

// Static seed notifications shown in the bell dropdown, plus a pool used to
// simulate new ones arriving live (see AppLayout).
export const mockNotifications = [
  { icon: 'person_add', title: 'Priya Mehta started following you', time: '1h ago' },
  { icon: 'campaign', title: 'Bright Future Coaching Institute posted a new Job Vacancy', time: '3h ago' },
  { icon: 'download', title: 'Your Guess Paper crossed 300 downloads', time: '1d ago' },
];

export const notificationPool = [
  { icon: 'thumb_up', title: 'Ankit Verma liked your Guess Paper' },
  { icon: 'lock_open', title: 'An institute unlocked your profile' },
  { icon: 'school', title: 'New Admission Notice posted by Horizon Public School' },
  { icon: 'work', title: 'New Job Vacancy matches your desired location' },
  { icon: 'verified', title: 'You received a new Recommendation' },
];

export const mockPurchasedHistory = [
  {
    id: 'ph1',
    name: 'Rakesh Sharma',
    type: 'Job Lead',
    purchasedOn: '2026-07-30',
    credits: 200,
    interested: true,
  },
  {
    id: 'ph2',
    name: 'Saniya Qureshi',
    type: 'Admission Lead',
    purchasedOn: '2026-07-22',
    credits: 350,
    interested: false,
  },
];
