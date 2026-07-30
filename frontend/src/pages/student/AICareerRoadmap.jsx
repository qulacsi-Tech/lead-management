import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import {
  fetchMyStudentProfile, fetchMentors, fetchMyFollowing, fetchMyAttempts, fetchMyEnquiries,
  followMentor, ApiError,
} from '../../Api/Api';

const GOALS = { papers: 10, mentors: 3, enquiries: 1 };

export default function AICareerRoadmap() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [following, setFollowing] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followPendingId, setFollowPendingId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [p, m, f, a, e] = await Promise.all([
          fetchMyStudentProfile(),
          fetchMentors(),
          fetchMyFollowing(),
          fetchMyAttempts(),
          fetchMyEnquiries(),
        ]);
        setProfile(p);
        setMentors(m);
        setFollowing(f);
        setAttempts(a);
        setEnquiries(e);
      } catch (err) {
        if (!(err instanceof ApiError)) throw err;
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const followedIds = new Set(following.map((f) => f.id));
  const suggestedMentors = mentors.filter((m) => !followedIds.has(m.id)).slice(0, 3);
  const distinctSolved = new Set(attempts.map((a) => a.paper_id)).size;

  const handleFollow = async (mentorId) => {
    setFollowPendingId(mentorId);
    try {
      await followMentor(mentorId);
      setFollowing((prev) => [...prev, { id: mentorId }]);
    } catch {
      // no-op, user can retry from Browse Mentors
    } finally {
      setFollowPendingId(null);
    }
  };

  const targetCourse = profile?.target_course || 'Not set yet';

  const steps = [
    { icon: 'check_circle', label: 'Current', value: profile?.current_school || 'Your School', tone: 'done' },
    { icon: 'school', label: 'Target Course', value: targetCourse, tone: 'active' },
    { icon: 'menu_book', label: 'Papers Solved', value: String(distinctSolved), tone: distinctSolved > 0 ? 'active' : 'upcoming' },
    { icon: 'groups', label: 'Mentors Followed', value: String(following.length), tone: following.length > 0 ? 'active' : 'upcoming' },
  ];

  const milestones = [
    { label: 'Practice Papers Attempted', pct: Math.min(100, Math.round((distinctSolved / GOALS.papers) * 100)), status: `${distinctSolved}/${GOALS.papers}`, tone: distinctSolved >= GOALS.papers ? 'done' : 'active' },
    { label: 'Mentors Followed', pct: Math.min(100, Math.round((following.length / GOALS.mentors) * 100)), status: `${following.length}/${GOALS.mentors}`, tone: following.length >= GOALS.mentors ? 'done' : 'active' },
    { label: 'Enquiries Submitted', pct: Math.min(100, Math.round((enquiries.length / GOALS.enquiries) * 100)), status: `${enquiries.length}/${GOALS.enquiries}`, tone: enquiries.length >= GOALS.enquiries ? 'done' : 'active' },
  ];

  return (
    <div className="max-w-7xl w-full mx-auto px-10 py-10 box-border">
      <section className="mb-12 flex justify-between items-end gap-6 flex-wrap">
        <div>
          <span className="text-primary font-bold tracking-wider text-xs uppercase mb-2 block">
            Career Architecture
          </span>
          <h2 className="font-display text-4xl font-bold text-primary m-0">
            Your Personalized Career Roadmap
          </h2>
          <p className="text-on-surface-variant text-lg max-w-2xl mt-4">
            Tracked from your real activity — papers attempted, mentors followed, and enquiries submitted.
          </p>
        </div>
      </section>

      <Card className="p-8 mb-6 backdrop-blur">
        <h3 className="font-display text-2xl font-semibold mb-12 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">auto_graph</span>
          Your Journey So Far
        </h3>
        <div className="relative flex items-center justify-between px-8 py-8">
          <div className="absolute left-0 right-0 h-1 bg-surface-container-highest rounded-full -z-10" />
          {steps.map((s) => (
            <div key={s.label} className={`flex flex-col items-center gap-4 ${s.tone === 'upcoming' ? 'opacity-60' : ''}`}>
              <div
                className={`w-14 h-14 flex items-center justify-center rounded-full text-white shadow-lg ${
                  s.tone === 'done'
                    ? 'bg-secondary'
                    : s.tone === 'active'
                    ? 'bg-primary border-4 border-surface'
                    : 'bg-surface-container-highest border-2 border-outline-variant !text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined">{s.icon}</span>
              </div>
              <div className="text-center">
                <p className="text-[11px] font-semibold uppercase m-0 text-on-surface-variant">{s.label}</p>
                <p className="text-lg font-semibold m-0 mt-0.5">{loading ? '—' : s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <Card className="p-6 flex gap-6 items-start">
            <div className="w-24 h-24 rounded-xl bg-surface-container-high flex-shrink-0 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-4xl">domain</span>
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-semibold m-0 mb-1">Looking for a Coaching Center?</h4>
              <p className="text-on-surface-variant m-0 mb-4">Submit an enquiry and matching institutes in your state will reach out.</p>
              <Button variant="secondary" onClick={() => navigate('/student/enquiries')}>Submit a Coaching Enquiry</Button>
            </div>
          </Card>

          <Card className="p-6 flex gap-6 items-start">
            <div className="w-24 h-24 rounded-xl bg-surface-container-high flex-shrink-0 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-4xl">account_balance</span>
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-semibold m-0 mb-1">Looking for a College?</h4>
              <p className="text-on-surface-variant m-0 mb-4">Tell us your target course and state — colleges will find you.</p>
              <Button variant="secondary" onClick={() => navigate('/student/enquiries')}>Submit a College Enquiry</Button>
            </div>
          </Card>

          <Card className="p-6">
            <h4 className="text-lg font-semibold mb-6">Practice Papers</h4>
            <p className="text-sm text-on-surface-variant mb-4">
              You've solved {distinctSolved} paper{distinctSolved === 1 ? '' : 's'} so far.
            </p>
            <Button variant="outline" size="sm" onClick={() => navigate('/student/practice-tests')}>Browse Practice Papers</Button>
          </Card>
        </div>

        <aside className="lg:col-span-4 flex flex-col gap-6">
          <Card className="p-6">
            <div className="w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center mb-6">
              <span className="material-symbols-outlined">groups</span>
            </div>
            <h4 className="text-lg font-semibold mb-2">Find Mentors</h4>
            <p className="text-sm text-on-surface-variant mb-4">Connect with mentors matched to your interests.</p>
            {loading ? (
              <p className="text-xs text-on-surface-variant">Loading...</p>
            ) : suggestedMentors.length === 0 ? (
              <p className="text-xs text-on-surface-variant">You're following everyone available right now.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {suggestedMentors.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold m-0 truncate">{m.name}</p>
                      <p className="text-[11px] text-on-surface-variant m-0 truncate">{m.domain || 'Mentor'}</p>
                    </div>
                    <Button
                      variant="soft"
                      size="sm"
                      disabled={followPendingId === m.id}
                      onClick={() => handleFollow(m.id)}
                    >
                      Follow
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => navigate('/student/mentors')}
              className="w-full mt-4 py-2 bg-transparent border-none text-primary font-semibold text-xs cursor-pointer rounded-lg hover:bg-surface-container-low"
            >
              Browse All Mentors
            </button>
          </Card>

          <Card className="p-6">
            <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-4">Milestone Tracking</h4>
            <div className="flex flex-col gap-6">
              {milestones.map((m) => (
                <div key={m.label}>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="font-bold">{m.label}</span>
                    <span className={m.tone === 'done' ? 'text-secondary' : 'text-primary'}>{loading ? '—' : m.status}</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                    <div
                      className={`h-full ${m.tone === 'done' ? 'bg-secondary' : 'bg-primary'}`}
                      style={{ width: `${loading ? 0 : m.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
