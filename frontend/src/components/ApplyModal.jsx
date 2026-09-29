import { useEffect, useState } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { Input, Select, FormGroup } from './ui/Field';
import { useAuth } from '../context/AuthContext';
import { ApiError, applyToOpportunity } from '../Api/Api';
import { PROFESSIONAL_CATEGORIES } from '../constants/taxonomy';

/**
 * Apply to an Admission Notice or a Job Vacancy, without leaving the page.
 *
 * Client feedback 22 Sep 2026, row 5: "When the user clicks on 'Apply' we
 * should not redirect them to any other page — our task is to ensure that if
 * the user is new they should be able to create their profile here itself."
 *
 * So there is no link to /signup and no navigation of any kind. A visitor with
 * no account fills in the same form as everyone else plus a password; the
 * backend creates the profile and returns a token, and this dialog signs them
 * in on the spot. They finish where they started, on the institute's page,
 * logged in and with their application filed.
 *
 * An email that already has an account cannot apply without signing in —
 * that would be impersonation, and the backend answers 409. That is handled
 * in this dialog too: it switches to "welcome back", asks for the account's
 * password, signs in and files the application in one step. Sending them to
 * the sign-in page instead was exactly the redirect row 5 rules out.
 */
export default function ApplyModal({ open, onClose, opportunity, pageName, onApplied }) {
  const { user, login, loginFromToken } = useAuth();
  const isJob = opportunity?.type === 'job';

  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', city: '', state: '',
    qualification: '', experience: '', current_institute: '', message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [needsSignIn, setNeedsSignIn] = useState(false);

  // Prefill from the signed-in profile so applying is close to one click.
  useEffect(() => {
    if (!open) return;
    setForm((f) => ({
      ...f,
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    }));
  }, [open, user]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const close = () => {
    onClose();
    setTimeout(() => {
      setSubmitted(false);
      setError('');
      setNeedsSignIn(false);
      setForm({
        name: '', email: '', password: '', phone: '', city: '', state: '',
        qualification: '', experience: '', current_institute: '', message: '',
      });
    }, 200);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    // Snapshot: signing in below refreshes `user`, and the prefill effect
    // would then overwrite what was typed before it is sent.
    const data = { ...form };
    const signingIn = needsSignIn && !user;
    try {
      if (signingIn) {
        try {
          await login(data.email, data.password);
        } catch (err) {
          setError(err instanceof ApiError ? err.message : 'Could not sign you in.');
          return;
        }
      }
      const res = await applyToOpportunity(opportunity.id, {
        name: data.name || undefined,
        email: data.email || undefined,
        // Only sent by a visitor creating their profile here.
        password: user || signingIn ? undefined : data.password || undefined,
        phone: data.phone || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
        qualification: isJob ? data.qualification || undefined : undefined,
        experience: isJob ? data.experience || undefined : undefined,
        current_institute: isJob ? data.current_institute || undefined : undefined,
        message: data.message || undefined,
      });

      // Applying created the account: adopt the session so the visitor stays
      // here, signed in, rather than being sent to a login screen. The
      // response is shaped like a login's, so the normal path handles it.
      if (res.access_token && res.user) {
        loginFromToken({ access_token: res.access_token, user: res.user });
      }
      setSubmitted(true);
      setNeedsSignIn(false);
      onApplied?.(res.application);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && !user && !signingIn) {
        // The email has an account: ask for its password, right here.
        setNeedsSignIn(true);
        setForm((f) => ({ ...f, password: '' }));
      } else {
        setError(err instanceof ApiError ? err.message : 'Could not submit your application.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!opportunity) return null;

  return (
    <Modal open={open} onClose={close} width={460}>
      {submitted ? (
        <div className="text-center py-4">
          <span className="material-symbols-outlined text-secondary text-[44px]">check_circle</span>
          <h3 className="text-base font-bold text-on-surface mt-2 mb-1">Application Sent</h3>
          <p className="text-sm text-on-surface-variant mb-4">
            {pageName} has received your application for {opportunity.title}.
            {!user ? '' : ' They will contact you directly.'}
          </p>
          <Button size="sm" onClick={close}>Close</Button>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <Badge tone={isJob ? 'tertiary' : 'success'}>
              {isJob ? 'Job Vacancy' : 'Admission Open Notice'}
            </Badge>
            <h3 className="text-base font-bold text-on-surface mt-2 mb-0.5">{opportunity.title}</h3>
            <p className="text-xs text-on-surface-variant m-0">{pageName}</p>
          </div>

          {!user && !needsSignIn && (
            <p className="text-[11px] text-slate-600 bg-slate-50 rounded-xl px-3 py-2 mt-0 mb-3">
              No account yet? Fill this in and your profile is created as you apply — you stay right
              here.
            </p>
          )}
          {!user && needsSignIn && (
            <div className="flex items-start gap-2 text-xs text-blue-900 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 mt-0 mb-3">
              <span className="material-symbols-outlined text-[18px] text-blue-600" aria-hidden="true">waving_hand</span>
              <span>
                <strong>Welcome back!</strong> {form.email} already has an account. Enter its password and
                we&apos;ll sign you in and send your application — you stay on this page.
              </span>
            </div>
          )}

          <form onSubmit={submit} className="space-y-3">
            <Input required placeholder="Full Name" value={form.name} onChange={set('name')} />
            <Input
              required
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={(e) => { set('email')(e); setNeedsSignIn(false); }}
              disabled={!!user}
            />
            {!user && (
              <Input
                required
                type="password"
                placeholder={needsSignIn ? 'Your password' : 'Choose a password (min. 6 characters)'}
                aria-label={needsSignIn ? 'Your password' : 'Choose a password'}
                autoComplete={needsSignIn ? 'current-password' : 'new-password'}
                value={form.password}
                onChange={set('password')}
                minLength={needsSignIn ? undefined : 6}
                autoFocus={needsSignIn}
              />
            )}
            <Input placeholder="Mobile Number" value={form.phone} onChange={set('phone')} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="State" value={form.state} onChange={set('state')} />
              <Input placeholder="City" value={form.city} onChange={set('city')} />
            </div>

            {isJob && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <FormGroup label="Qualification">
                    <Select value={form.qualification} onChange={set('qualification')}>
                      <option value="">Select…</option>
                      {PROFESSIONAL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </Select>
                  </FormGroup>
                  <FormGroup label="Experience">
                    <Input placeholder="e.g. 5 years" value={form.experience} onChange={set('experience')} />
                  </FormGroup>
                </div>
                <Input
                  placeholder="Current Institute (optional)"
                  value={form.current_institute}
                  onChange={set('current_institute')}
                />
              </>
            )}

            <Input
              placeholder={isJob ? 'A line about why you are a fit (optional)' : 'Anything you want to add (optional)'}
              value={form.message}
              onChange={set('message')}
            />

            {error && (
              <div className="text-xs text-error bg-error-container/40 rounded-lg px-3 py-2">
                <p className="m-0">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? 'Submitting…' : needsSignIn && !user ? 'Sign in & apply' : 'Submit Application'}
            </Button>
          </form>
        </>
      )}
    </Modal>
  );
}
