import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, ApiError } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Field';
import { isValidEmail, isValidMobile } from '../utils/validate';

const ROLES = [
  { id: 'student', label: 'Student', icon: 'school' },
  { id: 'mentor', label: 'Mentor', icon: 'person' },
  { id: 'institute', label: 'Institute', icon: 'account_balance' },
  { id: 'admin', label: 'Admin', icon: 'admin_panel_settings' },
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [role, setRole] = useState('student');
  const [tab, setTab] = useState('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const roleHome = (r) =>
    r === 'admin'
      ? '/admin'
      : r === 'student'
      ? '/student'
      : r === 'mentor'
      ? '/mentor'
      : r === 'institute'
      ? '/institute'
      : '/login';

  const handleEmailSubmit = async (e) => {
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
      const user = await login(email, password, role);
      navigate(roleHome(user.role ? user.role.toLowerCase() : role));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMobileSubmit = (e) => {
    e.preventDefault();
    if (!otpSent) {
      if (!isValidMobile(mobile)) {
        setError('Enter a valid 10-digit mobile number.');
        return;
      }
      setError('');
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setOtpSent(true);
      }, 500);
      return;
    }
    if (!otp || otp.length < 4) {
      setError('Enter the 6-digit OTP sent to your phone.');
      return;
    }
    setError('Mobile OTP sign-in is not available yet. Please use email sign-in.');
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6 box-border">
      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-3xl p-10 shadow-lg box-border">
        <div className="text-center mb-7">
          <h1 className="font-display text-2xl font-bold text-primary m-0">Next Move</h1>
          <p className="text-sm text-on-surface-variant mt-1.5 m-0">Sign in to continue your journey</p>
        </div>

        <div className="flex gap-2 mb-6">
          {ROLES.map((r) => (
            <button
              key={r.id}
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

        <div className="flex bg-surface-container-low rounded-lg p-1 mb-6">
          <button
            onClick={() => { setTab('email'); setError(''); }}
            className={`flex-1 py-2.5 rounded-md text-xs font-semibold cursor-pointer transition-all border-none ${
              tab === 'email' ? 'bg-surface-container-lowest text-primary-container shadow-sm' : 'bg-transparent text-on-surface-variant'
            }`}
          >
            Email
          </button>
          <button
            onClick={() => { setTab('mobile'); setError(''); }}
            className={`flex-1 py-2.5 rounded-md text-xs font-semibold cursor-pointer transition-all border-none ${
              tab === 'mobile' ? 'bg-surface-container-lowest text-primary-container shadow-sm' : 'bg-transparent text-on-surface-variant'
            }`}
          >
            Mobile OTP
          </button>
        </div>

        {tab === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs text-on-surface-variant mb-1.5">Email Address</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs text-on-surface-variant mb-1.5">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
            {error && <p className="text-error text-xs m-0">{error}</p>}
            <div className="flex justify-between items-center">
              <label className="flex items-center gap-2 text-xs text-on-surface-variant cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe((v) => !v)}
                  className="accent-primary-container"
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-xs text-primary-container no-underline">Forgot password?</Link>
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleMobileSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs text-on-surface-variant mb-1.5">Mobile Number</label>
              <Input
                type="tel"
                value={mobile}
                disabled={otpSent}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile number"
              />
            </div>
            {otpSent && (
              <div>
                <label className="block text-xs text-on-surface-variant mb-1.5">Enter OTP</label>
                <Input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit OTP"
                />
                <button
                  type="button"
                  onClick={() => setOtp('')}
                  className="text-xs text-primary-container mt-1.5 bg-transparent border-none cursor-pointer p-0"
                >
                  Resend OTP
                </button>
              </div>
            )}
            {error && <p className="text-error text-xs m-0">{error}</p>}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting
                ? otpSent
                  ? 'Verifying…'
                  : 'Sending OTP…'
                : otpSent
                ? 'Verify & Sign In'
                : 'Send OTP'}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-on-surface-variant mt-6 m-0">
          New here? <Link to="/signup" className="font-semibold text-primary-container no-underline">Sign up as a new student</Link>
        </p>
      </div>
    </div>
  );
}
