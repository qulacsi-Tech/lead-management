import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useSession } from '../context/useSession';
import { useLoginPrompt } from '../context/LoginPrompt';
import { useMyPages } from '../hooks/useMyPages';
import {
  ApiError,
  resolveAssetUrl,
  fetchPublicPages,
  fetchPublicOpportunities,
  fetchMyFollows,
  followPage,
  unfollowPage,
  likeOpportunity,
  unlikeOpportunity,
} from '../Api/Api';

const TYPE_BADGE = {
  admission: { label: 'Admission Open', tone: 'success' },
  job: { label: 'Job Vacancy', tone: 'tertiary' },
};

/** Two-letter monogram, shown when an institute has not uploaded a logo. */
function initials(name) {
  return (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString();
}

/** Whole days from now until `value`, or null when it is absent/past. */
function daysUntil(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Math.ceil((d - Date.now()) / 86400000);
  return diff >= 0 ? diff : null;
}

/** What an anonymous visitor sees in place of their own profile card. The
 *  feed itself is public; only the personal panels need an account. */
function GuestRail() {
  const { openLogin } = useLoginPrompt();
  return (
    <Card className="overflow-hidden">
      <div className="h-12 bg-gradient-to-r from-primary to-tertiary" />
      <div className="px-4 pb-4 -mt-6">
        <div className="w-14 h-14 rounded-full bg-surface-container-high border-4 border-surface-container-lowest flex items-center justify-center text-primary">
          <span className="material-symbols-outlined">person</span>
        </div>
        <p className="text-sm font-bold text-on-surface mt-2 mb-1">Welcome to Connectedus</p>
        <p className="text-xs text-on-surface-variant mb-3">
          The professional network built for education. Sign in to follow institutes, post and apply.
        </p>
        <Button size="sm" className="w-full" onClick={() => openLogin()}>Sign in</Button>
        <Link to="/signup">
          <Button size="sm" variant="outline" className="w-full mt-2">Join now</Button>
        </Link>
      </div>
    </Card>
  );
}

// Role-based branching (Professional vs. Student seeing different things)
// is paused per client feedback 12 Aug 2026 — see
// docs/CLIENT_FEEDBACK_2026-08-12.md, Section 1.
function ProfileRail({ name, headline }) {
  const { isInstituteAdmin: instituteAdmin } = useMyPages();
  const { auth } = useSession();
  const isPlatformAdmin = auth?.role === 'admin';
  return (
    <Card className="overflow-hidden">
      <div className="h-12 bg-gradient-to-r from-primary to-tertiary" />
      <div className="px-4 pb-4 -mt-6">
        <div className="w-14 h-14 rounded-full bg-surface-container-high border-4 border-surface-container-lowest flex items-center justify-center font-bold text-primary">
          {initials(name)}
        </div>
        <p className="text-sm font-bold text-on-surface mt-2 mb-0">{name}</p>
        <p className="text-xs text-on-surface-variant mb-0">
          {headline || 'Add a headline from your profile'}
        </p>
      </div>
      <div className="border-t border-outline-variant p-2">
        <Link to="/profile">
          <Button variant="ghost" size="sm" className="w-full justify-start" icon="person">My Profile</Button>
        </Link>
        {/* Institute management and marketplace history are user-side; a Main
            Admin does all of their work in the Admin portal instead. */}
        {isPlatformAdmin ? (
          <Link to="/admin">
            <Button variant="ghost" size="sm" className="w-full justify-start" icon="shield_person">
              Admin Dashboard
            </Button>
          </Link>
        ) : (
          <>
            {instituteAdmin && (
              <Link to="/institute">
                <Button variant="ghost" size="sm" className="w-full justify-start" icon="storefront">Institute Console</Button>
              </Link>
            )}
            <Link to="/purchased">
              <Button variant="ghost" size="sm" className="w-full justify-start" icon="bookmark">Saved / Purchased</Button>
            </Link>
          </>
        )}
      </div>
    </Card>
  );
}

/** Real admission notices with an end date, soonest first. */
function ClosingSoonRail({ opportunities, pageById }) {
  const closing = opportunities
    .filter((o) => o.type === 'admission' && daysUntil(o.end_date) !== null)
    .sort((a, b) => new Date(a.end_date) - new Date(b.end_date))
    .slice(0, 4);

  if (closing.length === 0) return null;

  return (
    <Card className="p-4">
      <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-3">
        Admissions closing soon
      </h4>
      <div className="space-y-3">
        {closing.map((o) => {
          const page = pageById[o.page_id];
          const days = daysUntil(o.end_date);
          return (
            <div key={o.id}>
              <p className="text-xs font-semibold text-on-surface mb-0">{o.title}</p>
              <p className="text-[11px] text-on-surface-variant mb-0">
                {page?.name || 'Institute'} · {days === 0 ? 'closes today' : `closes in ${days} day${days === 1 ? '' : 's'}`}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function Composer() {
  const [open, setOpen] = useState(false);
  const { auth } = useSession();
  const { openLogin } = useLoginPrompt();

  const actions = [
    { to: '/institute/notices', icon: 'campaign', label: 'Admission Notice' },
    { to: '/institute/jobs', icon: 'work', label: 'Job Vacancy' },
  ];

  return (
    <Card className="p-4">
      <button
        type="button"
        onClick={() => (auth ? setOpen((o) => !o) : openLogin('Sign in to post.'))}
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

/** One published admission notice or job vacancy, from /api/opportunities. */
function OpportunityCard({ opportunity: o, page }) {
  const { auth } = useSession();
  const { openLogin } = useLoginPrompt();
  const badge = TYPE_BADGE[o.type] || TYPE_BADGE.admission;
  const posted = formatDate(o.published_at || o.created_at);

  // Seeded from the server's answer, then replaced by it again on every
  // toggle — the count is never guessed client-side.
  const [liked, setLiked] = useState(!!o.liked_by_me);
  const [likes, setLikes] = useState(o.likes_count || 0);
  const [busy, setBusy] = useState(false);
  const [shared, setShared] = useState(false);

  const toggleLike = async () => {
    if (!auth) return openLogin('Sign in to like this.');
    setBusy(true);
    try {
      const res = liked ? await unlikeOpportunity(o.id) : await likeOpportunity(o.id);
      setLiked(res.liked);
      setLikes(res.likes_count);
    } catch {
      // Leave the button as it was; a failed like is not worth an alert.
    } finally {
      setBusy(false);
    }
  };

  // Share the institute page, since a notice has no URL of its own yet —
  // see docs/SEO_PUBLIC_SURFACE_PLAN_2026-08-23.md.
  const share = async () => {
    if (!page) return;
    const url = `${window.location.origin}/${page.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: o.title, text: o.description || '', url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      // User dismissed the share sheet, or the clipboard was refused.
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3 mb-3">
        <Link
          to={page ? `/${page.slug}` : '#'}
          className="w-11 h-11 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-primary shrink-0 overflow-hidden no-underline"
        >
          {page?.logo_url
            ? <img src={resolveAssetUrl(page.logo_url)} alt={page.name} className="w-full h-full object-cover" />
            : initials(page?.name)}
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={page ? `/${page.slug}` : '#'} className="no-underline">
            <p className="text-sm font-bold text-on-surface mb-0 truncate">{page?.name || 'Institute'}</p>
          </Link>
          <p className="text-xs text-on-surface-variant mb-0 truncate">
            {[page?.type, page?.city].filter(Boolean).join(' · ')}
          </p>
        </div>
        {posted && <span className="text-xs text-on-surface-variant shrink-0">{posted}</span>}
      </div>

      <Badge tone={badge.tone} className="mb-2">{badge.label}</Badge>
      <h4 className="text-sm font-bold text-on-surface mb-1">{o.title}</h4>
      {o.description && <p className="text-sm text-on-surface-variant mb-3">{o.description}</p>}

      <div className="grid grid-cols-2 gap-y-1 text-xs text-on-surface-variant mb-3">
        {o.type === 'admission' ? (
          <>
            {o.session && <span>Session: {o.session}</span>}
            {o.eligibility && <span>Eligibility: {o.eligibility}</span>}
            {o.end_date && <span>Ends: {formatDate(o.end_date)}</span>}
          </>
        ) : (
          <>
            {o.subject && <span>Subject: {o.subject}</span>}
            {o.experience && <span>Experience: {o.experience}</span>}
            {o.location && <span>Location: {o.location}</span>}
            {o.apply_before && <span>Apply before: {formatDate(o.apply_before)}</span>}
          </>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-outline-variant pt-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            icon={liked ? 'thumb_up' : 'thumb_up_off_alt'}
            className={liked ? 'text-primary' : ''}
            disabled={busy}
            onClick={toggleLike}
          >
            {likes > 0 ? likes : 'Like'}
          </Button>
          {page && (
            <Button variant="ghost" size="sm" icon={shared ? 'check' : 'share'} onClick={share}>
              {shared ? 'Link copied' : 'Share'}
            </Button>
          )}
        </div>
        {page && (
          <Link to={`/${page.slug}`}>
            <Button size="sm" variant="soft">
              {o.type === 'admission' ? 'View Notice' : 'View Vacancy'}
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );
}

function SuggestionsRail({ pages, myPageIds, followedIds, onToggleFollow, busyId }) {
  const { auth } = useSession();
  const { openLogin } = useLoginPrompt();

  // You don't follow a page you administer.
  const suggestions = pages.filter((p) => !myPageIds.has(p.id)).slice(0, 6);
  if (suggestions.length === 0) return null;

  return (
    <Card className="p-4">
      <h4 className="text-sm font-bold text-on-surface mb-3">Institute Pages to follow</h4>
      <div className="space-y-3">
        {suggestions.map((p) => {
          const following = followedIds.has(p.id);
          return (
            <div key={p.id} className="flex items-center gap-2">
              <Link to={`/${p.slug}`} className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-xs font-bold text-primary shrink-0 overflow-hidden no-underline">
                {p.logo_url
                  ? <img src={resolveAssetUrl(p.logo_url)} alt={p.name} className="w-full h-full object-cover" />
                  : initials(p.name)}
              </Link>
              <Link to={`/${p.slug}`} className="flex-1 min-w-0 no-underline">
                <p className="text-xs font-bold text-on-surface mb-0 truncate">{p.name}</p>
                <p className="text-[11px] text-on-surface-variant mb-0 truncate">{p.type}</p>
              </Link>
              <Button
                size="sm"
                variant={following ? 'outline' : 'ghost'}
                disabled={busyId === p.id}
                onClick={() => (auth ? onToggleFollow(p) : openLogin('Sign in to follow institutes.'))}
              >
                {following ? 'Following' : 'Follow'}
              </Button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function HiringRail({ opportunities, pageById }) {
  const hiringPages = new Set(
    opportunities.filter((o) => o.type === 'job').map((o) => o.page_id),
  );
  if (hiringPages.size === 0) return null;

  const names = [...hiringPages].map((id) => pageById[id]?.name).filter(Boolean);
  return (
    <Card className="p-4">
      <h4 className="text-sm font-bold text-on-surface mb-3">Who&apos;s hiring</h4>
      <p className="text-xs text-on-surface-variant mb-3">
        {hiringPages.size} institute{hiringPages.size === 1 ? ' is' : 's are'} advertising faculty
        vacancies{names.length ? `: ${names.slice(0, 3).join(', ')}` : ''}.
      </p>
    </Card>
  );
}

/**
 * The public feed.
 *
 * Readable without an account — an anonymous visitor lands here rather than on
 * a login wall and signs in from the header when they want to act.
 *
 * Everything shown is real: published admission notices and vacancies from
 * /api/opportunities, and enabled institutes from /api/pages/public. Member
 * posts are not here because there is no Post entity yet — see
 * docs/SEO_PUBLIC_SURFACE_PLAN_2026-08-23.md step 4.
 */
export default function Feed() {
  const { auth, name, profile } = useSession();
  const { pages: administered } = useMyPages();

  const [opportunities, setOpportunities] = useState([]);
  const [pages, setPages] = useState([]);
  const [followedIds, setFollowedIds] = useState(() => new Set());
  const [followBusyId, setFollowBusyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [oppRes, pageRes] = await Promise.allSettled([
        fetchPublicOpportunities({ limit: 30 }),
        fetchPublicPages(),
      ]);
      if (cancelled) return;
      setOpportunities(oppRes.status === 'fulfilled' ? oppRes.value : []);
      setPages(pageRes.status === 'fulfilled' ? pageRes.value : []);
      setError(
        oppRes.status === 'rejected' || pageRes.status === 'rejected'
          ? 'Some of the feed could not be loaded.'
          : '',
      );
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Which pages this account already follows — only meaningful when signed in.
  useEffect(() => {
    if (!auth) {
      setFollowedIds(new Set());
      return undefined;
    }
    let cancelled = false;
    fetchMyFollows()
      .then((rows) => !cancelled && setFollowedIds(new Set(rows.map((p) => p.id))))
      .catch(() => {});
    return () => { cancelled = true; };
  }, [auth]);

  const pageById = useMemo(
    () => Object.fromEntries(pages.map((p) => [p.id, p])),
    [pages],
  );
  const myPageIds = useMemo(
    () => new Set(administered.map((p) => p.id)),
    [administered],
  );

  const toggleFollow = useCallback(async (page) => {
    setFollowBusyId(page.id);
    const following = followedIds.has(page.id);
    try {
      if (following) await unfollowPage(page.id);
      else await followPage(page.id);
      setFollowedIds((prev) => {
        const next = new Set(prev);
        if (following) next.delete(page.id);
        else next.add(page.id);
        return next;
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update that follow.');
    } finally {
      setFollowBusyId(null);
    }
  }, [followedIds]);

  return (
    <div className="grid lg:grid-cols-[260px_1fr_280px] gap-5 items-start">
      <div className="hidden lg:block sticky top-20 space-y-4">
        {auth ? <ProfileRail name={name} headline={profile?.headline} /> : <GuestRail />}
        <ClosingSoonRail opportunities={opportunities} pageById={pageById} />
      </div>

      <div className="space-y-4">
        <Composer />

        {error && (
          <div className="px-4 py-3 rounded-xl bg-error-container text-on-error-container text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <Card className="p-10 text-center text-sm text-on-surface-variant">Loading feed…</Card>
        ) : opportunities.length > 0 ? (
          opportunities.map((o) => (
            <OpportunityCard key={o.id} opportunity={o} page={pageById[o.page_id]} />
          ))
        ) : (
          <Card className="p-10 text-center">
            <span className="material-symbols-outlined text-[40px] text-on-surface-variant">campaign</span>
            <p className="text-sm font-semibold text-on-surface mt-2 mb-1">Nothing posted yet</p>
            <p className="text-xs text-on-surface-variant mb-0">
              Admission notices and job vacancies published by institutes appear here.
            </p>
          </Card>
        )}
      </div>

      <div className="hidden lg:block sticky top-20 space-y-4">
        <SuggestionsRail
          pages={pages}
          myPageIds={myPageIds}
          followedIds={followedIds}
          onToggleFollow={toggleFollow}
          busyId={followBusyId}
        />
        <HiringRail opportunities={opportunities} pageById={pageById} />

        <div className="px-2 text-[11px] text-on-surface-variant leading-relaxed">
          <div className="flex flex-wrap gap-x-2 gap-y-1 mb-2">
            <span>About</span><span>·</span><span>Help</span><span>·</span>
            <span>Privacy</span><span>·</span><span>Terms</span>
          </div>
          © {new Date().getFullYear()} Nexus Intellect EdTech
        </div>
      </div>
    </div>
  );
}
