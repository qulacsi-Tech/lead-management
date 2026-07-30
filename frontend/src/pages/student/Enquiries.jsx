import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Input, Select, Textarea, Label } from '../../components/ui/Field';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { isValidMobile } from '../../utils/validate';
import { downloadCsv } from '../../utils/csv';
import { fetchStates, createEnquiry, fetchMyEnquiries, ApiError } from '../../Api/Api';

const LEADERS = [
  { rank: '1st', tone: 'bg-secondary', initials: 'AM', name: 'Arjun Mehta', xp: '12,450 XP', pts: '520 pts', ptsColor: 'text-secondary' },
  { rank: '2nd', tone: 'bg-outline', initials: 'SK', name: 'Sara Khan', xp: '11,200 XP', pts: '480 pts', ptsColor: 'text-on-surface-variant' },
  { rank: '3rd', tone: 'bg-primary-container', initials: 'VR', name: 'Vivek Raj', xp: '10,890 XP', pts: '410 pts', ptsColor: 'text-on-surface-variant' },
];

const LEAD_TYPES = [
  { id: 'coaching', icon: 'school', label: 'Looking for Coaching' },
  { id: 'college', icon: 'account_balance', label: 'Looking for College' },
  { id: 'friend', icon: 'group_add', label: 'Post Lead for a Friend' },
];

const ENQUIRY_TYPE_MAP = { coaching: 'Coaching', college: 'College' };

