import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useSession } from '../context/useSession';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../Api/Api';
import AuthLayout, { AuthField, AuthSubmit, AuthError } from '../components/auth/AuthLayout';
import { afterSignIn, authPath } from '../utils/authRedirect';

export default function Signup() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { signup } = useSession();
  const { role, initializing } = useAuth();
  const next = params.get('next');

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (initializing) return null;
  if (role) return <Navigate to={afterSignIn(role, next)} replace />;

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      // Account type (Professional/Student), category and Institute Page are
      // all set up afterwards, from the Profile screen — not asked here.
      await signup({ name: form.name, email: form.email, password: form.password });
      navigate('/profile', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to create your account. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Just the basics — you'll set up your profile right after."
      pitch={{
        title: 'Search, Discover,',
        highlight: 'Connect',
        body: 'Join the network that brings students, teachers and institutes together — all in one place.',
        points: [
          'Find colleges, coaching, schools and universities',
          'Send enquiries and track the responses',
          'Build your profile and create an Institute Page',
        ],
      }}
      footer={
        <>
          Already have an account?{' '}
          <Link to={authPath('/login', { next })} className="font-bold text-blue-600 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <AuthField
          label="Full name"
          icon="person"
          required
          autoComplete="name"
          autoFocus
          value={form.name}
          onChange={set('name')}
          placeholder="Your name"
        />
        <AuthField
          label="Email"
          icon="mail"
          type="email"
          required
          autoComplete="email"
          value={form.email}
          onChange={set('email')}
          placeholder="name@example.com"
        />
        <AuthField
          label="Phone (optional)"
          icon="call"
          type="tel"
          autoComplete="tel"
          value={form.phone}
          onChange={set('phone')}
          placeholder="+91 XXXXX XXXXX"
        />
        <AuthField
          label="Password"
          icon="lock"
          type="password"
          required
          autoComplete="new-password"
          value={form.password}
          onChange={set('password')}
          placeholder="Choose a password"
        />
        <AuthError>{error}</AuthError>
        <AuthSubmit busy={isSubmitting} busyLabel="Creating account…">Create account</AuthSubmit>
      </form>
    </AuthLayout>
  );
}
