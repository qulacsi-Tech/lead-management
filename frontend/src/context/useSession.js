import { useMemo } from 'react';
import { useAuth } from './AuthContext';
import { updateMyProfile, uploadProfileFile, resolveAssetUrl } from '../Api/Api';

export function useSession() {
  const { user, role, displayName, initializing, login: authLogin, register: authRegister, logout, patchUser } = useAuth();

  const signup = async ({ name, email, password }) => {
    return authRegister({ name, email, password, role: 'student' });
  };

  const login = async (email, password) => {
    return authLogin(email, password);
  };

  const updateProfile = async (patch) => {
    const updated = await updateMyProfile(patch);
    patchUser(updated);
    return updated;
  };

  const uploadFile = async (kind, file) => {
    const updated = await uploadProfileFile(kind, file);
    patchUser(updated);
    return updated;
  };

  const auth = useMemo(
    () => (user ? { id: user.id, role, name: displayName, email: user.email } : null),
    [user, role, displayName]
  );

  return {
    auth,
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

