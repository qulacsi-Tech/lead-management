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

/** Organisation details for the current account (null when nothing saved
 *  yet). Stored against the same `institutes` record the Admin panel reads. */
export const fetchMyOrganization = async () => apiFetch('/profile/me/organization');

/** Upsert the current account's organisation details. Also marks the account
 *  as an organisation server-side. */
export const saveMyOrganization = async (details) =>
  apiFetch('/profile/me/organization', { method: 'PUT', body: details });

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

// Mentor accounts are PROVISIONED BY A MAIN ADMIN on someone else's behalf, so
// the backend requires an admin session here (see routers/register.py). This
// must be sent WITH the caller's token — omitting it makes the server reject
// the request as unauthenticated before it ever gets to the role check.
//
// Institutes are no longer registered as accounts: an institute is a Page, and
// its admin login is created alongside it by createPage/assignPageAdmin below.
export const registerMentor = async (data) =>
  apiFetch('/register/mentor', { method: 'POST', body: data });


// ----------------------------------------------------
// Admin Data Endpoints
// ----------------------------------------------------

export const fetchAdminStudents = async () => apiFetch('/admin/students');
export const fetchAdminMentors = async () => apiFetch('/admin/mentors');
export const fetchAdminEnquiries = async () => apiFetch('/admin/enquiries');

// ----------------------------------------------------
// Institute Page Endpoints (Main Admin console)
// ----------------------------------------------------

export const fetchPages = async (q) =>
  apiFetch(`/pages${q ? `?q=${encodeURIComponent(q)}` : ''}`);

export const fetchPage = async (pageId) => apiFetch(`/pages/${pageId}`);

/** Enabled institutes, readable without a session — backs the public feed's
 *  suggestions rail and names the institute behind each notice. */
export const fetchPublicPages = async (q) =>
  apiFetch(`/pages/public${q ? `?q=${encodeURIComponent(q)}` : ''}`);

/** Published admission notices and job vacancies across every enabled
 *  institute. Public: the feed is readable without an account. */
/** `visibility: 'platform'` narrows to ads cleared to run on other institutes'
 *  pages; `excludePageId` drops the page doing the asking. The feed passes
 *  neither and is unaffected. */
export const fetchPublicOpportunities = async ({
  type, limit = 30, visibility, excludePageId,
} = {}) => {
  const params = new URLSearchParams();
  if (type) params.set('type', type);
  if (visibility) params.set('visibility', visibility);
  if (excludePageId) params.set('exclude_page_id', excludePageId);
  params.set('limit', String(limit));
  return apiFetch(`/opportunities?${params}`);
};

/** Like / unlike a published notice or vacancy. Both are idempotent server
 *  side and return { liked, likes_count }, so the button renders from the
 *  server's answer rather than from a guess. Requires a session. */
export const likeOpportunity = async (opportunityId) =>
  apiFetch(`/opportunities/${opportunityId}/like`, { method: 'POST' });

export const unlikeOpportunity = async (opportunityId) =>
  apiFetch(`/opportunities/${opportunityId}/like`, { method: 'DELETE' });

// ----------------------------------------------------
// Notifications
// ----------------------------------------------------

export const fetchNotifications = async ({ unreadOnly = false, limit = 30 } = {}) => {
  const params = new URLSearchParams();
  if (unreadOnly) params.set('unread_only', 'true');
  params.set('limit', String(limit));
  return apiFetch(`/notifications?${params}`);
};

export const fetchUnreadCount = async () => apiFetch('/notifications/unread-count');

export const markNotificationRead = async (id) =>
  apiFetch(`/notifications/${id}/read`, { method: 'POST' });

export const markAllNotificationsRead = async () =>
  apiFetch('/notifications/read-all', { method: 'POST' });

/** Pages the signed-in user follows. Requires a session. */
export const fetchMyFollows = async () => apiFetch('/follows');

/** The institute pages the signed-in user administers — the real answer to
 *  "do I have an Institute Console?", from the page_admins table. */
export const fetchMyPages = async () => apiFetch('/pages/mine');

export const createPage = async (payload) =>
  apiFetch('/pages', { method: 'POST', body: payload });

export const updatePage = async (pageId, patch) =>
  apiFetch(`/pages/${pageId}`, { method: 'PATCH', body: patch });

