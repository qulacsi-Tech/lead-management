// Static mock data for the Education Network UI prototype.
// No backend calls — everything here is local, in-memory demo state.

export const INSTITUTE_TYPES = ['School', 'Coaching', 'College', 'University', 'Training Institute'];

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
    courses: ['JEE Main & Advanced', 'NEET', 'Class 11-12 Foundation', 'Crash Course (60 Days)'],
    admins: [
      { name: 'Ramesh Sharma', role: 'Owner / Primary Admin', email: 'ramesh@brightfuture.in' },
      { name: 'Sunita Verma', role: 'Admin', email: 'sunita@brightfuture.in' },
    ],
    followers: 1240,
    tagline: 'Where Ambition Meets Achievement',
    banners: [],
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
        session: '2026-27',
        startDate: '2026-08-10',
        endDate: '2026-09-15',
        eligibility: 'Class 12 pass / appearing, PCM',
        description: '60-day intensive crash course with daily mock tests and doubt sessions.',
        reach: 3400,
        views: 890,
        ranking: 3,
      },
      {
        id: 'op2',
        type: 'job',
        position: 'Physics Faculty',
        subject: 'Physics',
        experience: '3+ years',
        qualification: 'M.Sc Physics / B.Tech',
        applyBefore: '2026-08-20',
        description: 'Looking for an experienced Physics faculty for JEE/NEET batches, full-time, Indore campus.',
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
    courses: ['Nursery to Class 5', 'Class 6-10', 'Class 11-12 Science', 'Class 11-12 Commerce'],
    admins: [{ name: 'Anita Rao', role: 'Owner / Primary Admin', email: 'anita@horizonschool.in' }],
    followers: 640,
    tagline: "Nurturing Tomorrow's Leaders",
    banners: [],
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
    courses: ['Spoken English', 'Corporate Communication', 'Tally & Accounting'],
    admins: [{ name: 'Vikram Joshi', role: 'Owner / Primary Admin', email: 'vikram@zenithtraining.in' }],
    followers: 310,
    tagline: 'Skills That Get You Hired',
    banners: [],
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

/** Admin bulk-creates a page — see docs/CLIENT_FEEDBACK_2026-08-16.md, Section 5. */
export function addPage({ name, type, logoUrl, banners, tagline, address, website, contact, affiliation, courses }) {
  const baseSlug = slugify(name) || `institute-${mockPages.length + 1}`;
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
    courses: courses?.length ? courses : ['General'],
    admins: [],
    followers: 0,
    tagline: tagline || '',
    banners: banners || [],
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
