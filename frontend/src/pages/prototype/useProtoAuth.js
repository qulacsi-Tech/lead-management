import { useLocalStorageState } from '../../hooks/useLocalStorageState';

const KEY = 'proto.auth';

// Static prototype "auth" — just remembers which role the reviewer picked
// on the landing page so every screen after it can react to role. No real
// authentication, no backend call.
export function useProtoAuth() {
  const [auth, setAuth] = useLocalStorageState(KEY, null);

  const login = (role, name) => setAuth({ role, name });
  const logout = () => setAuth(null);

  return { auth, role: auth?.role, name: auth?.name, login, logout };
}
