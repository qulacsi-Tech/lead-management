import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [role, setRole] = useState(null); // 'student' | 'mentor' | 'institute' | null
  const [displayName, setDisplayName] = useState('');

  const login = (selectedRole, name) => {
    setRole(selectedRole);
    setDisplayName(name);
  };

  const logout = () => {
    setRole(null);
    setDisplayName('');
  };

  const switchRole = (nextRole) => setRole(nextRole);

  return (
    <AuthContext.Provider value={{ role, displayName, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
