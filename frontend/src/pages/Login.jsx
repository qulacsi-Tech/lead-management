import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useSession } from '../context/useSession';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../Api/Api';
import AuthLayout, { AuthField, AuthSubmit, AuthError } from '../components/auth/AuthLayout';
import { afterSignIn, authPath } from '../utils/authRedirect';

/**
 * The one place anyone signs in. Every "Sign in to …" button in the app sends
 * the visitor here with `next` (where to return) and `reason` (why they were
 * asked) — see context/LoginPrompt.jsx. There is no sign-in dialog any more
 * (client request, 26 Sep 2026: "change the login modal into a separate page,
 * every time navigate to there only").
 */
export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login } = useSession();
  const { role, initializing } = useAuth();

  const next = params.get('next');
  const reason = params.get('reason');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (initializing) return null;
  // Already signed in (a bookmark, or the back button after signing in).
  if (role) return <Navigate to={afterSignIn(role, next)} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const user = await login(email, password);
      navigate(afterSignIn((user?.role || '').toLowerCase(), next), { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to sign in. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue your education journey."
      reason={reason}
      pitch={{
        title: 'Your Education Journey,',
        highlight: 'Made Simple',
        body: 'One login for students, teachers, institutes and admins — your role is picked up from your account.',
        points: [
          'Follow institutes and get their latest notices',
          'Apply to admissions and teaching jobs',
          'Download free guess papers and study material',
        ],
      }}
      footer={
        <>
          New to ConnectEDus?{' '}
          <Link to={authPath('/signup', { next })} className="font-bold text-blue-600 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <AuthField
          label="Email"
          icon="mail"
          type="email"
          required
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(''); }}
          placeholder="name@example.com"
        />
        <AuthField
          label="Password"
          icon="lock"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(''); }}
          placeholder="Your password"
        />
        <AuthError>{error}</AuthError>
        <AuthSubmit busy={isSubmitting} busyLabel="Signing in…">Sign in</AuthSubmit>
      </form>
    </AuthLayout>
  );
}
