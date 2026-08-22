// ---------------------------------------------------------------------------
// Account kind — is this session a PERSON or an ORGANISATION?
//
// Distinct from the permission question ("may this user do X?"), which
// `useIsInstituteAdmin` and the backend's authz module answer. This one drives
// presentation: personal-history UI (schooling, work experience, CV) and the
// "set up your own institute" entry point describe an individual, and an
// organisation account should never be offered them.
//
// There are two ways to be an organisation:
//   1. role === 'institute'  — an account the Admin panel provisioned.
//   2. is_organization       — a self-registered user who declared itself one.
//
// The second exists because self-registration always creates an individual and
// role changes are admin-only, so without the flag a self-registered
// organisation would be stuck with a person's profile forever.
// ---------------------------------------------------------------------------

/** Client-side roles (lowercase, as `useSession` reports them) that are
 *  organisations by virtue of how the account was created. */
export const ORG_ROLES = new Set(['institute']);

/** True when the ROLE alone settles it. Prefer `isOrgAccount` where the user
 *  profile is available — it also honours the self-declared flag. */
export function isOrgRole(role) {
  return ORG_ROLES.has(role);
}

/**
 * The question almost every caller actually wants answered.
 * @param {string} role     lowercase client-side role
 * @param {object} profile  the user record from the session (may be null)
 */
export function isOrgAccount(role, profile) {
  return isOrgRole(role) || !!profile?.is_organization;
}
