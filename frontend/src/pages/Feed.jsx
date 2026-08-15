import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import {
  mockFeedPosts,
  feedPostPool,
  mockPage,
  mockProfessional,
  RECENTLY_VIEWED,
  TRENDING_TOPICS,
  CLOSING_SOON,
} from './mockData';
import { useSession } from '../context/useSession';

const POST_TYPE_BADGE = {
  admission: { label: 'Admission Open', tone: 'success' },
  job: { label: 'Job Vacancy', tone: 'tertiary' },
  expert: { label: 'Expert Opinion', tone: 'primary' },
  lookingForJob: { label: 'Open to Work', tone: 'neutral' },
  lookingForAdmission: { label: 'Looking for Admission', tone: 'neutral' },
};

const MAX_POSTS = 24;
const REFRESH_SECONDS = 30;

// Role-based branching (Professional vs. Student seeing different things)
// is paused per client feedback 12 Aug 2026 — see
// docs/CLIENT_FEEDBACK_2026-08-12.md, Section 1. Every signed-in user now
// sees the same profile rail, composer options and dashboard tabs. The
// `role`/`category` fields are kept on the backend (unused here) so this is
// reversible without a data migration if the client asks for it back.
function ProfileRail({ name }) {
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="h-12 bg-gradient-to-r from-primary to-tertiary" />
        <div className="px-4 pb-4 -mt-6">
          <div className="w-14 h-14 rounded-full bg-surface-container-high border-4 border-surface-container-lowest flex items-center justify-center font-bold text-primary">
            {(name || 'U').split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <p className="text-sm font-bold text-on-surface mt-2 mb-0">{name}</p>
          <p className="text-xs text-on-surface-variant mb-3">{mockProfessional.headline}</p>
          <div className="text-xs text-on-surface-variant space-y-1 border-t border-outline-variant pt-3">
            <div className="flex justify-between"><span>Profile views</span><span className="font-semibold text-primary">36</span></div>
            <div className="flex justify-between"><span>Followers</span><span className="font-semibold text-primary">{mockProfessional.stats.followers}</span></div>
          </div>
        </div>
        <div className="border-t border-outline-variant p-2">
          <Link to="/profile">
            <Button variant="ghost" size="sm" className="w-full justify-start" icon="person">My Profile</Button>
          </Link>
          <Link to="/page">
            <Button variant="ghost" size="sm" className="w-full justify-start" icon="storefront">My Institute Page</Button>
          </Link>
          <Link to="/purchased">
            <Button variant="ghost" size="sm" className="w-full justify-start" icon="bookmark">Saved / Purchased</Button>
          </Link>
        </div>
      </Card>

      <Card className="p-4">
        <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-3">Recently viewed</h4>
        <div className="space-y-3">
          {RECENTLY_VIEWED.map((r) => (
            <div key={r.name} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
                {r.avatar}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-on-surface mb-0 truncate">{r.name}</p>
                <p className="text-[11px] text-on-surface-variant mb-0 truncate">{r.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-3">Admissions closing soon</h4>
        <div className="space-y-3">
          {CLOSING_SOON.map((c) => (
            <div key={c.course}>
              <p className="text-xs font-semibold text-on-surface mb-0">{c.course}</p>
              <p className="text-[11px] text-on-surface-variant mb-0">{c.institute} · closes in {c.closesIn}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Composer() {
  const [open, setOpen] = useState(false);

  const actions = [
    { to: '/page/post-admission', icon: 'campaign', label: 'Admission Notice' },
    { to: '/page/post-job', icon: 'work', label: 'Job Vacancy' },
    { to: '/dashboard', icon: 'psychology', label: 'Expert Opinion' },
    { to: '/dashboard', icon: 'business_center', label: 'Looking for Job' },
    { to: '/dashboard', icon: 'school', label: 'Looking for Admission' },
  ];

  return (
    <Card className="p-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-4 py-2.5 rounded-full border border-outline-variant text-sm text-on-surface-variant hover:bg-surface-container-low transition-all cursor-pointer"
      >
        Start a post, notice or vacancy...
      </button>
      {open && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-outline-variant">
          {actions.map((a) => (
            <Link key={a.label} to={a.to}>
              <Button variant="soft" size="sm" icon={a.icon}>{a.label}</Button>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

function LiveBanner({ countdown }) {
  return (
    <div className="flex items-center gap-2 text-xs text-on-surface-variant px-1">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
      </span>
      Live feed · next update in {countdown}s
    </div>
  );
}

function PostCard({ post, highlighted }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const badge = POST_TYPE_BADGE[post.postType];

  const toggleLike = () => {
    setLiked((l) => !l);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
  };

  return (
    <Card
      className={`p-4 transition-all duration-700 ${
        highlighted ? 'ring-2 ring-primary shadow-md' : ''
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-primary shrink-0">
          {post.author.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-on-surface mb-0 truncate">{post.author.name}</p>
          <p className="text-xs text-on-surface-variant mb-0 truncate">{post.author.sub}</p>
        </div>
        <span className="text-xs text-on-surface-variant shrink-0 flex items-center gap-1">
          {highlighted && <Badge tone="success">New</Badge>}
          {post.time}
        </span>
      </div>

      <Badge tone={badge.tone} className="mb-2">{badge.label}</Badge>
      <h4 className="text-sm font-bold text-on-surface mb-1">{post.title}</h4>
      <p className="text-sm text-on-surface-variant mb-3">{post.body}</p>

      <div className="flex items-center justify-between border-t border-outline-variant pt-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            icon={liked ? 'thumb_up' : 'thumb_up_off_alt'}
            className={liked ? 'text-primary' : ''}
            onClick={toggleLike}
          >
            {likeCount}
          </Button>
          <Button variant="ghost" size="sm" icon="chat_bubble_outline">{post.comments}</Button>
          <Button variant="ghost" size="sm" icon="share">Share</Button>
        </div>
        <Link to={post.ctaTo}>
          <Button size="sm" variant="soft">{post.ctaLabel}</Button>
        </Link>
      </div>
    </Card>
  );
}

function SuggestionsRail() {
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h4 className="text-sm font-bold text-on-surface mb-3">Institute Pages to follow</h4>
        <div className="space-y-3">
          {[
            { name: mockPage.name, sub: mockPage.type, avatar: 'BF' },
            { name: 'Horizon Public School', sub: 'School', avatar: 'HS' },
            { name: 'Zenith Training Institute', sub: 'Training Institute', avatar: 'ZT' },
          ].map((s) => (
            <div key={s.name} className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-xs font-bold text-primary shrink-0">
                {s.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-on-surface mb-0 truncate">{s.name}</p>
                <p className="text-[11px] text-on-surface-variant mb-0 truncate">{s.sub}</p>
              </div>
              <Button size="sm" variant="ghost">Follow</Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h4 className="text-sm font-bold text-on-surface mb-3">Trending in Education</h4>
        <div className="space-y-2.5">
          {TRENDING_TOPICS.map((t) => (
            <div key={t.tag} className="flex items-center justify-between">
              <span className="text-xs font-semibold text-primary">{t.tag}</span>
              <span className="text-[11px] text-on-surface-variant">{t.posts}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h4 className="text-sm font-bold text-on-surface mb-3">Who's hiring</h4>
        <p className="text-xs text-on-surface-variant mb-3">
          3 institutes are actively hiring faculty this week.
        </p>
        <Link to="/search">
          <Button size="sm" variant="soft" className="w-full">Browse Job Vacancies</Button>
        </Link>
      </Card>

      <div className="px-2 text-[11px] text-on-surface-variant leading-relaxed">
        <div className="flex flex-wrap gap-x-2 gap-y-1 mb-2">
          <span>About</span><span>·</span><span>Help</span><span>·</span>
          <span>Privacy</span><span>·</span><span>Terms</span>
        </div>
        EduNet UI Prototype © 2026
      </div>
    </div>
  );
}

let idCounter = 1000;

export default function Feed() {
  const { name } = useSession();
  const [posts, setPosts] = useState(mockFeedPosts.map((p) => ({ ...p })));
  const [loadingMore, setLoadingMore] = useState(false);
  const [reachedEnd, setReachedEnd] = useState(false);
  const [countdown, setCountdown] = useState(REFRESH_SECONDS);
  const [highlightId, setHighlightId] = useState(null);

  const poolIndex = useRef(0);
  const sentinelRef = useRef(null);

  const nextFromPool = () => {
    const template = feedPostPool[poolIndex.current % feedPostPool.length];
    poolIndex.current += 1;
    idCounter += 1;
    return { ...template, id: `p${idCounter}` };
  };

  // Infinite scroll: observe a sentinel at the bottom of the list.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries[0]?.isIntersecting;
        if (!isVisible || loadingMore || reachedEnd) return;
        setLoadingMore(true);
        setTimeout(() => {
          setPosts((prev) => {
            if (prev.length >= MAX_POSTS) {
              setReachedEnd(true);
              return prev;
            }
            const batch = [nextFromPool(), nextFromPool()].map((p) => ({ ...p, time: `${1 + Math.floor(Math.random() * 6)}d` }));
            return [...prev, ...batch];
          });
          setLoadingMore(false);
        }, 900);
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadingMore, reachedEnd]);

  // Live auto-refresh: every REFRESH_SECONDS, a new post appears at the top.
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          const fresh = { ...nextFromPool(), time: 'Just now' };
          setPosts((prev) => [fresh, ...prev]);
          setHighlightId(fresh.id);
          setTimeout(() => setHighlightId(null), 2500);
          return REFRESH_SECONDS;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  return (
    <div className="grid lg:grid-cols-[260px_1fr_280px] gap-5 items-start">
      <div className="hidden lg:block sticky top-20">
        <ProfileRail name={name} />
      </div>

      <div className="space-y-4">
        <LiveBanner countdown={countdown} />
        <Composer />
        {posts.map((post) => (
          <PostCard key={post.id} post={post} highlighted={post.id === highlightId} />
        ))}

        <div ref={sentinelRef} className="flex items-center justify-center py-6">
          {loadingMore && (
            <div className="flex items-center gap-2 text-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
              Loading more posts...
            </div>
          )}
          {reachedEnd && !loadingMore && (
            <p className="text-xs text-on-surface-variant mb-0">You're all caught up 🎉</p>
          )}
        </div>
      </div>

      <div className="hidden lg:block sticky top-20">
        <SuggestionsRail />
      </div>
    </div>
  );
}
