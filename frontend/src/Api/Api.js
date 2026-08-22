const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
// Uploaded files (photos, resumes) are served from the backend's root, not
// under /api — strip the /api suffix to build absolute asset URLs.
const ASSET_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');
const TOKEN_KEY = 'lm.token';

/** Turn a relative "/uploads/..." path from the backend into an absolute URL. */
export function resolveAssetUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${ASSET_BASE_URL}${path}`;
}

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

/** Multipart upload — deliberately doesn't set Content-Type so the browser
 * fills in the multipart boundary itself. */
export async function apiUpload(path, formData) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { method: 'POST', headers, body: formData });
  if (!res.ok) throw new ApiError(await parseError(res), res.status);
  return res.json();
}

// ----------------------------------------------------
// Authentication Endpoints (Admin login)
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

export const logoutApi = async () => {
  return apiFetch('/auth/logout', { method: 'POST' });
};

export const changePassword = async ({ current_password, new_password }) => {
  return apiFetch('/auth/change-password', {
    method: 'POST',
    body: { current_password, new_password },
  });
};

// ----------------------------------------------------
// Profile Endpoints
// ----------------------------------------------------

export const fetchMyProfile = async () => apiFetch('/profile/me');

/** Partial update — pass only the fields that changed. */
export const updateMyProfile = async (patch) =>
  apiFetch('/profile/me', { method: 'PATCH', body: patch });

/** kind: 'photo' | 'cover' | 'resume' */
export const uploadProfileFile = async (kind, file) => {
  const formData = new FormData();
  formData.append('kind', kind);
  formData.append('file', file);
  return apiUpload('/profile/me/upload', formData);
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

/** Public self-service signup — deliberately unauthenticated. */
export const registerStudent = async (data) =>
  apiFetch('/register/student', { method: 'POST', auth: false, body: data });

// Mentor and Institute accounts are PROVISIONED BY A MAIN ADMIN on someone
// else's behalf, so the backend requires an admin session on these two (see
// routers/register.py). They must be sent WITH the caller's token — omitting
// it makes the server reject the request as unauthenticated before it ever
// gets to the role check.
export const registerMentor = async (data) =>
  apiFetch('/register/mentor', { method: 'POST', body: data });

export const registerInstitute = async (data) =>
  apiFetch('/register/institute', { method: 'POST', body: data });

// ----------------------------------------------------
// Admin Data Endpoints
// ----------------------------------------------------

export const fetchAdminStudents = async () => apiFetch('/admin/students');
export const fetchAdminMentors = async () => apiFetch('/admin/mentors');
export const fetchAdminInstitutes = async () => apiFetch('/admin/institutes');
export const fetchAdminEnquiries = async () => apiFetch('/admin/enquiries');

/** Main Admin edit of an institute account. `patch.password` resets the
 *  institute's sign-in password; `patch.email` changes the login id. Omit
 *  either to leave it untouched. */
export const updateAdminInstitute = async (instituteId, patch) =>
  apiFetch(`/admin/institutes/${instituteId}`, { method: 'PATCH', body: patch });

// ----------------------------------------------------
// Institute Page Endpoints (Main Admin console)
// ----------------------------------------------------

export const fetchPages = async (q) =>
  apiFetch(`/pages${q ? `?q=${encodeURIComponent(q)}` : ''}`);

export const fetchPage = async (pageId) => apiFetch(`/pages/${pageId}`);

export const createPage = async (payload) =>
  apiFetch('/pages', { method: 'POST', body: payload });

export const updatePage = async (pageId, patch) =>
  apiFetch(`/pages/${pageId}`, { method: 'PATCH', body: patch });

export const deletePage = async (pageId) =>
  apiFetch(`/pages/${pageId}`, { method: 'DELETE' });

export const fetchPageAdmins = async (pageId) => apiFetch(`/pages/${pageId}/admins`);

/** role: 'OWNER' | 'ADMIN' */
export const assignPageAdmin = async (pageId, { email, role = 'ADMIN' }) =>
  apiFetch(`/pages/${pageId}/admins`, { method: 'POST', body: { email, role } });

export const revokePageAdmin = async (pageId, userId) =>
  apiFetch(`/pages/${pageId}/admins/${userId}`, { method: 'DELETE' });

/** kind: 'logo' | 'banner' | 'gallery' */
export const uploadPageMedia = async (pageId, kind, file, caption = '') => {
  const formData = new FormData();
  formData.append('kind', kind);
  formData.append('caption', caption);
  formData.append('file', file);
  return apiUpload(`/pages/${pageId}/media`, formData);
};

export const fetchPageCourses = async (pageId) => apiFetch(`/pages/${pageId}/courses`);

export const fetchPageOpportunities = async (pageId) => apiFetch(`/pages/${pageId}/opportunities`);
