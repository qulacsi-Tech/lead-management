import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { mockAccounts } from '../pages/mockData';

const AUTH_KEY = 'auth';
const ACCOUNTS_KEY = 'accounts';

// Client-side "auth" — no backend session yet. Accounts created at Signup are
// kept in localStorage alongside two pre-seeded demo accounts, and Login
// looks a typed email up against that list so the role is picked up
// automatically (there is no role selector on the Login screen itself).
export function useSession() {
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

  // Used by the Profile screen to set/change account type, category, etc. —
  // those choices happen post-signup, inside the profile, not at Signup.
  const updateAccount = (patch) => {
    setAuth((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      setAccounts((list) => list.map((a) => (a.email.toLowerCase() === prev.email.toLowerCase() ? updated : a)));
      return updated;
    });
  };

  const logout = () => setAuth(null);

  return {
    auth,
    role: auth?.role,
    name: auth?.name,
    email: auth?.email,
    category: auth?.category,
    accounts,
    signup,
    login,
    updateAccount,
    logout,
  };
}
