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
