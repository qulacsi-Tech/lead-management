import { createContext, useCallback, useContext, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authPath } from '../utils/authRedirect';

/**
 * "Sign in to …" from anywhere in the app.
 *
 * This used to open a sign-in dialog over the current page. The client asked
 * for a separate page instead (26 Sep 2026: "change the login modal into a
 * separate page, every time navigate to there only"), so `openLogin` now goes
 * to /login, carrying the current page as `next` and the reason line to show
 * there. Signing in returns the visitor to the page they left.
 *
 * The API is unchanged so the callers — follow, like, apply, download — did
 * not need touching.
 */
const LoginPromptContext = createContext(null);

export function LoginPromptProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  /** @param reason short line explaining why signing in is being asked for. */
  const openLogin = useCallback(
    (reason = '') => {
      const here = `${location.pathname}${location.search}${location.hash}`;
      navigate(authPath('/login', { next: here, reason: typeof reason === 'string' ? reason : '' }));
    },
    [navigate, location.pathname, location.search, location.hash],
  );

  // Kept for callers written against the dialog; there is nothing to close.
  const closeLogin = useCallback(() => {}, []);

  const value = useMemo(() => ({ openLogin, closeLogin }), [openLogin, closeLogin]);

  return <LoginPromptContext.Provider value={value}>{children}</LoginPromptContext.Provider>;
}

export function useLoginPrompt() {
  const ctx = useContext(LoginPromptContext);
  if (!ctx) throw new Error('useLoginPrompt must be used within LoginPromptProvider');
  return ctx;
}
