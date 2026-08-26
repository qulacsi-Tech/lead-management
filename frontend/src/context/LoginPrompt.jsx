import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { Input, FormGroup } from '../components/ui/Field';
import { useSession } from './useSession';
import { ApiError } from '../Api/Api';

/**
 * Signing in without leaving the page.
 *
 * The feed and institute pages are public now, so a visitor arrives with
 * context — a post they want to like, an institute they want to follow.
 * Bouncing them to a full-page login loses that context and the scroll
 * position. Any component can call `openLogin()` instead and the visitor
 * carries on where they were.
 *
 * `/login` still exists as a real page for deep links and bookmarks.
 */
const LoginPromptContext = createContext(null);

function LoginDialog({ open, onClose, reason }) {
  const navigate = useNavigate();
  const { login } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      setEmail('');
      setPassword('');
      onClose();
      const role = (user?.role || '').toLowerCase();
      if (role === 'admin') navigate('/admin');
      else if (role === 'institute') navigate('/institute');

    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={submitting ? () => {} : onClose} width={380}>
      <h2 className="text-lg font-bold text-on-surface m-0 mb-1">Sign in</h2>
      <p className="text-xs text-on-surface-variant m-0 mb-5">
        {reason || 'One login for everyone — your role is resolved from your account.'}
      </p>

      <form onSubmit={submit} className="space-y-4">
        <FormGroup label="Email">
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            placeholder="name@example.com"
          />
        </FormGroup>
        <FormGroup label="Password">
          <Input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </FormGroup>

        {error && <p className="text-error text-xs mb-0">{error}</p>}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div className="mt-5 pt-4 border-t border-outline-variant">
        <p className="text-sm text-on-surface-variant mb-0">
          New here?{' '}
          <Link to="/signup" onClick={onClose} className="text-primary font-semibold hover:underline">
            Join now
          </Link>
        </p>
      </div>
    </Modal>
  );
}

export function LoginPromptProvider({ children }) {
  const [state, setState] = useState({ open: false, reason: '' });

  /** @param reason short line explaining why signing in is being asked for. */
  const openLogin = useCallback((reason = '') => setState({ open: true, reason }), []);
  const closeLogin = useCallback(() => setState((s) => ({ ...s, open: false })), []);

  const value = useMemo(() => ({ openLogin, closeLogin }), [openLogin, closeLogin]);

  return (
    <LoginPromptContext.Provider value={value}>
      {children}
      <LoginDialog open={state.open} onClose={closeLogin} reason={state.reason} />
    </LoginPromptContext.Provider>
  );
}

export function useLoginPrompt() {
  const ctx = useContext(LoginPromptContext);
  if (!ctx) throw new Error('useLoginPrompt must be used within LoginPromptProvider');
  return ctx;
}