export const deletePage = async (pageId) =>
  apiFetch(`/pages/${pageId}`, { method: 'DELETE' });

export const fetchPageAdmins = async (pageId) => apiFetch(`/pages/${pageId}/admins`);

/**
 * role: 'OWNER' | 'ADMIN'.
 *
 * `name`/`password` are used only when no account exists for `email` yet — the
 * admin console creates the institute and its login in one step. An existing
 * account is linked untouched; see backend `_resolve_or_create_admin`.
 */
export const assignPageAdmin = async (pageId, { email, role = 'ADMIN', name, password }) =>
  apiFetch(`/pages/${pageId}/admins`, {
    method: 'POST',
    body: { email, role, name: name || undefined, password: password || undefined },
  });

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

/** Public institute page by its vanity slug.
 *
 *  Anonymous-safe: the endpoint uses `get_optional_user`, and `apiFetch` simply
 *  omits the Authorization header when nobody is signed in. Signed-in callers
 *  additionally get `is_page_admin` / `is_following` resolved for them. */
/** Resolve a canonical `/college/sait/indore` path to its page. */
export const resolvePageByPath = async (path) =>
  apiFetch(`/pages/resolve?path=${encodeURIComponent(path)}`, { auth: !!getToken() });

/** Legacy single-segment lookup, used only to redirect old `/slug` links. */
export const fetchPageBySlug = async (slug) =>
  apiFetch(`/pages/slug/${encodeURIComponent(slug)}`);

/** Enquiry from an institute's public page. Works for anonymous visitors. */
export const submitPageEnquiry = async (pageId, payload) =>
  apiFetch(`/pages/${pageId}/enquiries`, { method: 'POST', body: payload });

export const followPage = async (pageId) =>
  apiFetch(`/follows/${pageId}`, { method: 'POST' });

export const unfollowPage = async (pageId) =>
  apiFetch(`/follows/${pageId}`, { method: 'DELETE' });

export const fetchPageCourses = async (pageId) => apiFetch(`/pages/${pageId}/courses`);

export const createCourse = async (pageId, payload) =>
  apiFetch(`/pages/${pageId}/courses`, { method: 'POST', body: payload });

export const updateCourse = async (pageId, courseId, patch) =>
  apiFetch(`/pages/${pageId}/courses/${courseId}`, { method: 'PATCH', body: patch });

export const deleteCourse = async (pageId, courseId) =>
  apiFetch(`/pages/${pageId}/courses/${courseId}`, { method: 'DELETE' });

export const fetchPageOpportunities = async (pageId) => apiFetch(`/pages/${pageId}/opportunities`);

export const createOpportunity = async (pageId, payload) =>
  apiFetch(`/pages/${pageId}/opportunities`, { method: 'POST', body: payload });

export const updateOpportunity = async (pageId, oppId, patch) =>
  apiFetch(`/pages/${pageId}/opportunities/${oppId}`, { method: 'PATCH', body: patch });

export const deleteOpportunity = async (pageId, oppId) =>
  apiFetch(`/pages/${pageId}/opportunities/${oppId}`, { method: 'DELETE' });

export const pushToTopOpportunity = async (pageId, oppId) =>
  apiFetch(`/pages/${pageId}/opportunities/${oppId}/push-to-top`, { method: 'POST' });

// ----------------------------------------------------
// Applications to an Admission Notice / Job Vacancy
//
// Applying never navigates away from the institute page — an applicant with no
// account creates their profile in the same request and the response carries a
// token to sign them in on the spot. See backend routers/applications.py.
// ----------------------------------------------------

/** Anonymous-capable. Returns { application, access_token, account_created }. */
export const applyToOpportunity = async (opportunityId, payload) =>
  apiFetch(`/opportunities/${opportunityId}/applications`, { method: 'POST', body: payload });

/** null when not signed in or not yet applied — lets the button show "Applied". */
export const fetchMyApplication = async (opportunityId) =>
  apiFetch(`/opportunities/${opportunityId}/applications/mine`);

/** INSTITUTE-OWNED inbox of applications received. */
export const fetchPageApplications = async (pageId, { opportunityId, status } = {}) => {
  const qs = new URLSearchParams();
  if (opportunityId) qs.set('opportunity_id', opportunityId);
  if (status) qs.set('status', status);
  const query = qs.toString();
  return apiFetch(`/pages/${pageId}/applications${query ? `?${query}` : ''}`);
};

