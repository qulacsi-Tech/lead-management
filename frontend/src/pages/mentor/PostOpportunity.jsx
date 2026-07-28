import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Input, Select, Textarea, Label } from '../../components/ui/Field';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { required } from '../../utils/validate';
import { fetchMyOpportunities, createOpportunity, ApiError } from '../../Api/Api';

const TONE_CLASSES = {
  success: 'bg-secondary-container text-on-secondary-container',
  primary: 'bg-primary-fixed text-primary',
  neutral: 'bg-surface-container-highest text-on-surface-variant',
};

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];

export default function PostOpportunity() {
  const navigate = useNavigate();
  const { displayName } = useAuth();
  const { addLead, leadsFor } = useData();
  const { push } = useToast();
  const [tab, setTab] = useState('job');
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [job, setJob] = useState({ subject: '', location: '', salary: '', availability: 'Immediate' });
  const [referral, setReferral] = useState({ name: '', course: '', city: '', collegeType: 'Public / State University', notes: '' });
  const [referralError, setReferralError] = useState('');
  const [opportunities, setOpportunities] = useState([]);
  const [loadingOpps, setLoadingOpps] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [oppError, setOppError] = useState('');

  const referrals = leadsFor(displayName);
  const verified = referrals.filter((r) => r.status === 'verified' || r.status === 'converted').length;
  const impactScore = Math.min(100, 60 + verified * 8);
  const activeOpportunities = opportunities.filter((o) => o.status === 'Active').length;
  const closedOpportunities = opportunities.length - activeOpportunities;

  const loadOpportunities = async () => {
    setLoadingOpps(true);
    try {
      const data = await fetchMyOpportunities();
      setOpportunities(data);
    } catch (err) {
      setOppError(err instanceof ApiError ? err.message : 'Failed to load opportunities.');
    } finally {
      setLoadingOpps(false);
    }
  };

  useEffect(() => { loadOpportunities(); }, []);

  const setJobField = (key, value) => setJob((prev) => ({ ...prev, [key]: value }));
  const setReferralField = (key, value) => setReferral((prev) => ({ ...prev, [key]: value }));

  const handlePublishJob = async (e) => {
    e.preventDefault();
    if (!required(job.subject) || !required(job.location)) {
      push({ type: 'error', message: 'Subject and location are required to publish a job.' });
      return;
    }
    setPublishing(true);
    try {
      await createOpportunity({ ...job, employment_type: employmentType });
      setJob({ subject: '', location: '', salary: '', availability: 'Immediate' });
      push({ type: 'success', message: 'Job opportunity published.' });
      await loadOpportunities();
    } catch (err) {
      push({ type: 'error', message: err instanceof ApiError ? err.message : 'Failed to publish opportunity.' });
    } finally {
      setPublishing(false);
    }
  };

  const handleSubmitReferral = (e) => {
    e.preventDefault();
    if (!required(referral.name) || !required(referral.course)) {
      setReferralError('Student name and target course are required.');
      return;
    }
    setReferralError('');
    addLead({
      name: referral.name,
      mobile: '',
      city: referral.city,
      course: referral.course,
      notes: `${referral.collegeType} — ${referral.notes}`,
      source: 'mentor',
      referrerKey: displayName,
    });
    push({ type: 'success', message: `Referral for ${referral.name} submitted for institute discovery.` });
    setReferral({ name: '', course: '', city: '', collegeType: 'Public / State University', notes: '' });
  };

  return (
    <div className="max-w-7xl w-full mx-auto px-10 py-8 box-border">
      <section className="flex flex-wrap justify-between items-end gap-6 mb-6">
        <div>
          <h2 className="font-display text-3xl font-bold text-primary m-0 mb-2">Post New Opportunity</h2>
          <p className="text-on-surface-variant m-0 max-w-xl">
            Create and manage academic openings or student referrals to help your community grow. Choose a flow to get started.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setTab('job')}
            className={`px-6 py-2.5 rounded-full text-sm cursor-pointer ${
              tab === 'job'
                ? 'border-2 border-primary-container bg-primary-fixed text-primary font-bold'
                : 'border-2 border-outline-variant bg-transparent text-on-surface-variant font-semibold'
            }`}
          >
            Looking for Job
          </button>
          <button
            onClick={() => setTab('college')}
            className={`px-6 py-2.5 rounded-full text-sm cursor-pointer ${
              tab === 'college'
                ? 'border-2 border-primary-container bg-primary-fixed text-primary font-bold'
                : 'border-2 border-outline-variant bg-transparent text-on-surface-variant font-semibold'
            }`}
          >
            College Admission
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          {tab === 'job' ? (
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined">work</span>
                </div>
                <h3 className="text-lg font-semibold m-0">Job Posting Details</h3>
              </div>
              <form onSubmit={handlePublishJob} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>Subject / Field</Label>
                  <Input value={job.subject} onChange={(e) => setJobField('subject', e.target.value)} placeholder="e.g. Computer Science, Mathematics" />
                </div>
                <div>
                  <Label>City / Location</Label>
                  <Input value={job.location} onChange={(e) => setJobField('location', e.target.value)} placeholder="e.g. New York, Remote" />
                </div>
                <div>
                  <Label>Expected Salary (Annual)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">$</span>
                    <Input className="pl-7" value={job.salary} onChange={(e) => setJobField('salary', e.target.value)} placeholder="50,000 - 80,000" />
                  </div>
                </div>
                <div>
                  <Label>Availability</Label>
                  <Select value={job.availability} onChange={(e) => setJobField('availability', e.target.value)}>
                    <option>Immediate</option><option>Within 1 Month</option><option>Within 3 Months</option><option>Specific Date</option>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label>Employment Type</Label>
                  <div className="flex flex-wrap gap-2.5">
                    {EMPLOYMENT_TYPES.map((t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => setEmploymentType(t)}
                        className={`px-4 py-2 rounded-full text-xs font-semibold cursor-pointer border-none ${
                          employmentType === t
                            ? 'bg-primary/15 text-primary font-bold'
                            : 'bg-surface-container-high text-on-surface-variant'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Button type="submit" size="lg" className="w-full" disabled={publishing}>
                    {publishing ? 'Publishing...' : 'Publish Job Opportunity'}
                  </Button>
                </div>
              </form>
            </Card>
          ) : (
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined">school</span>
                </div>
                <h3 className="text-lg font-semibold m-0">College Referral Form</h3>
              </div>
              <form onSubmit={handleSubmitReferral} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>Student Name</Label>
                  <Input value={referral.name} onChange={(e) => setReferralField('name', e.target.value)} placeholder="Full legal name" error={referralError && !referral.name ? referralError : ''} />
                </div>
                <div>
                  <Label>Target Course</Label>
                  <Input value={referral.course} onChange={(e) => setReferralField('course', e.target.value)} placeholder="e.g. MBA, B.Tech, Fine Arts" error={referralError && !referral.course ? referralError : ''} />
                </div>
                <div>
                  <Label>Preferred City</Label>
                  <Input value={referral.city} onChange={(e) => setReferralField('city', e.target.value)} placeholder="City or Region" />
                </div>
                <div>
                  <Label>College Type</Label>
                  <Select value={referral.collegeType} onChange={(e) => setReferralField('collegeType', e.target.value)}>
                    <option>Public / State University</option><option>Private Research Institute</option><option>Community College</option><option>Vocational School</option>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label>Additional Notes (Optional)</Label>
                  <Textarea rows={3} value={referral.notes} onChange={(e) => setReferralField('notes', e.target.value)} placeholder="Briefly describe the student's background..." />
                </div>
                <div className="md:col-span-2">
                  <Button type="submit" variant="secondary" size="lg" className="w-full">Submit College Referral</Button>
                </div>
              </form>
            </Card>
          )}

          <Card className="bg-primary-fixed border-none overflow-hidden">
            <div className="px-6 py-5 border-b border-outline-variant flex justify-between items-center">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wide m-0">Opportunity Status Tracking</h3>
              <button onClick={() => navigate('/mentor/history')} className="bg-transparent border-none text-primary font-semibold text-sm cursor-pointer">View Full History</button>
            </div>
            <div>
              {referrals.slice(0, 2).map((r) => (
                <div key={r.id} className="px-6 py-4 flex items-center justify-between border-t border-outline-variant">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${r.status === 'pending' ? TONE_CLASSES.primary : TONE_CLASSES.success}`}>
                      <span className="material-symbols-outlined">{r.status === 'pending' ? 'pending' : 'check_circle'}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold m-0">{r.name} — {r.course}</p>
                      <p className="text-xs text-on-surface-variant m-0">Submitted {new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full capitalize ${r.status === 'pending' ? TONE_CLASSES.primary : TONE_CLASSES.success}`}>
                    {r.status}
                  </span>
                </div>
              ))}
              {loadingOpps ? (
                <p className="px-6 py-4 text-sm text-on-surface-variant m-0">Loading opportunities...</p>
              ) : oppError ? (
                <p className="px-6 py-4 text-sm text-error m-0">{oppError}</p>
              ) : opportunities.length === 0 && referrals.length === 0 ? (
                <p className="px-6 py-4 text-sm text-on-surface-variant m-0">No opportunities posted yet.</p>
              ) : (
                opportunities.slice(0, 2).map((o) => (
                  <div key={o.id} className="px-6 py-4 flex items-center justify-between border-t border-outline-variant">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${o.status === 'Active' ? TONE_CLASSES.success : TONE_CLASSES.neutral}`}>
                        <span className="material-symbols-outlined">{o.status === 'Active' ? 'check_circle' : 'cancel'}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold m-0">{o.subject}</p>
                        <p className="text-xs text-on-surface-variant m-0">{o.location} · {o.employment_type}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full ${o.status === 'Active' ? TONE_CLASSES.success : TONE_CLASSES.neutral}`}>
                      {o.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <aside className="lg:col-span-4 flex flex-col gap-6">
          <Card className="p-6 bg-primary text-white border-none relative overflow-hidden">
            <h4 className="text-xs font-semibold opacity-80 mb-2">Mentor Impact Score</h4>
            <div className="flex items-baseline gap-1.5 mb-4">
              <span className="text-4xl font-extrabold">{impactScore}</span><span className="text-sm opacity-70">/ 100</span>
            </div>
            <p className="text-sm leading-relaxed mb-5 opacity-90">
              {verified > 0
                ? `Your referrals have helped ${verified} student${verified === 1 ? '' : 's'} get verified or converted so far. Keep it up!`
                : 'Submit and get referrals verified to raise your impact score.'}
            </p>
            <Button variant="soft" onClick={() => navigate('/mentor/analytics')} className="w-full !bg-white !text-primary">View Impact Analytics</Button>
          </Card>

          <Card className="p-6 bg-primary-fixed border-none">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">info</span>
              <h4 className="text-sm font-semibold m-0">Posting Guidelines</h4>
            </div>
            <div className="flex flex-col gap-2.5 text-sm text-on-surface-variant">
              <div className="flex gap-2"><span className="material-symbols-outlined text-base text-secondary">done</span>Ensure accurate course descriptions for referrals.</div>
              <div className="flex gap-2"><span className="material-symbols-outlined text-base text-secondary">done</span>Specify salary ranges clearly to attract talent.</div>
              <div className="flex gap-2"><span className="material-symbols-outlined text-base text-secondary">done</span>Respect student privacy in admission referrals.</div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-xl bg-primary-fixed flex items-center justify-center text-primary flex-shrink-0">
                <span className="material-symbols-outlined">work_history</span>
              </div>
              <div>
                <p className="text-sm font-semibold m-0">Your Opportunities</p>
                <p className="text-xs text-on-surface-variant m-0">{opportunities.length} total posted</p>
              </div>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-on-surface-variant">{activeOpportunities} Active</span>
              <span className="text-on-surface-variant">{closedOpportunities} Closed</span>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
