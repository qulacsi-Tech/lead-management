import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { Input, Label } from '../components/ui/Field';
import { isValidEmail } from '../utils/validate';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSent(true);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6 box-border">
      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-3xl p-10 shadow-lg box-border">
        <div className="text-center mb-7">
          <h1 className="font-display text-2xl font-bold text-primary m-0">Reset your password</h1>
          <p className="text-sm text-on-surface-variant mt-1.5 m-0">
            {sent ? "We've sent a reset link to your inbox." : "Enter your email and we'll send you a reset link."}
          </p>
        </div>

        {sent ? (
          <div className="flex flex-col gap-4 items-center text-center">
            <span className="material-symbols-outlined text-4xl text-secondary">mark_email_read</span>
            <p className="text-sm text-on-surface-variant m-0">
              If an account exists for <strong>{email}</strong>, a password reset link is on its way.
            </p>
            <Link to="/login" className="w-full">
              <Button className="w-full">Back to Sign In</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <Label>Email Address</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" error={error} />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Sending…' : 'Send Reset Link'}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-on-surface-variant mt-6 m-0">
          Remembered it? <Link to="/login" className="font-semibold text-primary-container no-underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
