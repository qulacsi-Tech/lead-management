import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Input, FormGroup } from '../components/ui/Field';
import { useSession } from '../context/useSession';
import { ApiError } from '../Api/Api';

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useSession();

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      // Account type (Professional/Student), category and Institute Page are
      // all set up afterwards, from the Profile screen — not asked here.
      await signup({ name: form.name, email: form.email, password: form.password });
      navigate('/profile');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to create your account. Please try again.');
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
          <span className="text-xs text-on-surface-variant">UI Prototype — static demo, no real account is created</span>
        </div>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full px-6 py-12">
        <Card className="p-8">
          <h2 className="text-lg font-bold text-on-surface mb-1">Create your account</h2>
          <p className="text-xs text-on-surface-variant mb-5">
            Just the basics for now — you'll set your account type (Professional / Student),
            category, and Institute Page from your profile after signing in.
          </p>

          <form onSubmit={submit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <FormGroup label="Full name">
                <Input required value={form.name} onChange={set('name')} placeholder="Your name" />
              </FormGroup>
              <FormGroup label="Phone">
                <Input value={form.phone} onChange={set('phone')} placeholder="+91-XXXXXXXXXX" />
              </FormGroup>
            </div>

            <FormGroup label="Email">
              <Input
                type="email"
                required
                value={form.email}
                onChange={(e) => {
                  setForm((f) => ({ ...f, email: e.target.value }));
                  setError('');
                }}
                placeholder="name@example.com"
              />
            </FormGroup>

            <FormGroup label="Password">
              <Input
                type="password"
                required
                value={form.password}
                onChange={set('password')}
                placeholder="••••••••"
              />
            </FormGroup>

            {error && <p className="text-error text-xs mb-0">{error}</p>}

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </Button>

            <div className="flex items-center gap-3 text-xs text-on-surface-variant">
              <div className="flex-1 h-px bg-outline-variant" />
              or
              <div className="flex-1 h-px bg-outline-variant" />
            </div>
            <Button type="button" variant="outline" className="w-full" icon="mail">Sign up with OTP</Button>
            <Button type="button" variant="outline" className="w-full" icon="account_circle">Sign up with Google</Button>
          </form>

          <p className="text-sm text-on-surface-variant mt-5 pt-4 border-t border-outline-variant mb-0">
            Already have an account?{' '}
            <Link to="/" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </Card>

        <div className="mt-4 flex justify-center">
          <Badge tone="neutral">User types per client requirement doc — profile details are filled in after signup</Badge>
        </div>
      </main>
    </div>
  );
}
