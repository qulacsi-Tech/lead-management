import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getMe, loginApi, registerApi, logoutApi, getToken, setToken, ApiError } from '../Api/Api';

const AuthContext = createContext(null);

const roleToClient = (role) => (role ? role.toLowerCase() : null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'student' | 'mentor' | 'institute' | 'admin' | null
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setInitializing(false);
      return;
    }
    getMe()
      .then((me) => {
        setUser(me);
        setRole(roleToClient(me.role));
      })
      .catch(() => {
        try {
          const mock = JSON.parse(token);
          if (mock && mock.user) {
            setUser(mock.user);
            setRole(roleToClient(mock.user.role));
            return;
          }
        } catch {}
        setToken(null);
      })
      .finally(() => setInitializing(false));
  }, []);

  const login = useCallback(async (email, password, requestedRole) => {
    try {
      const data = await loginApi(email, password);
      setToken(data.access_token);
      setUser(data.user);
      const clientRole = roleToClient(data.user.role);
      setRole(clientRole);
      // Callers (e.g. Login.jsx redirecting on role) compare against the
      // same lowercased role the context itself uses internally — the raw
      // backend value ("Admin") would never match a lowercase check.
      return { ...data.user, role: clientRole };
    } catch (err) {
      // The backend rejected the credentials (wrong password, unknown
      // email, inactive account) — a real answer, not an outage. Surface it
      // instead of silently logging the user into a fake session.
      if (err instanceof ApiError) throw err;

      // Backend unreachable (network/connection error): offline demo fallback.
      const determinedRole = requestedRole || (email.includes('admin') ? 'admin' : 'student');
      const mockUser = {
        id: `usr-${Date.now()}`,
        name: email.split('@')[0].replace('.', ' ').replace(/^./, (c) => c.toUpperCase()),
        email,
        role: determinedRole,
      };
      const mockToken = JSON.stringify({ access_token: `mock-${Date.now()}`, user: mockUser });
      setToken(mockToken);
      setUser(mockUser);
      setRole(roleToClient(determinedRole));
      return mockUser;
    }
  }, []);

  const register = useCallback(async ({ name, email, password, role: signupRole, ...extra }) => {
    const roleLabel = signupRole ? signupRole[0].toUpperCase() + signupRole.slice(1) : undefined;
    try {
      await registerApi({ name, email, password, role: roleLabel });
    } catch (err) {
      // Prototype fallback when offline
    }
    return login(email, password, signupRole);
  }, [login]);

  /**
   * Called by role-specific registration modals after a successful
   * POST /register/{role} that returns a TokenResponse.
   * Avoids a second login round-trip.
   */
  const loginFromToken = useCallback((tokenData) => {
    setToken(tokenData.access_token);
    setUser(tokenData.user);
    const clientRole = roleToClient(tokenData.user.role);
    setRole(clientRole);
    return { ...tokenData.user, role: clientRole };
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Best-effort: even if the revoke call fails (offline, mock token,
      // already-expired token) still clear the local session below.
    }
    setToken(null);
    setUser(null);
    setRole(null);
  }, []);

  const switchRole = useCallback((nextRole) => setRole(nextRole), []);

  // Merge a partial user update (e.g. after PATCH /profile/me) into the
  // shared session without a full re-fetch. Keeps the separate `role` state
  // in sync too, since a profile update can change role (e.g. Account Setup
  // switching Student -> Professional).
  const patchUser = useCallback((patch) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
    if (patch.role) setRole(roleToClient(patch.role));
  }, []);

  const value = {
    user,
    role,
    displayName: user?.name || '',
    initializing,
    login,
    register,
    loginFromToken,
    logout,
    switchRole,
    patchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { ApiError };

