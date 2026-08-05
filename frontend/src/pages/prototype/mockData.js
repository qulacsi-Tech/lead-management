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

export const mockPage = {
  name: 'Bright Future Coaching Institute',
  type: 'Coaching',
  logo: 'BF',
  about:
    'Bright Future Coaching Institute has been preparing students for JEE, NEET and board exams since 2010, with a 92% selection ratio in the last 5 years.',
  address: 'MG Road, Indore, Madhya Pradesh',
  website: 'www.brightfuturecoaching.in',
  contact: '+91-731-4567890',
  courses: ['JEE Main & Advanced', 'NEET', 'Class 11-12 Foundation', 'Crash Course (60 Days)'],
  admins: [
    { name: 'Ramesh Sharma', role: 'Owner / Primary Admin', email: 'ramesh@brightfuture.in' },
    { name: 'Sunita Verma', role: 'Admin', email: 'sunita@brightfuture.in' },
  ],
  followers: 1240,
};

export const mockOpportunities = [
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
];

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
    ctaTo: '/prototype/page',
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
    ctaTo: '/prototype/page',
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
    ctaTo: '/prototype/dashboard',
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
    ctaTo: '/prototype/search',
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
    ctaTo: '/prototype/page',
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
    ctaTo: '/prototype/search',
  },
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
