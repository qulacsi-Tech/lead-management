import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getMe, loginApi, registerApi, logoutApi, getToken, setToken, ApiError } from '../Api/Api';

const AuthContext = createContext(null);

const roleToClient = (role) => (role ? role.toLowerCase() : null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'student' | 'mentor' | 'institute' | 'admin' | null
  const [initializing, setInitializing] = useState(true);

  // StrictMode invokes mount effects twice in development; without this the
  // session would be verified against /auth/me twice on every page load.
  const verified = useRef(false);

  useEffect(() => {
    if (verified.current) return;
    verified.current = true;
    const token = getToken();
    if (!token) {
      setInitializing(false);
      return;
    }
    // A stored token is only ever trusted after the server confirms it. If
    // /auth/me fails for any reason the token is discarded — there is no
    // locally-decodable session to fall back on.
    getMe()
      .then((me) => {
        setUser(me);
        setRole(roleToClient(me.role));
      })
      .catch(() => setToken(null))
      .finally(() => setInitializing(false));
  }, []);

  /**
   * The server is the sole authority on identity and role.
   *
   * There is deliberately NO offline fallback here. An earlier version
   * fabricated a local session (with the role guessed from the email address)
   * whenever the backend was unreachable, which meant `/admin` was reachable
   * by anyone using an email containing "admin" while the API was down. A
   * failed login must stay a failed login — see Phase 2, P0 security fixes.
   */
  const login = useCallback(async (email, password) => {
    const data = await loginApi(email, password);
    setToken(data.access_token);
    setUser(data.user);
    // Callers (e.g. Login.jsx redirecting on role) compare against the
    // same lowercased role the context itself uses internally — the raw
    // backend value ("Admin") would never match a lowercase check.
    const clientRole = roleToClient(data.user.role);
    setRole(clientRole);
    return { ...data.user, role: clientRole };
  }, []);

  const register = useCallback(async ({ name, email, password, role: signupRole }) => {
    const roleLabel = signupRole ? signupRole[0].toUpperCase() + signupRole.slice(1) : undefined;
    // Registration failures propagate — silently swallowing them and then
    // attempting login produced a confusing "invalid credentials" error for
    // what was really a duplicate-email or validation failure.
    await registerApi({ name, email, password, role: roleLabel });
    return login(email, password);
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

