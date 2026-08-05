import { useLocalStorageState } from '../../hooks/useLocalStorageState';
import { mockAccounts } from './mockData';

const AUTH_KEY = 'proto.auth';
const ACCOUNTS_KEY = 'proto.accounts';

// Static prototype "auth". No backend — accounts created at Signup are kept
// in localStorage alongside two pre-seeded demo accounts, and Login looks a
// typed email up against that list so the role is picked up automatically
// (there is no role selector on the Login screen itself).
export function useProtoAuth() {
  const [auth, setAuth] = useLocalStorageState(AUTH_KEY, null);
  const [accounts, setAccounts] = useLocalStorageState(ACCOUNTS_KEY, mockAccounts);

  const signup = (account) => {
    setAccounts((list) => {
      const exists = list.some((a) => a.email.toLowerCase() === account.email.toLowerCase());
      return exists ? list : [...list, account];
    });
    setAuth(account);
    return account;
  };

  const login = (email) => {
    const found = accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
    if (found) setAuth(found);
    return found || null;
  };

  const logout = () => setAuth(null);

  return {
    auth,
    role: auth?.role,
    name: auth?.name,
    email: auth?.email,
    accounts,
    signup,
    login,
    logout,
  };
}
