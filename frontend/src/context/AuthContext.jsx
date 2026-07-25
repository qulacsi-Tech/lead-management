import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch, getToken, setToken, ApiError } from '../utils/api';

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
    apiFetch('/auth/me')
      .then((me) => {
        setUser(me);
        setRole(roleToClient(me.role));
      })
      .catch(() => {
        setToken(null);
      })
      .finally(() => setInitializing(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const form = new URLSearchParams({ username: email, password });
    const data = await apiFetch('/auth/login', { method: 'POST', form, auth: false });
    setToken(data.access_token);
    setUser(data.user);
    setRole(roleToClient(data.user.role));
    return data.user;
  }, []);

  const register = useCallback(async ({ name, email, password, role: signupRole }) => {
    const roleLabel = signupRole ? signupRole[0].toUpperCase() + signupRole.slice(1) : undefined;
    await apiFetch('/auth/register', {
      method: 'POST',
      auth: false,
      body: { name, email, password, role: roleLabel },
    });
    return login(email, password);
  }, [login]);

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
