import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { Input, Label } from '../components/ui/Field';
import { isValidEmail, required } from '../utils/validate';

const ROLES = [
  { id: 'student', label: 'Student', icon: 'school' },
  { id: 'mentor', label: 'Mentor', icon: 'person' },
  { id: 'institute', label: 'Institute', icon: 'account_balance' },
];

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [role, setRole] = useState('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roleHome = (r) => (r === 'student' ? '/student' : r === 'mentor' ? '/mentor' : '/institute');

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!required(name)) nextErrors.name = 'Enter your full name.';
    if (!isValidEmail(email)) nextErrors.email = 'Enter a valid email address.';
    if (password.length < 6) nextErrors.password = 'Password must be at least 6 characters.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      login(role, name.trim().split(' ')[0]);
      navigate(roleHome(role));
    }, 600);
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6 box-border">
      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-3xl p-10 shadow-lg box-border">
        <div className="text-center mb-7">
          <h1 className="font-display text-2xl font-bold text-primary m-0">Create your account</h1>
          <p className="text-sm text-on-surface-variant mt-1.5 m-0">Join Next Move to get started</p>
        </div>

        <div className="flex gap-2 mb-6">
          {ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRole(r.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                role === r.id
                  ? 'border-2 border-primary-container bg-primary-fixed text-primary'
                  : 'border border-outline-variant bg-surface-container-lowest text-on-surface-variant font-semibold'
              }`}
            >
              <span className="material-symbols-outlined text-base">{r.icon}</span>
              {r.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label>Full Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" error={errors.name} />
          </div>
          <div>
            <Label>Email Address</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" error={errors.email} />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" error={errors.password} />
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Creating account…' : 'Create Account'}
          </Button>
        </form>

        <p className="text-center text-sm text-on-surface-variant mt-6 m-0">
          Already have an account? <Link to="/login" className="font-semibold text-primary-container no-underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
