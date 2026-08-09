import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input, FormGroup } from '../components/ui/Field';
import { useSession } from '../context/useSession';
import { ApiError } from '../Api/Api';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? '/admin' : '/feed');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="border-b border-outline-variant bg-surface-container-lowest">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold">E</div>
            <span className="text-lg font-bold text-on-surface">EduNet</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-on-surface leading-tight mb-4">
            The professional network<br /> built for education.
          </h1>
          <p className="text-on-surface-variant mb-6 max-w-md">
            Teachers, faculty and institutes — build your profile, create your Institute Page, post
            admissions &amp; jobs, and connect. Just like LinkedIn, made for the education industry.
          </p>
          <ul className="space-y-2 text-sm text-on-surface-variant">
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
              Create an Institute Page and manage admins
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
              Post Admission Notices &amp; Job Vacancies
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
              Search &amp; unlock candidate / admission leads with credits
            </li>
          </ul>
        </div>

        <Card className="p-8">
          <h2 className="text-lg font-bold text-on-surface mb-1">Sign in</h2>
          <p className="text-xs text-on-surface-variant mb-5">
            One login for everyone — your role is resolved from your account, admin included.
          </p>

          <form onSubmit={submit} className="space-y-4">
            <FormGroup label="Email">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
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

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="flex items-center gap-3 text-xs text-on-surface-variant">
              <div className="flex-1 h-px bg-outline-variant" />
              or
              <div className="flex-1 h-px bg-outline-variant" />
            </div>

            <Button type="button" variant="outline" className="w-full" icon="mail">Continue with OTP</Button>
            <Button type="button" variant="outline" className="w-full" icon="account_circle">Continue with Google</Button>
          </form>

          <div className="mt-5 pt-4 border-t border-outline-variant">
            <p className="text-sm text-on-surface-variant mb-0">
              New here?{' '}
              <Link to="/signup" className="text-primary font-semibold hover:underline">
                Join now
              </Link>
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}