export default function Enquiries() {
  const navigate = useNavigate();
  const { displayName } = useAuth();
  const { addLead, leadsFor } = useData();
  const { push } = useToast();
  const [leadType, setLeadType] = useState('friend');
  const [f, setF] = useState({ name: '', mobile: '', city: '', course: 'Computer Science Engineering', notes: '' });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [bonusClaimed, setBonusClaimed] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const otpRefs = useRef([]);
  const leads = leadsFor(displayName);

  const [statesList, setStatesList] = useState([]);
  const [enquiryForm, setEnquiryForm] = useState({ state: '', course: '' });
  const [enquiryError, setEnquiryError] = useState('');
  const [enquirySubmitting, setEnquirySubmitting] = useState(false);
  const [myEnquiries, setMyEnquiries] = useState([]);
  const [loadingEnquiries, setLoadingEnquiries] = useState(true);

  useEffect(() => {
    fetchStates().then(setStatesList).catch(() => setStatesList([]));
    loadMyEnquiries();
  }, []);

  const loadMyEnquiries = async () => {
    setLoadingEnquiries(true);
    try {
      const data = await fetchMyEnquiries();
      setMyEnquiries(data);
    } catch {
      // non-fatal, list just stays empty
    } finally {
      setLoadingEnquiries(false);
    }
  };

  const setField = (key, value) => setF((prev) => ({ ...prev, [key]: value }));
  const setEnquiryField = (key, value) => setEnquiryForm((prev) => ({ ...prev, [key]: value }));

  const setOtpDigit = (i, val) => {
    const clean = val.replace(/\D/g, '').slice(0, 1);
    setOtp((prev) => {
      const next = [...prev];
      next[i] = clean;
      return next;
    });
    if (clean && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const optionStyle = (id) => {
    const active = leadType === id;
    const filled = id === 'friend';
    if (active && filled) return 'bg-primary-container text-white border-2 border-primary shadow-md';
    if (active) return 'bg-surface-container-low border-2 border-primary text-on-surface';
    return 'bg-surface-container-lowest border border-outline-variant text-on-surface';
  };

  const isEnquiryType = leadType === 'coaching' || leadType === 'college';

  const handleEnquirySubmit = async (e) => {
    e.preventDefault();
    if (!enquiryForm.state) {
      setEnquiryError('Please select your state.');
      return;
    }
    if (!enquiryForm.course.trim()) {
      setEnquiryError('Please enter the course you are looking for.');
      return;
    }
    setEnquiryError('');
    setEnquirySubmitting(true);
    try {
      await createEnquiry({
        enquiry_type: ENQUIRY_TYPE_MAP[leadType],
        state: enquiryForm.state,
        course: enquiryForm.course.trim(),
      });
      push({ type: 'success', message: 'Your enquiry has been submitted. Institutes in your area will be notified.' });
      setEnquiryForm({ state: '', course: '' });
      loadMyEnquiries();
    } catch (err) {
      setEnquiryError(err instanceof ApiError ? err.message : 'Failed to submit enquiry. Try again.');
    } finally {
      setEnquirySubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!f.name) {
      setError('Please fill in the name.');
      return;
    }
    if (!isValidMobile(f.mobile)) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    if (otp.some((d) => !d)) {
      setError('Please complete OTP verification.');
      return;
    }
    setError('');
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      addLead({ ...f, source: 'student', referrerKey: displayName });
      push({ type: 'success', message: `${f.name} was submitted as a lead. We'll notify you once it's verified.` });
      setF({ name: '', mobile: '', city: '', course: 'Computer Science Engineering', notes: '' });
      setOtp(['', '', '', '', '', '']);
      setOtpSent(false);
    }, 700);
  };

  const handleDownloadReport = () => {
    if (!leads.length) {
      push({ type: 'info', message: 'No leads to export yet.' });
      return;
    }
    downloadCsv('my-leads.csv', leads.map((l) => ({
      Name: l.name, Course: l.course, Status: l.status, Views: l.views, Points: l.points,
    })));
  };

  const verifiedCount = leads.filter((l) => l.status === 'verified').length;
  const pointsTotal = leads.reduce((sum, l) => sum + l.points, 0) + (bonusClaimed ? 10 : 0);
  const silverPct = Math.min(100, (verifiedCount / 5) * 100);
  const masterPct = Math.min(100, (pointsTotal / 1000) * 100);

  return (
    <div className="max-w-7xl w-full mx-auto px-10 py-8 box-border">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {LEAD_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => setLeadType(t.id)}
                className={`flex flex-col items-center justify-center p-6 rounded-2xl cursor-pointer transition-all border-none ${optionStyle(t.id)}`}
              >
                <span className="material-symbols-outlined text-4xl mb-2">{t.icon}</span>
                <span className="font-semibold text-sm text-center">{t.label}</span>
              </button>
            ))}
          </div>

          {isEnquiryType ? (
            <Card className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center text-white">
                  <span className="material-symbols-outlined">{leadType === 'coaching' ? 'school' : 'account_balance'}</span>
                </div>
                <h3 className="font-display text-xl font-semibold text-primary m-0">
                  {leadType === 'coaching' ? 'Looking for Coaching' : 'Looking for College'}
                </h3>
              </div>
              <p className="text-sm text-on-surface-variant mb-6 -mt-3">
                Tell us your state and the course you're interested in — matching institutes in your area will be notified.
              </p>
              <form onSubmit={handleEnquirySubmit} className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>State</Label>
                    <Select value={enquiryForm.state} onChange={(e) => setEnquiryField('state', e.target.value)}>
                      <option value="">Select State</option>
                      {statesList.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>Course</Label>
                    <Input
                      value={enquiryForm.course}
                      onChange={(e) => setEnquiryField('course', e.target.value)}
                      placeholder="e.g. Computer Science Engineering"
                    />
                  </div>
                </div>

                {enquiryError && (
                  <div className="flex items-center gap-1.5 text-error text-sm bg-error-container px-3 py-2.5 rounded-lg">
                    <span className="material-symbols-outlined text-base">error</span>{enquiryError}
                  </div>
                )}

                <Button type="submit" icon="send" disabled={enquirySubmitting} className="w-full" size="lg">
                  {enquirySubmitting ? 'Submitting…' : 'Submit Enquiry'}
                </Button>
              </form>
            </Card>
          ) : null}

          <Card className="overflow-hidden">
            <div className="p-6 border-b border-outline-variant">
              <h3 className="font-display text-xl font-semibold text-primary m-0">My Enquiries</h3>
            </div>
            {loadingEnquiries ? (
              <div className="px-6 py-8 text-center text-on-surface-variant text-sm">Loading...</div>
            ) : myEnquiries.length === 0 ? (
              <div className="px-6 py-12 text-center text-on-surface-variant text-sm">
                You haven't submitted any Coaching/College enquiries yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-primary-fixed text-on-surface-variant text-xs">
                    <tr>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">State</th>
                      <th className="px-6 py-4">Course</th>
                      <th className="px-6 py-4 text-right">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myEnquiries.map((eq) => (
                      <tr key={eq.id} className="border-t border-surface-container">
                        <td className="px-6 py-4 font-semibold text-sm">{eq.enquiry_type}</td>
                        <td className="px-6 py-4 text-on-surface-variant text-sm">{eq.state}</td>
                        <td className="px-6 py-4 text-on-surface-variant text-sm">{eq.course}</td>
                        <td className="px-6 py-4 text-right text-xs text-on-surface-variant">
                          {eq.created_at ? new Date(eq.created_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="relative flex justify-between items-center gap-6 flex-wrap">
              <div>
                <h2 className="font-display text-2xl font-bold m-0 mb-2">
                  Earn 100 Reward Points for every verified inquiry!
                </h2>
                <p className="opacity-90 m-0">
                  Help your friends find the right path and grow your student portfolio balance.
                </p>
              </div>
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-5xl">currency_exchange</span>
              </div>
            </div>
          </div>

          <Card className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center text-white">
                <span className="material-symbols-outlined">person_add</span>
              </div>
              <h3 className="font-display text-xl font-semibold text-primary m-0">Student Referral Details</h3>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Full Name</Label>
                  <Input value={f.name} onChange={(e) => setField('name', e.target.value)} placeholder="John Doe" />
                </div>
                <div>
                  <Label>Mobile Number</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm font-semibold">+91</span>
                    <Input
                      className="pl-12"
                      value={f.mobile}
                      onChange={(e) => setField('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210"
                    />
                  </div>
                </div>
                <div>
                  <Label>City</Label>
                  <Input value={f.city} onChange={(e) => setField('city', e.target.value)} placeholder="Bangalore" />
                </div>
                <div>
                  <Label>Course Interest</Label>
                  <Select value={f.course} onChange={(e) => setField('course', e.target.value)}>
                    <option>Computer Science Engineering</option>
                    <option>MBA / Management</option>
                    <option>Medical / NEET</option>
                    <option>Design &amp; Arts</option>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Additional Notes</Label>
                <Textarea
                  rows={3}
                  value={f.notes}
                  onChange={(e) => setField('notes', e.target.value)}
                  placeholder="Tell us more about your friend's preferences..."
                />
              </div>

              <div className="bg-primary-fixed p-6 rounded-2xl flex flex-col gap-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-primary m-0 mb-1">Verify with OTP</h4>
                    <p className="text-xs text-on-surface-variant m-0">
                      We'll send a 6-digit code to verify the mobile number.
                    </p>
                  </div>
                  <Button type="button" variant="secondary" size="sm" disabled={otpSent} onClick={() => setOtpSent(true)}>
                    {otpSent ? 'OTP Sent' : 'Send OTP'}
                  </Button>
                </div>
                <div className="flex gap-2 justify-center flex-nowrap">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      type="text"
                      maxLength={1}
                      value={digit}
                      disabled={!otpSent}
                      onChange={(e) => setOtpDigit(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-9 h-12 text-center text-lg font-bold border border-outline-variant rounded-lg bg-surface-container-lowest box-border flex-shrink-0"
                    />
                  ))}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-1.5 text-error text-sm bg-error-container px-3 py-2.5 rounded-lg">
                  <span className="material-symbols-outlined text-base">error</span>{error}
                </div>
              )}

              <Button type="submit" icon="send" disabled={submitting} className="w-full" size="lg">
                {submitting ? 'Submitting…' : 'Submit Lead & Claim Rewards'}
              </Button>
            </form>
          </Card>

          <Card className="overflow-hidden">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center">
              <h3 className="font-display text-xl font-semibold text-primary m-0">My Leads</h3>
              <button onClick={handleDownloadReport} className="bg-transparent border-none text-primary font-semibold text-sm cursor-pointer hover:underline">
                Download Report
              </button>
            </div>
            {leads.length === 0 ? (
              <div className="px-6 py-12 text-center text-on-surface-variant text-sm">
                You haven't referred anyone yet. Submit a lead above to start earning points.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-primary-fixed text-on-surface-variant text-xs">
                    <tr>
                      <th className="px-6 py-4">Student Name</th>
                      <th className="px-6 py-4">Course</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-center">View Count</th>
                      <th className="px-6 py-4 text-right">Points Earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead.id} className="border-t border-surface-container">
                        <td className="px-6 py-4 font-semibold text-sm">{lead.name}</td>
                        <td className="px-6 py-4 text-on-surface-variant text-sm">{lead.course}</td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                              lead.status === 'verified' || lead.status === 'converted'
                                ? 'text-on-secondary-container bg-secondary-container'
                                : 'text-primary bg-primary-fixed'
                            }`}
                          >
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-sm">{lead.views}</td>
                        <td
                          className={`px-6 py-4 text-right font-semibold text-sm ${
                            lead.points ? 'text-secondary' : 'text-on-surface-variant'
                          }`}
                        >
                          {lead.points ? `+${lead.points}` : '0'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card className="p-6 text-center bg-primary-fixed border-none relative overflow-hidden">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-surface-container-lowest rounded-full flex items-center justify-center shadow-md text-primary">
                <span className="material-symbols-outlined text-3xl">calendar_today</span>
              </div>
              <div>
                <h4 className="text-xl font-semibold text-primary m-0 mb-1">Daily Bonus</h4>
                <p className="text-sm text-on-surface-variant m-0">Collect your 10 daily points!</p>
              </div>
              <Button
                variant="primary"
                disabled={bonusClaimed}
                onClick={() => setBonusClaimed(true)}
                className="w-full"
              >
                {bonusClaimed ? 'Bonus Claimed' : 'Claim Bonus'}
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display text-lg font-semibold text-primary m-0">Top Learners</h3>
              <span className="material-symbols-outlined text-on-surface-variant">info</span>
            </div>
            <div className="flex flex-col gap-4">
              {LEADERS.map((l) => (
                <div key={l.rank} className="flex items-center gap-4 p-3 rounded-xl bg-surface-container-low">
                  <div className="relative w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary font-bold">
                    {l.initials}
                    <div className={`absolute -top-1 -left-1 w-[22px] h-[22px] ${l.tone} text-white rounded-full flex items-center justify-center text-[10px] font-bold`}>
                      {l.rank}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm m-0">{l.name}</p>
                    <p className="text-[11px] text-on-surface-variant m-0">{l.xp}</p>
                  </div>
                  <div className={`font-bold text-sm ${l.ptsColor}`}>{l.pts}</div>
                </div>
              ))}
              <button
                onClick={() => navigate('/student/leaderboard')}
                className="w-full py-2 bg-transparent border-none text-primary font-semibold text-sm cursor-pointer rounded-lg hover:bg-surface-container-low"
              >
                View Full Leaderboard
              </button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-display text-lg font-semibold text-primary mb-4">Milestone Progress</h3>
            <div className="flex flex-col gap-5">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-on-surface-variant">Silver Rank (Lead 5 friends)</span>
                  <span className="text-primary font-bold">{verifiedCount}/5</span>
                </div>
                <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${silverPct}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-on-surface-variant">Verified Master (Earn 1k pts)</span>
                  <span className="text-secondary font-bold">{pointsTotal}/1000</span>
                </div>
                <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-secondary" style={{ width: `${masterPct}%` }} />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
