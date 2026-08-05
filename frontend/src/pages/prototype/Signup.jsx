import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Input, FormGroup } from '../../components/ui/Field';
import { INSTITUTE_TYPES, PROFESSIONAL_CATEGORIES } from './mockData';
import { useProtoAuth } from './useProtoAuth';

function ChipGroup({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-3.5 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
            value === opt
              ? 'bg-primary text-on-primary border-primary'
              : 'bg-transparent text-on-surface-variant border-outline-variant hover:bg-surface-container-low'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useProtoAuth();

  const [userType, setUserType] = useState('professional'); // 'professional' | 'student'
  const [category, setCategory] = useState(PROFESSIONAL_CATEGORIES[0]);
  const [wantsPage, setWantsPage] = useState(false);
  const [instituteType, setInstituteType] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.email) return;
    const account = {
      email: form.email,
      name: form.name,
      role: userType,
      ...(userType === 'professional' ? { category } : {}),
      ...(userType === 'professional' && wantsPage && instituteType ? { instituteTypeIntent: instituteType } : {}),
    };
    signup(account);
    if (userType === 'professional' && wantsPage && instituteType) {
      navigate('/prototype/create-page');
    } else {
      navigate('/prototype/feed');
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
            प्रोफाइल क्रिएट करते समय पहला ऑप्शन सेलेक्ट करेंगे — choose your account type first.
          </p>

          <form onSubmit={submit} className="space-y-5">
            <FormGroup label="I am">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUserType('professional')}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-all cursor-pointer text-left ${
                    userType === 'professional'
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-transparent text-on-surface-variant border-outline-variant hover:bg-surface-container-low'
                  }`}
                >
                  <span className="material-symbols-outlined block mb-1">badge</span>
                  Professional
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('student')}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-all cursor-pointer text-left ${
                    userType === 'student'
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-transparent text-on-surface-variant border-outline-variant hover:bg-surface-container-low'
                  }`}
                >
                  <span className="material-symbols-outlined block mb-1">school</span>
                  Student
                </button>
              </div>
              {userType === 'student' && (
                <p className="text-xs text-on-surface-variant mt-2 mb-0">
                  As a Student you won't be able to create a Page, and "Looking for a Job" / "Expert
                  Opinion" won't be shown on your dashboard.
                </p>
              )}
            </FormGroup>

            {userType === 'professional' && (
              <FormGroup label="Professional category">
                <ChipGroup options={PROFESSIONAL_CATEGORIES} value={category} onChange={setCategory} />
              </FormGroup>
            )}

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

            {userType === 'professional' && (
              <FormGroup label="Institute Page (optional)">
                <label className="flex items-center gap-2 text-sm text-on-surface-variant mb-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={wantsPage}
                    onChange={(e) => setWantsPage(e.target.checked)}
                  />
                  I also want to create an Institute Page (School / Coaching / College / University /
                  Training Institute)
                </label>
                {wantsPage && (
                  <>
                    <ChipGroup options={INSTITUTE_TYPES} value={instituteType} onChange={setInstituteType} />
                    <p className="text-xs text-on-surface-variant mt-2 mb-0">
                      You'll become this Page's first Admin, and can add more Admins later — like a
                      Facebook Page. You can also do this anytime later from your dashboard.
                    </p>
                  </>
                )}
              </FormGroup>
            )}

            {error && <p className="text-error text-xs mb-0">{error}</p>}

            <Button type="submit" className="w-full" size="lg">Create Account</Button>

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
            <Link to="/prototype" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </Card>

        <div className="mt-4 flex justify-center">
          <Badge tone="neutral">User types &amp; fields per client requirement doc — see docs/EDUCATION_NETWORK_ROADMAP.md</Badge>
        </div>
      </main>
    </div>
  );
}
