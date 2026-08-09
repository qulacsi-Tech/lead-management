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

export const changePassword = async ({ current_password, new_password }) => {
  return apiFetch('/auth/change-password', {
    method: 'POST',
    body: { current_password, new_password },
  });
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
// Role-Specific Registration Endpoints (Admin provisions accounts)
// ----------------------------------------------------

export const registerStudent = async (data) =>
  apiFetch('/register/student', { method: 'POST', auth: false, body: data });

export const registerMentor = async (data) =>
  apiFetch('/register/mentor', { method: 'POST', auth: false, body: data });

export const registerInstitute = async (data) =>
  apiFetch('/register/institute', { method: 'POST', auth: false, body: data });

// ----------------------------------------------------
// Admin Data Endpoints
// ----------------------------------------------------

export const fetchAdminStudents = async () => apiFetch('/admin/students');
export const fetchAdminMentors = async () => apiFetch('/admin/mentors');
export const fetchAdminInstitutes = async () => apiFetch('/admin/institutes');
export const fetchAdminEnquiries = async () => apiFetch('/admin/enquiries');
