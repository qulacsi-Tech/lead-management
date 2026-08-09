import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ApiError } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Field';
import { isValidEmail } from '../utils/validate';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password, 'admin');
      navigate('/admin');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm p-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold">E</div>
          <span className="text-lg font-bold text-on-surface">EduNet Admin</span>
        </div>
        <p className="text-xs text-on-surface-variant mb-6">Admin accounts are provisioned by the system.</p>

        <form onSubmit={submit} className="space-y-4">
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
          />
          <Input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
          {error && <p className="text-error text-xs mb-0">{error}</p>}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
}