export const updateApplication = async (pageId, applicationId, patch) =>
  apiFetch(`/pages/${pageId}/applications/${applicationId}`, { method: 'PATCH', body: patch });

export const fetchPageEnquiries = async (pageId) =>
  apiFetch(`/pages/${pageId}/enquiries`);

export const updatePageEnquiry = async (pageId, enquiryId, patch) =>
  apiFetch(`/pages/${pageId}/enquiries/${enquiryId}`, { method: 'PATCH', body: patch });

export const fetchMyCredits = async () => apiFetch('/credits/me');

export const togglePageStatus = async (pageId, isEnabled) =>
  apiFetch(`/pages/${pageId}/status`, { method: 'PATCH', body: { is_enabled: isEnabled } });

export const addSectionItem = async (pageId, sectionName, item) =>
  apiFetch(`/pages/${pageId}/sections/${sectionName}/items`, { method: 'POST', body: { item } });

export const updateSectionItem = async (pageId, sectionName, itemId, item) =>
  apiFetch(`/pages/${pageId}/sections/${sectionName}/items/${itemId}`, { method: 'PATCH', body: { item } });

export const deleteSectionItem = async (pageId, sectionName, itemId) =>
  apiFetch(`/pages/${pageId}/sections/${sectionName}/items/${itemId}`, { method: 'DELETE' });



// ----------------------------------------------------
// Guess papers & study material
//
// The third ad type a page publishes, alongside admission notices and
// vacancies. Note what is missing: there is no "who downloaded this" call,
// because no such endpoint exists. The institute is given the count and
// nothing else — see backend/models/study_paper.py.
// ----------------------------------------------------

export const fetchPagePapers = async (pageId) => apiFetch(`/pages/${pageId}/papers`);

export const createPaper = async (pageId, payload) =>
  apiFetch(`/pages/${pageId}/papers`, { method: 'POST', body: payload });

export const updatePaper = async (pageId, paperId, patch) =>
  apiFetch(`/pages/${pageId}/papers/${paperId}`, { method: 'PATCH', body: patch });

export const deletePaper = async (pageId, paperId) =>
  apiFetch(`/pages/${pageId}/papers/${paperId}`, { method: 'DELETE' });

export const pushToTopPaper = async (pageId, paperId) =>
  apiFetch(`/pages/${pageId}/papers/${paperId}/push-to-top`, { method: 'POST' });

/** Attach the PDF. A paper stays a Draft until this succeeds — the backend
 *  refuses to publish one with no file, so a reader can never click through to
 *  a dead download. */
export const uploadPaperFile = async (pageId, paperId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiUpload(`/pages/${pageId}/papers/${paperId}/file`, formData);
};

/** Published papers, optionally for one page. Anonymous-safe. */
export const fetchPublicPapers = async ({
  pageId, kind, limit = 30, visibility, excludePageId,
} = {}) => {
  const params = new URLSearchParams();
  if (pageId) params.set('page_id', pageId);
  if (kind) params.set('kind', kind);
  if (visibility) params.set('visibility', visibility);
  if (excludePageId) params.set('exclude_page_id', excludePageId);
  params.set('limit', String(limit));
  return apiFetch(`/papers?${params}`, { auth: !!getToken() });
};

/** Records the download and returns `{ file_url, downloads_count }`.
 *  Requires a session — the count is of distinct people, not clicks. */
export const downloadPaper = async (paperId) =>
  apiFetch(`/papers/${paperId}/download`, { method: 'POST' });

// --- Ad description templates (PLATFORM-owned) -----------------------------
// Anyone signed in can read the list; only a Main Admin can change it.

export const fetchAdDescriptionTemplates = async (section) =>
  apiFetch(`/ad-templates/descriptions${section ? `?section=${encodeURIComponent(section)}` : ''}`);

export const createAdDescriptionTemplate = async ({ section, text }) =>
  apiFetch('/ad-templates/descriptions', { method: 'POST', body: { section, text } });

export const updateAdDescriptionTemplate = async (id, patch) =>
  apiFetch(`/ad-templates/descriptions/${id}`, { method: 'PATCH', body: patch });

export const deleteAdDescriptionTemplate = async (id) =>
  apiFetch(`/ad-templates/descriptions/${id}`, { method: 'DELETE' });
