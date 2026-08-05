import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Input, FormGroup } from '../../components/ui/Field';
import { useProtoAuth } from './useProtoAuth';

export default function Landing() {
  const navigate = useNavigate();
  const { login } = useProtoAuth();
  const [name, setName] = useState('');
  const [role, setRole] = useState('professional');

  const enter = (e) => {
    e.preventDefault();
    login(role, name || (role === 'professional' ? 'Rakesh Sharma' : 'Ananya Singh'));
    navigate('/prototype/feed');
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="border-b border-outline-variant bg-surface-container-lowest">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold">E</div>
            <span className="text-lg font-bold text-on-surface">EduNet</span>
          </div>
          <span className="text-xs text-on-surface-variant">UI Prototype — static demo, no real login</span>
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
          <h2 className="text-lg font-bold text-on-surface mb-1">Sign in / Join</h2>
          <p className="text-xs text-on-surface-variant mb-5">
            Demo only — pick a role below to enter the common dashboard. (Real build: Sign Up / Sign
            In, Google Login, OTP Verification.)
          </p>

          <form onSubmit={enter} className="space-y-4">
            <FormGroup label="Your name">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rakesh Sharma" />
            </FormGroup>

            <FormGroup label="I am">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('professional')}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-all cursor-pointer text-left ${
                    role === 'professional'
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-transparent text-on-surface-variant border-outline-variant hover:bg-surface-container-low'
                  }`}
                >
                  <span className="material-symbols-outlined block mb-1">badge</span>
                  Professional
                </button>
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-all cursor-pointer text-left ${
                    role === 'student'
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-transparent text-on-surface-variant border-outline-variant hover:bg-surface-container-low'
                  }`}
                >
                  <span className="material-symbols-outlined block mb-1">school</span>
                  Student
                </button>
              </div>
            </FormGroup>

            <Button type="submit" className="w-full" size="lg">Continue</Button>

            <div className="flex items-center gap-3 text-xs text-on-surface-variant">
              <div className="flex-1 h-px bg-outline-variant" />
              or
              <div className="flex-1 h-px bg-outline-variant" />
            </div>

            <Button type="button" variant="outline" className="w-full" icon="mail">Continue with OTP</Button>
            <Button type="button" variant="outline" className="w-full" icon="account_circle">Continue with Google</Button>
          </form>
        </Card>
      </main>
    </div>
  );
}
