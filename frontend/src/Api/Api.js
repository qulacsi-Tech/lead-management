const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const TOKEN_KEY = 'lm.token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function parseError(res) {
  try {
    const body = await res.json();
    return body.detail || res.statusText;
  } catch {
    return res.statusText;
  }
}

export async function apiFetch(path, { method = 'GET', body, form, auth = true } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (form) headers['Content-Type'] = 'application/x-www-form-urlencoded';
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: form ? form : body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    throw new ApiError(await parseError(res), res.status);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ----------------------------------------------------
// Authentication Endpoints
// ----------------------------------------------------

export const loginApi = async (email, password) => {
  const form = new URLSearchParams({ username: email, password });
  return apiFetch('/auth/login', { method: 'POST', form, auth: false });
};

export const registerApi = async ({ name, email, password, role }) => {
  return apiFetch('/auth/register', {
    method: 'POST',
    auth: false,
    body: { name, email, password, role },
  });
};

export const getMe = async () => {
  return apiFetch('/auth/me');
};

export const changePassword = async ({ current_password, new_password }) => {
  return apiFetch('/auth/change-password', {
    method: 'POST',
    body: { current_password, new_password },
  });
};

// ----------------------------------------------------
// Lead Endpoints
// ----------------------------------------------------

export const fetchLeads = async () => {
  return apiFetch('/leads');
};

export const fetchLeadById = async (id) => {
  return apiFetch(`/leads/${id}`);
};

export const createLead = async (leadData) => {
  return apiFetch('/leads', {
    method: 'POST',
    body: leadData,
  });
};

export const updateLead = async (id, leadData) => {
  return apiFetch(`/leads/${id}`, {
    method: 'PUT',
    body: leadData,
  });
};

export const deleteLead = async (id) => {
  return apiFetch(`/leads/${id}`, {
    method: 'DELETE',
  });
};

// ----------------------------------------------------
// Users & Dashboard Endpoints
// ----------------------------------------------------

export const fetchUsers = async () => {
  return apiFetch('/users');
};

export const fetchDashboardStats = async () => {
  return apiFetch('/dashboard/stats');
};

export const fetchActivities = async () => {
  return apiFetch('/activities');
};

export const fetchTasks = async () => {
  return apiFetch('/tasks');
};

// ----------------------------------------------------
// Geography Endpoints (India States / Districts / Blocks)
// ----------------------------------------------------

export const fetchStates = async () => apiFetch('/geo/states', { auth: false });
export const fetchDistricts = async (state) =>
  apiFetch(`/geo/districts/${encodeURIComponent(state)}`, { auth: false });
export const fetchBlocks = async (state, district) =>
  apiFetch(`/geo/blocks/${encodeURIComponent(state)}/${encodeURIComponent(district)}`, { auth: false });

// ----------------------------------------------------
// Role-Specific Registration Endpoints
// ----------------------------------------------------

/**
 * Register a new student. Returns TokenResponse (access_token + user).
 * @param {{ name, email, password, phone?, city?, target_course?, current_school? }} data
 */
export const registerStudent = async (data) =>
  apiFetch('/register/student', { method: 'POST', auth: false, body: data });

/**
 * Register a new mentor. Returns TokenResponse (access_token + user).
 * @param {{ name, email, password, phone?, domain?, company?, experience_level? }} data
 */
export const registerMentor = async (data) =>
  apiFetch('/register/mentor', { method: 'POST', auth: false, body: data });

/**
 * Register a new institute. Returns TokenResponse (access_token + user).
 * @param {{ name, email, password, phone?, state?, district?, block?, city?, website? }} data
 */
export const registerInstitute = async (data) =>
  apiFetch('/register/institute', { method: 'POST', auth: false, body: data });

// ----------------------------------------------------
// Admin Data Endpoints
// ----------------------------------------------------

export const fetchAdminStudents = async () => apiFetch('/admin/students');
export const fetchAdminMentors = async () => apiFetch('/admin/mentors');
export const fetchAdminInstitutes = async () => apiFetch('/admin/institutes');

// ----------------------------------------------------
// Mentor Profile Endpoints
// ----------------------------------------------------

export const fetchMyMentorProfile = async () => apiFetch('/mentor/me');

export const updateMyMentorProfile = async (data) =>
  apiFetch('/mentor/me', { method: 'PUT', body: data });

export const fetchMyMentorStats = async () => apiFetch('/mentor/me/stats');

// ----------------------------------------------------
// Opportunity (Job Posting) Endpoints
// ----------------------------------------------------

export const fetchMyOpportunities = async () => apiFetch('/opportunities/mine');

export const createOpportunity = async (data) =>
  apiFetch('/opportunities', { method: 'POST', body: data });

export const updateOpportunity = async (id, data) =>
  apiFetch(`/opportunities/${id}`, { method: 'PUT', body: data });

export const deleteOpportunity = async (id) =>
  apiFetch(`/opportunities/${id}`, { method: 'DELETE' });

// ----------------------------------------------------
// Sample Paper Endpoints
// ----------------------------------------------------

/** List published papers (students browsing). Optional filters: subject, target_class, search. */
export const fetchPapers = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const qs = params.toString();
  return apiFetch(`/papers${qs ? `?${qs}` : ''}`);
};

