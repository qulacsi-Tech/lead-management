const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value) {
  return EMAIL_RE.test(String(value || '').trim());
}

export function isValidMobile(value) {
  return /^\d{10}$/.test(String(value || '').trim());
}

export function required(value) {
  return String(value || '').trim().length > 0;
}
