import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import ProgressRing from '../../components/ui/ProgressRing';
import Button from '../../components/ui/Button';
import { fetchMyFollowing, fetchMentors, fetchPapers, fetchMyAttempts, followMentor, ApiError } from '../../Api/Api';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKLY_GOAL = 5;

const BADGE_DEFS = [
  { key: 'first', icon: 'military_tech', label: 'First Attempt', earned: (s) => s.attemptsCount >= 1 },
  { key: 'five', icon: 'auto_awesome', label: '5 Papers Solved', earned: (s) => s.distinctSolved >= 5 },
  { key: 'perfect', icon: 'workspace_premium', label: 'Perfect Score', earned: (s) => s.hasPerfectScore },
  { key: 'follow', icon: 'group', label: 'First Mentor Followed', earned: (s) => s.followingCount >= 1 },
];

function last7DaysChart(attempts) {
  const counts = new Map();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toDateString();
    counts.set(key, 0);
    days.push({ key, day: DAY_LABELS[d.getDay()] });
  }
  attempts.forEach((a) => {
    if (!a.submitted_at) return;
    const key = new Date(a.submitted_at).toDateString();
    if (counts.has(key)) counts.set(key, counts.get(key) + 1);
  });
  const max = Math.max(1, ...Array.from(counts.values()));
  return days.map(({ key, day }) => ({
    day,
    h: Math.max(6, Math.round((counts.get(key) / max) * 100)),
    highlight: counts.get(key) > 0,
    count: counts.get(key),
  }));
}