export const fetchPaperById = async (id) => apiFetch(`/papers/${id}`);

/** Mentor's own papers (any status). */
export const fetchMyPapers = async () => apiFetch('/papers/mentor/me');

/**
 * Create a paper with questions.
 * @param {{ title, subject, target_class?, description?, status?, questions: {question_text, options, correct_answer}[] }} data
 */
export const createPaper = async (data) =>
  apiFetch('/papers', { method: 'POST', body: data });

export const updatePaper = async (id, data) =>
  apiFetch(`/papers/${id}`, { method: 'PUT', body: data });

export const deletePaper = async (id) =>
  apiFetch(`/papers/${id}`, { method: 'DELETE' });

/** Student submits answers for a paper: { answers: number[] } (option index per question, in order). */
export const submitPaperAttempt = async (id, answers) =>
  apiFetch(`/papers/${id}/attempt`, { method: 'POST', body: { answers } });

// ----------------------------------------------------
// Mentor Discovery Endpoints (student-facing)
// ----------------------------------------------------

/** Browse all mentors. Optional filters: domain, search. */
export const fetchMentors = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const qs = params.toString();
  return apiFetch(`/mentors${qs ? `?${qs}` : ''}`);
};

export const fetchMentorById = async (id) => apiFetch(`/mentors/${id}`);

export const followMentor = async (id) =>
  apiFetch(`/mentors/${id}/follow`, { method: 'POST' });

export const unfollowMentor = async (id) =>
  apiFetch(`/mentors/${id}/follow`, { method: 'DELETE' });

/** Mentors the current student follows. */
export const fetchMyFollowing = async () => apiFetch('/students/me/following');

/** The current student's own profile (name, target_course, etc). */
export const fetchMyStudentProfile = async () => apiFetch('/students/me');

/** The current student's own submitted practice-paper attempts. */
export const fetchMyAttempts = async () => apiFetch('/papers/attempts/me');

// ----------------------------------------------------
// Enquiries Endpoints (student "Looking for Coaching/College")
// ----------------------------------------------------

/** Student submits a Coaching/College enquiry: { enquiry_type: 'Coaching'|'College', state, course }. */
export const createEnquiry = async (data) =>
  apiFetch('/enquiries', { method: 'POST', body: data });

/** Student's own submitted enquiries. */
export const fetchMyEnquiries = async () => apiFetch('/enquiries/me');

/** Institute: browse enquiries not yet unlocked (is_hot flag when state matches institute's own). */
export const fetchEnquiries = async () => apiFetch('/enquiries');

/** Institute: unlock an enquiry's full contact details (deducts credits). */
export const unlockEnquiry = async (id) =>
  apiFetch(`/enquiries/${id}/unlock`, { method: 'POST' });

/** Institute: enquiries already unlocked, with full contact detail. */
export const fetchUnlockedEnquiries = async () => apiFetch('/enquiries/unlocked');

/** Institute's own profile (state, credits balance, etc). */
export const fetchMyInstituteProfile = async () => apiFetch('/institute/me');

/** Admin: all student enquiries with matching-institutes count. */
export const fetchAdminEnquiries = async () => apiFetch('/admin/enquiries');

