import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
import { pagePath } from '../utils/pageUrl';
import FeedBackdrop from '../components/FeedBackdrop';

// Orange for admissions and green for jobs — the same pair the landing page
// uses for its signposts and ad tags.
const TYPE_BADGE = {
  admission: {
    label: 'Admission Open', icon: 'campaign',
    pill: 'bg-orange-100 text-orange-700', bar: 'bg-gradient-to-r from-orange-400 to-amber-400',
  },
  job: {
    label: 'Job Vacancy', icon: 'work',
    pill: 'bg-emerald-100 text-emerald-700', bar: 'bg-gradient-to-r from-emerald-500 to-teal-400',
  },
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

/** A white rounded panel — the feed's card, in the landing page's shape. */
function Panel({ className = '', children }) {
  return (
    <section className={`bg-white rounded-3xl border border-slate-200 shadow-sm ${className}`}>
      {children}
    </section>
  );
}

function Avatar({ page, size = 'w-11 h-11', text = 'text-sm' }) {
  return (
    <span className={`${size} rounded-2xl bg-blue-50 ring-1 ring-blue-100 flex items-center justify-center font-bold ${text} text-blue-700 shrink-0 overflow-hidden`}>
      {page?.logo_url
        ? <img src={resolveAssetUrl(page.logo_url)} alt="" className="w-full h-full object-cover" />
        : initials(page?.name)}
    </span>
  );
}

/** What an anonymous visitor sees in place of their own profile card. */
function GuestRail() {
  const { openLogin } = useLoginPrompt();
  return (
    <Panel className="overflow-hidden">
      <div className="h-16 bg-gradient-to-r from-blue-600 to-indigo-600" />
      <div className="px-5 pb-5 -mt-8">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-md ring-4 ring-white flex items-center justify-center text-blue-600">
          <span className="material-symbols-outlined text-[30px]">person</span>
        </div>
        <p className="text-base font-bold text-slate-900 mt-3 mb-1">Welcome to ConnectEDus</p>
        <p className="text-xs text-slate-500 mb-4">
          Sign in to follow institutes, apply and download study material.
        </p>
        <button
          type="button"
          onClick={() => openLogin()}
          className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 border-none cursor-pointer"
        >
          Login
        </button>
        <Link
          to="/signup"
          className="block text-center w-full mt-2 py-2.5 rounded-xl text-sm font-bold text-blue-700 border border-blue-600 hover:bg-blue-50 no-underline"
        >
          Create Account
        </Link>
      </div>
    </Panel>
  );
}

const RAIL_LINK =
  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 no-underline transition-colors';

// Role-based branching (Professional vs. Student seeing different things)
// is paused per client feedback 12 Aug 2026 — see
// docs/CLIENT_FEEDBACK_2026-08-12.md, Section 1.
function ProfileRail({ name, headline }) {
  const { isInstituteAdmin: instituteAdmin } = useMyPages();
  const { auth } = useSession();
  const isPlatformAdmin = auth?.role === 'admin';

  const links = [{ to: '/profile', icon: 'person', label: 'My Profile' }];
  // Institute management and marketplace history are user-side; a Main Admin
  // does all of their work in the Admin portal instead.
  if (isPlatformAdmin) {
    links.push({ to: '/admin', icon: 'shield_person', label: 'Admin Dashboard' });
  } else {
    if (instituteAdmin) links.push({ to: '/institute', icon: 'storefront', label: 'Institute Console' });
    links.push({ to: '/purchased', icon: 'bookmark', label: 'Saved / Purchased' });
  }

  return (
    <Panel className="overflow-hidden">
      <div className="relative h-20 bg-gradient-to-r from-blue-600 to-indigo-600 overflow-hidden">
        <span className="absolute -right-6 -top-8 w-28 h-28 rounded-full bg-white/10" />
        <span className="absolute right-10 top-8 w-14 h-14 rounded-full bg-white/10" />
      </div>
      <div className="px-5 pb-4 -mt-9 relative">
        <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-orange-400 to-orange-500 ring-4 ring-white shadow-md flex items-center justify-center text-xl font-extrabold text-white">
          {initials(name)}
        </div>
        <p className="text-base font-bold text-slate-900 mt-3 mb-0">{name}</p>
        <p className="text-xs text-slate-500 mb-0">
          {headline || (
            <Link to="/profile" className="text-blue-600 font-semibold no-underline hover:underline">
              + Add a headline
            </Link>
          )}
        </p>
      </div>
      <nav className="border-t border-slate-100 p-2">
        {links.map((l) => (
          <Link key={l.to} to={l.to} className={RAIL_LINK}>
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">{l.icon}</span>
            </span>
            {l.label}
            <span className="material-symbols-outlined text-[18px] ml-auto text-slate-300">chevron_right</span>
          </Link>
        ))}
      </nav>
    </Panel>
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
    <Panel className="p-5">
      <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-4">
        <span className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
          <span className="material-symbols-outlined text-[18px]">timer</span>
        </span>
        Admissions closing soon
      </h4>
      <div className="space-y-3">
        {closing.map((o) => {
          const page = pageById[o.page_id];
          const days = daysUntil(o.end_date);
          return (
            <Link key={o.id} to={pagePath(page)} className="flex items-center gap-3 no-underline group">
              <span className="min-w-[44px] text-center rounded-xl bg-orange-50 border border-orange-100 py-1">
                <span className="block text-base font-extrabold text-orange-600 leading-none">{days}</span>
                <span className="block text-[9px] font-bold uppercase text-orange-500">{days === 1 ? 'day' : 'days'}</span>
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-slate-900 truncate group-hover:text-blue-700">{o.title}</span>
                <span className="block text-[11px] text-slate-500 truncate">{page?.name || 'Institute'}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </Panel>
  );
}

function Composer({ name }) {
  const { auth } = useSession();
  const { openLogin } = useLoginPrompt();

  const guard = (e) => {
    if (!auth) {
      e.preventDefault();
      openLogin('Sign in to post.');
    }
  };

  const actions = [
    { to: '/institute/notices', icon: 'campaign', label: 'Admission Notice', tone: 'text-orange-600 bg-orange-50' },
    { to: '/institute/jobs', icon: 'work', label: 'Job Vacancy', tone: 'text-emerald-600 bg-emerald-50' },
  ];

  return (
    <Panel className="p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-500 text-white font-bold flex items-center justify-center shrink-0">
          {initials(name)}
        </span>
        <Link
          to="/institute/notices"
          onClick={guard}
          className="flex-1 px-5 py-3 rounded-full bg-slate-50 border border-slate-200 text-sm text-slate-500 hover:border-blue-400 no-underline transition-colors"
        >
          Start a post, notice or vacancy...
        </Link>
      </div>
      <div className="flex flex-wrap gap-2 mt-3 sm:pl-14">
        {actions.map((a) => (
          <Link
            key={a.label}
            to={a.to}
            onClick={guard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 no-underline"
          >
            <span className={`w-6 h-6 rounded-lg flex items-center justify-center ${a.tone}`}>
              <span className="material-symbols-outlined text-[16px]">{a.icon}</span>
            </span>
            {a.label}
          </Link>
        ))}
      </div>
    </Panel>
  );
}

function Detail({ icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600">
      <span className="material-symbols-outlined text-[15px] text-slate-400">{icon}</span>
      {children}
    </span>
  );
}

const CARD_ACTION =
  'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-transparent border-none cursor-pointer transition-colors disabled:opacity-50';

/** One published admission notice or job vacancy, from /api/opportunities. */
function OpportunityCard({ opportunity: o, page }) {
  const { auth } = useSession();
  const { openLogin } = useLoginPrompt();
  const badge = TYPE_BADGE[o.type] || TYPE_BADGE.admission;
  const posted = formatDate(o.published_at || o.created_at);
  const closesIn = daysUntil(o.type === 'admission' ? o.end_date : o.apply_before);

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
    const url = `${window.location.origin}${pagePath(page)}`;
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
    <Panel className="overflow-hidden hover:shadow-md transition-shadow">
      <div className={`h-1.5 ${badge.bar}`} />
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <Link to={pagePath(page)} className="no-underline"><Avatar page={page} /></Link>
          <div className="flex-1 min-w-0">
            <Link to={pagePath(page)} className="no-underline">
              <p className="text-sm font-bold text-slate-900 mb-0 truncate hover:text-blue-700">{page?.name || 'Institute'}</p>
            </Link>
            <p className="text-xs text-slate-500 mb-0 truncate">
              {[page?.type, page?.city, posted].filter(Boolean).join(' · ')}
            </p>
          </div>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${badge.pill}`}>
            <span className="material-symbols-outlined text-[14px]">{badge.icon}</span>
            {badge.label}
          </span>
        </div>

        <h4 className="font-display text-lg font-bold text-slate-900 mb-1.5 leading-snug">{o.title}</h4>
        {o.description && (
          <p className="text-sm text-slate-600 mb-4 whitespace-pre-line leading-relaxed">{o.description}</p>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {o.type === 'admission' ? (
            <>
              {o.session && <Detail icon="calendar_month">Session {o.session}</Detail>}
              {o.eligibility && <Detail icon="school">{o.eligibility}</Detail>}
              {o.end_date && <Detail icon="event">Ends {formatDate(o.end_date)}</Detail>}
            </>
          ) : (
            <>
              {o.subject && <Detail icon="menu_book">{o.subject}</Detail>}
              {o.experience && <Detail icon="work_history">{o.experience}</Detail>}
              {o.location && <Detail icon="location_on">{o.location}</Detail>}
              {o.apply_before && <Detail icon="event">Apply by {formatDate(o.apply_before)}</Detail>}
            </>
          )}
          {closesIn !== null && closesIn <= 14 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-100 text-xs font-semibold text-orange-700">
              <span className="material-symbols-outlined text-[15px]">timer</span>
              {closesIn === 0 ? 'Closes today' : `Closes in ${closesIn} day${closesIn === 1 ? '' : 's'}`}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={busy}
              onClick={toggleLike}
              aria-pressed={liked}
              className={`${CARD_ACTION} ${liked ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <span className="material-symbols-outlined text-[20px]">{liked ? 'thumb_up' : 'thumb_up_off_alt'}</span>
              {likes > 0 ? likes : 'Like'}
            </button>
            {page && (
              <button type="button" onClick={share} className={`${CARD_ACTION} text-slate-600 hover:bg-slate-100`}>
                <span className="material-symbols-outlined text-[20px]">{shared ? 'check' : 'share'}</span>
                {shared ? 'Link copied' : 'Share'}
              </button>
            )}
          </div>
          {page && (
            <Link
              to={pagePath(page)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 no-underline shadow-sm shadow-blue-600/20"
            >
              {o.type === 'admission' ? 'View Notice' : 'View Vacancy'}
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          )}
        </div>
      </div>
    </Panel>
  );
}

/** How many institutes the rail shows before "Show more". */
const SUGGESTIONS_PAGE_SIZE = 5;

export function SuggestionsRail({ pages, myPageIds, followedIds, onToggleFollow, busyId }) {
  const { auth } = useSession();
  const { openLogin } = useLoginPrompt();
  const [visible, setVisible] = useState(SUGGESTIONS_PAGE_SIZE);

  // EVERY enabled institute appears here, including the ones the viewer
  // administers. They used to be filtered out, so someone who had just created
  // their organisation looked at the home page and could not find it — which
  // reads as "it was not created". Client report, 02 Sep 2026.
  //
  // Own pages are shown but not offered a Follow button; you cannot follow
  // yourself, so they get a link into the console instead. Newest first, which
  // is the order the API returns, so a page just created is at the top.
  const suggestions = pages;
  if (suggestions.length === 0) return null;

  const shown = suggestions.slice(0, visible);
  const remaining = suggestions.length - shown.length;

  return (
    <Panel className="p-5">
      <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-4">
        <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
          <span className="material-symbols-outlined text-[18px]">apartment</span>
        </span>
        Institute Pages to follow
      </h4>
      <div className="space-y-3">
        {shown.map((p) => {
          const following = followedIds.has(p.id);
          const mine = myPageIds.has(p.id);
          return (
            <div key={p.id} className="flex items-center gap-2.5">
              <Link to={pagePath(p)} className="no-underline">
                <Avatar page={p} size="w-10 h-10" text="text-xs" />
              </Link>
              <Link to={pagePath(p)} className="flex-1 min-w-0 no-underline group">
                <p className="text-xs font-bold text-slate-900 mb-0 truncate group-hover:text-blue-700">{p.name}</p>
                <p className="text-[11px] text-slate-500 mb-0 truncate">{[p.type, p.city].filter(Boolean).join(' · ')}</p>
              </Link>
              {mine ? (
                <Link to="/institute" className="no-underline shrink-0">
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border-none cursor-pointer"
                  >
                    Manage
                  </button>
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={busyId === p.id}
                  onClick={() => (auth ? onToggleFollow(p) : openLogin('Sign in to follow institutes.'))}
                  className={`shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors disabled:opacity-50 ${
                    following
                      ? 'text-blue-700 bg-blue-50 border border-blue-100'
                      : 'text-white bg-blue-600 hover:bg-blue-700 border border-blue-600'
                  }`}
                >
                  {following ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Progressive disclosure rather than a hard cap: the rail opens at five
          and grows a page at a time, so a long list stays reachable without
          burying the feed beside it. */}
      {remaining > 0 && (
        <button
          type="button"
          onClick={() => setVisible((v) => v + SUGGESTIONS_PAGE_SIZE)}
          className="w-full mt-4 py-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 border-none hover:bg-blue-100 cursor-pointer"
        >
          Show {Math.min(remaining, SUGGESTIONS_PAGE_SIZE)} more
          {remaining > SUGGESTIONS_PAGE_SIZE ? ` of ${remaining}` : ''}
        </button>
      )}
      {remaining === 0 && visible > SUGGESTIONS_PAGE_SIZE && (
        <button
          type="button"
          onClick={() => setVisible(SUGGESTIONS_PAGE_SIZE)}
          className="w-full mt-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-50 border-none hover:bg-slate-100 cursor-pointer"
        >
          Show less
        </button>
      )}
    </Panel>
  );
}

function HiringRail({ opportunities, pageById }) {
  const hiringPages = new Set(
    opportunities.filter((o) => o.type === 'job').map((o) => o.page_id),
  );
  if (hiringPages.size === 0) return null;

  const names = [...hiringPages].map((id) => pageById[id]?.name).filter(Boolean);
  return (
    <section className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm">
      <span className="absolute -right-8 -bottom-10 w-32 h-32 rounded-full bg-white/10" aria-hidden="true" />
      <span className="material-symbols-outlined absolute right-4 top-4 text-[40px] text-white/25" aria-hidden="true">work</span>
      <h4 className="text-sm font-bold mb-1">Who&apos;s hiring</h4>
      <p className="text-3xl font-extrabold m-0 leading-tight">{hiringPages.size}</p>
      <p className="text-xs text-white/90 mb-0">
        institute{hiringPages.size === 1 ? ' is' : 's are'} advertising faculty vacancies
        {names.length ? `: ${names.slice(0, 3).join(', ')}` : ''}.
      </p>
    </section>
  );
}

const CATEGORY_TILES = [
  { type: 'College', label: 'Colleges', icon: 'school', tone: 'bg-blue-50 text-blue-600' },
  { type: 'Coaching', label: 'Coaching', icon: 'account_balance', tone: 'bg-orange-50 text-orange-600' },
  { type: 'School', label: 'Schools', icon: 'domain', tone: 'bg-emerald-50 text-emerald-600' },
  { type: 'University', label: 'Universities', icon: 'location_city', tone: 'bg-indigo-50 text-indigo-600' },
  { type: 'Training Institute', label: 'Training', icon: 'model_training', tone: 'bg-amber-50 text-amber-600' },
];

/** How many institutes of each type are on the platform, from the same page list. */
function CategoryRail({ pages }) {
  if (pages.length === 0) return null;
  const count = (type) => pages.filter((p) => p.type === type).length;
  const tiles = CATEGORY_TILES.map((t) => ({ ...t, n: count(t.type) })).filter((t) => t.n > 0);
  if (tiles.length === 0) return null;

  return (
    <Panel className="p-5">
      <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-4">
        <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <span className="material-symbols-outlined text-[18px]">category</span>
        </span>
        Institutes by category
      </h4>
      <div className="grid grid-cols-2 gap-2">
        {tiles.map((t) => (
          <div key={t.type} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${t.tone}`}>
              <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
            </span>
            <span className="block text-lg font-extrabold text-slate-900 leading-none">{t.n}</span>
            <span className="block text-[11px] text-slate-500 mt-0.5">{t.label}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/** The subjects institutes are hiring for; clicking one shows the jobs. */
function SubjectsRail({ opportunities, onPick }) {
  const tally = new Map();
  opportunities
    .filter((o) => o.type === 'job' && o.subject)
    .forEach((o) => {
      const key = o.subject.trim();
      const label = key.charAt(0).toUpperCase() + key.slice(1);
      tally.set(label, (tally.get(label) || 0) + 1);
    });
  const subjects = [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (subjects.length === 0) return null;

  return (
    <Panel className="p-5">
      <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-4">
        <span className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
          <span className="material-symbols-outlined text-[18px]">trending_up</span>
        </span>
        Subjects in demand
      </h4>
      <div className="flex flex-wrap gap-2">
        {subjects.map(([subject, n]) => (
          <button
            key={subject}
            type="button"
            onClick={onPick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 hover:border-blue-400 hover:text-blue-700 cursor-pointer"
          >
            #{subject}
            <span className="text-[10px] px-1.5 rounded-full bg-blue-600 text-white">{n}</span>
          </button>
        ))}
      </div>
    </Panel>
  );
}

// Sticky rails scroll on their own when they are taller than the window,
// rather than having their lower cards cut off.
const RAIL =
  'hidden lg:block sticky top-24 space-y-4 max-h-[calc(100vh-7rem)] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-2';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const FILTERS = [
  { key: 'all', label: 'All', icon: 'dynamic_feed' },
  { key: 'admission', label: 'Admissions', icon: 'campaign' },
  { key: 'job', label: 'Jobs', icon: 'work' },
];

/**
 * The greeting strip at the top of the feed: one line of greeting and the
 * real counts as small pills (client asked for half the height, minimal).
 */
function WelcomeBanner({ name, counts }) {
  const first = (name || '').split(/\s+/)[0];
  const stats = [
    { label: 'Admissions', value: counts.admission, icon: 'campaign' },
    { label: 'Vacancies', value: counts.job, icon: 'work' },
    { label: 'Institutes', value: counts.pages, icon: 'apartment' },
  ];
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3.5 shadow-md shadow-blue-600/20">
      <span className="absolute -right-8 -top-14 w-36 h-36 rounded-full bg-white/10" aria-hidden="true" />
      <div className="relative flex items-center justify-between gap-3 flex-wrap">
        <h1 className="font-display text-lg font-bold m-0">
          <span className="font-medium text-white/80">{greeting()}{first ? ',' : ''}</span>{' '}
          {first || 'Welcome'} <span aria-hidden="true">👋</span>
        </h1>
        <ul className="flex items-center gap-2 list-none m-0 p-0">
          {stats.map((s) => (
            <li
              key={s.label}
              title={s.label}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs"
            >
              <span className="material-symbols-outlined text-[15px] text-white/80">{s.icon}</span>
              <span className="font-extrabold">{s.value}</span>
              <span className="text-white/80 hidden sm:inline">{s.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * The feed, for signed-in members (anonymous visitors get the landing page).
 *
 * Everything shown is real: published admission notices and vacancies from
 * /api/opportunities, and enabled institutes from /api/pages/public. Member
 * posts are not here because there is no Post entity yet — see
 * docs/SEO_PUBLIC_SURFACE_PLAN_2026-08-23.md step 4.
 *
 * Styled to match the landing page (client request, 26 Sep 2026).
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
  const [filter, setFilter] = useState('all');

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
  const authId = auth?.id || auth?.email;
  useEffect(() => {
    if (!authId) {
      setFollowedIds(new Set());
      return undefined;
    }
    let cancelled = false;
    fetchMyFollows()
      .then((rows) => !cancelled && setFollowedIds(new Set(rows.map((p) => p.id))))
      .catch(() => {});
    return () => { cancelled = true; };
  }, [authId]);

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

  const counts = {
    all: opportunities.length,
    admission: opportunities.filter((o) => o.type === 'admission').length,
    job: opportunities.filter((o) => o.type === 'job').length,
    pages: pages.length,
  };
  const visible = filter === 'all' ? opportunities : opportunities.filter((o) => o.type === filter);

  return (
    <>
    <FeedBackdrop />
    <div className="relative z-10 grid lg:grid-cols-[260px_1fr_280px] xl:grid-cols-[312px_1fr_336px] gap-5 items-start">
      <div className={RAIL}>
        {auth ? <ProfileRail name={name} headline={profile?.headline} /> : <GuestRail />}
        <ClosingSoonRail opportunities={opportunities} pageById={pageById} />
        <CategoryRail pages={pages} />
      </div>

      <div className="space-y-4 min-w-0">
        <WelcomeBanner name={auth ? name : ''} counts={counts} />
        <Composer name={name} />

        <div className="flex items-center gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filter the feed">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(f.key)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border cursor-pointer whitespace-nowrap transition-all ${
                  active
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-600/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{f.icon}</span>
                {f.label}
                <span className={`text-[11px] px-1.5 rounded-full ${active ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                  {counts[f.key]}
                </span>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-error-container text-on-error-container text-sm">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        {loading ? (
          <Panel className="p-10 text-center text-sm text-slate-500">Loading feed…</Panel>
        ) : visible.length > 0 ? (
          visible.map((o) => (
            <OpportunityCard key={o.id} opportunity={o} page={pageById[o.page_id]} />
          ))
        ) : (
          <Panel className="p-10 text-center">
            <span className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[30px]">campaign</span>
            </span>
            <p className="text-sm font-bold text-slate-900 mt-3 mb-1">Nothing posted yet</p>
            <p className="text-xs text-slate-500 mb-0">
              {filter === 'job'
                ? 'Job vacancies published by institutes appear here.'
                : filter === 'admission'
                  ? 'Admission notices published by institutes appear here.'
                  : 'Admission notices and job vacancies published by institutes appear here.'}
            </p>
          </Panel>
        )}
      </div>

      <div className={RAIL}>
        <SuggestionsRail
          pages={pages}
          myPageIds={myPageIds}
          followedIds={followedIds}
          onToggleFollow={toggleFollow}
          busyId={followBusyId}
        />
        <HiringRail opportunities={opportunities} pageById={pageById} />
        <SubjectsRail
          opportunities={opportunities}
          onPick={() => { setFilter('job'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        />

        <div className="px-2 text-[11px] text-slate-500 leading-relaxed">
          <div className="flex flex-wrap gap-x-2 gap-y-1 mb-2">
            <span>About</span><span>·</span><span>Help</span><span>·</span>
            <span>Privacy</span><span>·</span><span>Terms</span>
          </div>
          © {new Date().getFullYear()} ConnectEDus · Nexus Intellect EdTech
        </div>
      </div>
    </div>
    </>
  );
}