function computeStreak(attempts) {
  const days = new Set(attempts.filter((a) => a.submitted_at).map((a) => new Date(a.submitted_at).toDateString()));
  let streak = 0;
  const cursor = new Date();
  while (days.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { displayName } = useAuth();
  const { leadsFor } = useData();
  const name = displayName || 'Student';
  const myLeads = leadsFor(displayName);
  const pointsTotal = myLeads.reduce((sum, l) => sum + l.points, 0);

  const [followingCount, setFollowingCount] = useState(null);
  const [suggestedMentor, setSuggestedMentor] = useState(null);
  const [featuredPaper, setFeaturedPaper] = useState(null);
  const [allPapers, setAllPapers] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [followPending, setFollowPending] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [following, mentors, papers, myAttempts] = await Promise.all([
          fetchMyFollowing(),
          fetchMentors(),
          fetchPapers(),
          fetchMyAttempts(),
        ]);
        setFollowingCount(following.length);
        const followedIds = new Set(following.map((m) => m.id));
        setSuggestedMentor(mentors.find((m) => !followedIds.has(m.id)) || null);
        setFeaturedPaper(papers[0] || null);
        setAllPapers(papers);
        setAttempts(myAttempts);
      } catch (err) {
        if (!(err instanceof ApiError)) throw err;
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const handleFollowSuggested = async () => {
    if (!suggestedMentor) return;
    setFollowPending(true);
    try {
      await followMentor(suggestedMentor.id);
      setFollowingCount((c) => (c ?? 0) + 1);
      setSuggestedMentor(null);
    } catch {
      // no-op, user can retry from Browse Mentors
    } finally {
      setFollowPending(false);
    }
  };

  const distinctSolved = new Set(attempts.map((a) => a.paper_id)).size;
  const hasPerfectScore = attempts.some((a) => a.total > 0 && a.score === a.total);
  const chart = last7DaysChart(attempts);
  const streak = computeStreak(attempts);
  const weekCount = chart.reduce((sum, c) => sum + c.count, 0);
  const weeklyGoalPct = Math.min(100, Math.round((weekCount / WEEKLY_GOAL) * 100));
  const notYetTried = allPapers.filter((p) => !attempts.some((a) => a.paper_id === p.id)).slice(0, 3);

  const badgeState = { attemptsCount: attempts.length, distinctSolved, hasPerfectScore, followingCount: followingCount ?? 0 };

  const KPIS = [
    { icon: 'download', iconBg: 'rgba(0,55,112,0.1)', iconColor: 'var(--color-primary)', label: 'Papers Available', value: loaded ? String(allPapers.length) : '—' },
    { icon: 'task_alt', iconBg: 'rgba(0,108,74,0.1)', iconColor: 'var(--color-secondary)', label: 'Papers Solved', value: loaded ? String(distinctSolved) : '—' },
    { icon: 'group', iconBg: 'rgba(0,75,164,0.1)', iconColor: 'var(--color-tertiary-container)', label: 'Mentors Following', value: followingCount === null ? '—' : String(followingCount) },
    { icon: 'send', iconBg: 'rgba(186,26,26,0.1)', iconColor: 'var(--color-error)', label: 'Leads Posted', value: String(myLeads.length).padStart(2, '0') },
  ];

  return (
    <div className="max-w-7xl w-full mx-auto px-10 py-6 box-border">
      <div className="mb-6">
        <h2 className="font-display text-3xl font-bold text-primary m-0">Welcome Back, {name}!</h2>
        <p className="text-lg text-on-surface-variant m-0 mt-1">
          Ready for your next move? Your learning streak is looking strong today.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {KPIS.map((k) => (
          <StatCard key={k.label} {...k} />
        ))}
        <Card className="p-4 bg-gradient-to-br from-primary to-primary-container text-on-primary border-none">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center mb-3">
            <span className="material-symbols-outlined">stars</span>
          </div>
          <p className="text-xs opacity-80 m-0">Reward Points</p>
          <h3 className="text-2xl font-bold m-0">{pointsTotal} pts</h3>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="font-display text-xl font-semibold m-0">Learning Progress</h4>
                <p className="text-xs text-on-surface-variant m-0 mt-0.5">Practice attempts over the last 7 days</p>
              </div>
            </div>
            <div className="h-56 flex items-end justify-between gap-4 px-2">
              {chart.map((c) => (
                <div key={c.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div
                    className={`w-full rounded-t-lg ${c.highlight ? 'bg-primary' : 'bg-primary/20'}`}
                    style={{ height: `${c.h}%` }}
                    title={`${c.count} attempt${c.count === 1 ? '' : 's'}`}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 text-[10px] text-on-surface-variant uppercase font-bold tracking-wider px-2">
              {chart.map((c) => <span key={c.day}>{c.day}</span>)}
            </div>
          </Card>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-display text-xl font-semibold m-0">Recommended for You</h4>
              <button
                onClick={() => navigate('/student/practice-tests')}
                className="bg-transparent border-none text-primary text-sm cursor-pointer hover:underline"
              >
                View All
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Card className="overflow-hidden">
                <div className="h-32 bg-surface-container-highest relative">
                  <span className="absolute top-3 left-3 bg-white/90 px-2 py-1 rounded-md text-[10px] font-bold text-primary">
                    {featuredPaper ? 'GUESS PAPER' : 'PRACTICE'}
                  </span>
                </div>
                <div className="p-4">
                  {featuredPaper ? (
                    <>
                      <h5 className="text-sm font-semibold m-0 mb-1">{featuredPaper.title}</h5>
                      <p className="text-xs text-on-surface-variant m-0 mb-4">
                        By {featuredPaper.mentor_name || 'Mentor'} · {featuredPaper.downloads} attempt{featuredPaper.downloads === 1 ? '' : 's'}
                      </p>
                      <Button
                        variant="soft"
                        size="sm"
                        className="w-full"
                        onClick={() => navigate(`/student/practice-tests/${featuredPaper.id}`)}
                      >
                        Start Test
                      </Button>
                    </>
                  ) : (
                    <>
                      <h5 className="text-sm font-semibold m-0 mb-1">No papers yet</h5>
                      <p className="text-xs text-on-surface-variant m-0 mb-4">Check back soon for new practice papers.</p>
                      <Button variant="soft" size="sm" className="w-full" disabled>Start Test</Button>
                    </>
                  )}
                </div>
              </Card>
              <Card className="overflow-hidden">
                <div className="h-32 bg-secondary/10 relative">
                  <span className="absolute top-3 left-3 bg-secondary text-on-secondary px-2 py-1 rounded-md text-[10px] font-bold">
                    TOP MENTOR
                  </span>
                </div>
                <div className="p-4">
                  {suggestedMentor ? (
                    <>
                      <h5 className="text-sm font-semibold m-0 mb-1">{suggestedMentor.name}</h5>
                      <p className="text-xs text-on-surface-variant m-0 mb-4">
                        {suggestedMentor.domain || 'Mentor'}{suggestedMentor.company ? ` · ${suggestedMentor.company}` : ''}
                      </p>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        disabled={followPending}
                        onClick={handleFollowSuggested}
                      >
                        Follow Mentor
                      </Button>
                    </>
                  ) : (
                    <>
                      <h5 className="text-sm font-semibold m-0 mb-1">You're all caught up</h5>
                      <p className="text-xs text-on-surface-variant m-0 mb-4">Explore more mentors in the directory.</p>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        onClick={() => navigate('/student/mentors')}
                      >
                        Browse Mentors
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card className="p-6 text-center">
            <h4 className="text-sm text-on-surface-variant mb-6">Weekly Practice Goal</h4>
            <div className="flex justify-center mb-3">
              <ProgressRing percent={weeklyGoalPct} />
            </div>
            <p className="text-xs text-on-surface-variant m-0">{weekCount} of {WEEKLY_GOAL} papers this week</p>
          </Card>

          <Card className="p-6 flex items-center justify-between bg-gradient-to-r from-secondary to-secondary-container text-on-secondary border-none">
            <div>
              <p className="text-xs opacity-80 m-0 mb-1">Current Streak</p>
              <h4 className="font-display text-xl font-bold m-0">{streak} Day{streak === 1 ? '' : 's'}</h4>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">local_fire_department</span>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary">assignment</span>
              <h4 className="text-sm font-semibold m-0">Papers You Haven't Tried Yet</h4>
            </div>
            {notYetTried.length === 0 ? (
              <p className="text-xs text-on-surface-variant m-0">You're caught up on every available paper!</p>
            ) : (
              <div className="flex flex-col gap-4">
                {notYetTried.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between border-l-4 border-primary pl-3 cursor-pointer"
                    onClick={() => navigate(`/student/practice-tests/${p.id}`)}
                  >
                    <div>
                      <p className="text-sm m-0">{p.title}</p>
                      <p className="text-[10px] text-on-surface-variant m-0">{p.subject}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-primary-fixed text-primary">
                      {p.question_count} Q
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h4 className="text-sm font-semibold mb-3">Recent Badges</h4>
            <div className="flex flex-wrap gap-3">
              {BADGE_DEFS.map((b) => {
                const earned = b.earned(badgeState);
                return (
                  <div
                    key={b.key}
                    title={b.label}
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      earned ? 'bg-surface-container-high text-primary' : 'border-2 border-dashed border-outline-variant text-on-surface-variant opacity-50'
                    }`}
                  >
                    <span className="material-symbols-outlined">{b.icon}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
