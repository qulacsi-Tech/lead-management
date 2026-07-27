import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getMe, loginApi, registerApi, getToken, setToken, ApiError } from '../Api/Api';

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
      setRole(roleToClient(data.user.role));
      return data.user;
    } catch (err) {
      // Prototype mock fallback when backend is unavailable
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
    setRole(roleToClient(tokenData.user.role));
    return tokenData.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setRole(null);
  }, []);

  const switchRole = useCallback((nextRole) => setRole(nextRole), []);

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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { ApiError };

