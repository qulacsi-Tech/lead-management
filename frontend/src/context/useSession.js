import { useAuth } from './AuthContext';
import { updateMyProfile, uploadProfileFile, resolveAssetUrl } from '../Api/Api';

// Thin adapter over the real, backend-authenticated `useAuth()` so every
// Feed/Profile/Dashboard/etc. page can keep using the same small surface
// (role, name, email, profile, signup, login, updateProfile, uploadPhoto,
// logout) regardless of which real role comes back from the backend.
//
// Every field the Professional Profile screen edits (headline, about,
// category, qualification, experience, subjects, skills, current/previous
// institute, role, plus photo/cover/resume uploads) is a real column on the
// backend `users` table — see backend/models/user.py and
// backend/routers/profile.py. Nothing here is client-only anymore.
export function useSession() {
  const { user, role, displayName, initializing, login: authLogin, register: authRegister, logout, patchUser } = useAuth();

  const signup = async ({ name, email, password }) => {
    return authRegister({ name, email, password, role: 'student' });
  };

  const login = async (email, password) => {
    return authLogin(email, password);
  };

  /** Partial update — pass only the fields that changed (e.g. { headline }).
   * Persists to the backend and merges the result back into the shared
   * session.
   *
   * `role` is not settable here: it is an authorization decision, owned by the
   * backend and changed only by an admin or at registration. */
  const updateProfile = async (patch) => {
    const updated = await updateMyProfile(patch);
    patchUser(updated);
    return updated;
  };

  /** kind: 'photo' | 'cover' | 'resume' */
  const uploadFile = async (kind, file) => {
    const updated = await uploadProfileFile(kind, file);
    patchUser(updated);
    return updated;
  };

  return {
    auth: user ? { role, name: displayName, email: user.email } : null,
    initializing,
    role,
    name: displayName,
    email: user?.email,
    profile: user,
    profilePhotoUrl: resolveAssetUrl(user?.profile_photo_url),
    coverPhotoUrl: resolveAssetUrl(user?.cover_photo_url),
    resumeUrl: resolveAssetUrl(user?.resume_url),
    signup,
    login,
    updateProfile,
    uploadFile,
    logout,
  };
}
