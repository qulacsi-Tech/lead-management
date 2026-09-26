import { useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLoginPrompt } from '../context/LoginPrompt';
import { fetchPublicPages, resolveAssetUrl } from '../Api/Api';
import { pagePath } from '../utils/pageUrl';
import HeroIllustration from '../components/landing/HeroIllustration';
import ChatDemo from '../components/landing/ChatDemo';
import Logo from '../components/landing/Logo';

/**
 * The public front door at `/`.
 *
 * Client requirement, 26 Sep 2026: "make a landing page and after user logs in
 * then it'll navigate to feeds." Anonymous visitors land here; a signed-in
 * visitor is sent on to where they work (the feed, or their console), which
 * also covers signing in from this page — the redirect fires as soon as the
 * session exists.
 *
 * Institute search works without an account because institute pages are
 * public. Jobs, admission notices and study material live in the feed, which
 * is member-only, so those entry points go to the sign-in page instead.
 *
 * Styled after the client's reference mock (bright blue accents, ConnectEDus
 * wordmark) rather than the app's navy tokens, since it is the marketing face.
 */

const SEARCH_TYPES = [
  { type: 'College', label: 'College', icon: 'school' },
  { type: 'Coaching', label: 'Coaching', icon: 'account_balance' },
  { type: 'School', label: 'School', icon: 'domain' },
  { type: 'University', label: 'University', icon: 'location_city' },
];

const EXPLORE_TYPES = [
  { type: 'College', label: 'Colleges' },
  { type: 'Coaching', label: 'Coaching' },
  { type: 'School', label: 'Schools' },
  { type: 'University', label: 'Universities' },
  { type: 'Training Institute', label: 'Training Institutes' },
];

const STEPS = [
  { icon: 'chat', title: 'Tell Us What You Need', body: 'Choose your preference or type your requirement.' },
  { icon: 'manage_search', title: 'Get Personalized Results', body: 'See relevant colleges, coaching, schools & universities.' },
  { icon: 'description', title: 'Share Your Details', body: 'Save your requirement and let institutes reach you.' },
  { icon: 'track_changes', title: 'Track & Connect', body: 'Check your enquiry status, views and responses.' },
];

const FEATURES = [
  { icon: 'verified_user', title: 'Verified Institutes', body: 'Only genuine and verified institutes' },
  { icon: 'groups', title: 'Expert Guidance', body: 'Get help from education experts' },
  { icon: 'star', title: 'Wide Choices', body: 'Multiple options in one place' },
  { icon: 'bolt', title: 'Easy & Fast', body: 'Simple steps, less hassle' },
];

// Add a URL to show the icon as a link; without one it is not rendered.
const SOCIAL_LINKS = [
  { name: 'Facebook', href: '', path: 'M14 8h3V4h-3c-2.8 0-4.5 1.8-4.5 4.6V11H7v4h2.5v9h4v-9h3l.5-4h-3.5V8.8c0-.5.3-.8.5-.8Z' },
  { name: 'Instagram', href: '', path: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm5.5-1.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z' },
  { name: 'LinkedIn', href: '', path: 'M4 9h4v12H4V9Zm2-6a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm4 6h3.8v1.7C14.4 9.7 15.7 9 17.4 9 20.3 9 21 10.9 21 13.6V21h-4v-6.6c0-1.3-.3-2.4-1.7-2.4-1.5 0-2.3 1-2.3 2.5V21h-4V9Z' },
  { name: 'YouTube', href: '', path: 'M22 8.2c-.2-1.6-1-2.6-2.6-2.8C17.2 5 12 5 12 5s-5.2 0-7.4.4C3 5.6 2.2 6.6 2 8.2 1.8 9.8 1.8 12 1.8 12s0 2.2.2 3.8c.2 1.6 1 2.6 2.6 2.8C6.8 19 12 19 12 19s5.2 0 7.4-.4c1.6-.2 2.4-1.2 2.6-2.8.2-1.6.2-3.8.2-3.8s0-2.2-.2-3.8ZM10 15V9l5.2 3L10 15Z' },
];

function initials(name) {
  return (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function pageMatches(page, type, query) {
  if (type && page.type !== type) return false;
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = [
    page.name, page.type, page.city, page.state, page.tagline, page.affiliation,
    ...(page.course_categories || []).flatMap((c) => [c.category, ...(c.subcategories || [])]),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return tokens.every((t) => haystack.includes(t));
}

function ExploreMenu({ onPick }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        aria-expanded={open}
        className="flex items-center gap-0.5 text-sm font-semibold text-on-surface bg-transparent border-none cursor-pointer px-2 py-2 hover:text-blue-600"
      >
        Explore
        <span className="material-symbols-outlined text-[18px]">expand_more</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 w-52 bg-white border border-outline-variant rounded-xl shadow-lg p-1.5">
          {EXPLORE_TYPES.map((t) => (
            <button
              key={t.type}
              type="button"
              onClick={() => { setOpen(false); onPick(t.type); }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-on-surface bg-transparent border-none cursor-pointer hover:bg-blue-50"
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultCard({ page }) {
  return (
    <Link
      to={pagePath(page)}
      className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-outline-variant hover:border-blue-500 hover:shadow-md transition-all no-underline"
    >
      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 font-bold flex items-center justify-center overflow-hidden shrink-0">
        {page.logo_url
          ? <img src={resolveAssetUrl(page.logo_url)} alt="" className="w-full h-full object-cover" />
          : initials(page.name)}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-on-surface m-0 truncate">{page.name}</p>
        <p className="text-xs text-on-surface-variant m-0 truncate">
          {[page.type, [page.city, page.state].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}
        </p>
        {page.tagline && <p className="text-xs text-on-surface-variant italic m-0 mt-0.5 truncate">{page.tagline}</p>}
      </div>
      <span className="material-symbols-outlined text-blue-600 ml-auto shrink-0">arrow_forward</span>
    </Link>
  );
}

function GoalsIllustration() {
  return (
    <svg viewBox="0 0 160 170" className="w-36 h-40 shrink-0" aria-hidden="true">
      <circle cx="80" cy="95" r="70" fill="#dbeafe" />
      <path d="M30 170 C30 128 50 112 80 112 C110 112 130 128 130 170 Z" fill="#60a5fa" />
      <rect x="70" y="92" width="20" height="24" rx="8" fill="#f2c7a5" />
      <circle cx="80" cy="72" r="26" fill="#f2c7a5" />
      <path d="M52 78 C46 40 108 34 108 74 C108 94 104 118 100 124 C100 100 98 80 92 66 C82 60 64 62 58 76 C56 96 58 110 60 124 C54 116 50 96 52 78 Z" fill="#1f2937" />
      <circle cx="71" cy="74" r="2.5" fill="#1f2937" />
      <circle cx="89" cy="74" r="2.5" fill="#1f2937" />
      <path d="M72 86 C77 90 83 90 88 86" stroke="#9a3412" strokeWidth="2" fill="none" strokeLinecap="round" />
      <rect x="84" y="118" width="40" height="46" rx="4" fill="#1d4ed8" transform="rotate(-8 104 141)" />
      <rect x="90" y="124" width="28" height="4" rx="2" fill="#93c5fd" transform="rotate(-8 104 141)" />
    </svg>
  );
}

export default function Landing() {
  const { role, initializing } = useAuth();
  const { openLogin } = useLoginPrompt();

  const [type, setType] = useState('College');
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  // null until the first search; then the filter that produced `results`.
  const [search, setSearch] = useState(null);
  const [pages, setPages] = useState(null);
  const [loadError, setLoadError] = useState('');

  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  const howRef = useRef(null);

  // Loaded on the first search rather than on mount: most visitors never
  // search, and the page should not wait on an API call to render.
  useEffect(() => {
    if (!search || pages) return;
    fetchPublicPages(undefined, { limit: 200 })
      .then((list) => setPages(Array.isArray(list) ? list : []))
      .catch(() => { setLoadError("Couldn't load institutes. Please try again."); setPages([]); });
  }, [search, pages]);

  useEffect(() => {
    if (search) resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [search]);

  // Every signed-in user goes to the feed — including an admin who chose
  // "Back to Connectedus". Signing in from the login page still takes admins
  // to their console (utils/authRedirect.js afterSignIn).
  if (initializing) return null;
  if (role) return <Navigate to="/feed" replace />;

  const runSearch = (nextType = type, nextQuery = query) => {
    setMenuOpen(false);
    setLoadError('');
    setSearch({ type: nextType, query: nextQuery.trim(), at: Date.now() });
  };

  const pickType = (t) => {
    setType(t);
    runSearch(t, query);
  };

  const needsAccount = (reason) => {
    setMenuOpen(false);
    openLogin(reason);
  };

  const QUICK_LINKS = [
    { icon: 'search', title: 'Search Jobs', body: 'Find your next opportunity', onClick: () => needsAccount('Sign in to see teaching and staff vacancies.') },
    { icon: 'campaign', title: 'Admission Notice', body: 'Latest updates & notifications', onClick: () => needsAccount('Sign in to see the latest admission notices.') },
    { icon: 'apartment', title: 'Search Institute', body: 'Explore top institutes', onClick: () => runSearch(null, query) },
    { icon: 'person_search', title: 'Search Coaching', body: 'Best coaching for your goals', onClick: () => pickType('Coaching') },
    { icon: 'school', title: 'Search University', body: 'Discover top universities', onClick: () => pickType('University') },
  ];

  const NAV_LINKS = [
    ...EXPLORE_TYPES.slice(0, 4).map((t) => ({ label: t.label, onClick: () => pickType(t.type) })),
    { label: 'Jobs', onClick: () => needsAccount('Sign in to see teaching and staff vacancies.') },
    { label: 'Study Material', onClick: () => needsAccount('Sign in to download guess papers and study material.') },
  ];

  const results = search && pages ? pages.filter((p) => pageMatches(p, search.type, search.query)) : [];
  const resultsLabel = search
    ? [search.type ? `${search.type}s` : 'Institutes', search.query && `matching “${search.query}”`].filter(Boolean).join(' ')
    : '';

  return (
    <div className="min-h-screen bg-slate-50 text-on-surface font-body">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center gap-3 sm:gap-6">
          <Logo />

          <nav className="hidden lg:flex items-center gap-1 ml-6">
            <ExploreMenu onPick={pickType} />
            {NAV_LINKS.map((l) => (
              <button
                key={l.label}
                type="button"
                onClick={l.onClick}
                className="text-sm font-semibold text-on-surface bg-transparent border-none cursor-pointer px-3 py-2 hover:text-blue-600"
              >
                {l.label}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              aria-label="Search"
              onClick={() => inputRef.current?.focus()}
              className="hidden sm:flex w-10 h-10 rounded-full items-center justify-center bg-transparent border-none cursor-pointer text-on-surface hover:bg-slate-100"
            >
              <span className="material-symbols-outlined">search</span>
            </button>
            <button
              type="button"
              onClick={() => openLogin()}
              className="hidden sm:inline-flex px-5 py-2.5 rounded-xl text-sm font-semibold text-blue-700 bg-white border border-blue-600 cursor-pointer hover:bg-blue-50"
            >
              Login
            </button>
            <Link
              to="/signup"
              className="px-3 sm:px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 no-underline shadow-sm whitespace-nowrap"
            >
              <span className="sm:hidden">Sign up</span>
              <span className="hidden sm:inline">Create Account</span>
            </Link>
            <button
              type="button"
              aria-label="Menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center bg-transparent border-none cursor-pointer text-on-surface hover:bg-slate-100"
            >
              <span className="material-symbols-outlined">{menuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 grid grid-cols-2 gap-1">
            {[...EXPLORE_TYPES.slice(4).map((t) => ({ label: t.label, onClick: () => pickType(t.type) })), ...NAV_LINKS].map((l) => (
              <button
                key={l.label}
                type="button"
                onClick={l.onClick}
                className="text-left text-sm font-semibold text-on-surface bg-transparent border-none cursor-pointer px-3 py-2.5 rounded-lg hover:bg-slate-100"
              >
                {l.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => { setMenuOpen(false); openLogin(); }}
              className="sm:hidden text-left text-sm font-semibold text-blue-700 bg-transparent border-none cursor-pointer px-3 py-2.5 rounded-lg hover:bg-slate-100"
            >
              Login
            </button>
          </nav>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50 to-sky-100">
        {/* Full-bleed scene on the right, running under the chat panel and
            fading into the page on its left edge (client reference). */}
        <div className="hidden lg:block absolute inset-y-0 right-0 w-[64%] max-w-[1000px] [mask-image:linear-gradient(to_right,transparent,black_28%)]">
          <HeroIllustration className="w-full h-full" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-20 lg:min-h-[600px] grid lg:grid-cols-[1fr_1.1fr_0.9fr] gap-8 lg:gap-12 items-center">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold leading-tight text-slate-900 m-0">
              Your Education Journey, <span className="text-blue-600">Made Simple</span>
            </h1>
            <p className="text-base text-slate-700 mt-5 mb-3">Search, Discover, Connect — All in One Place.</p>
            <p className="text-sm text-slate-600 m-0 max-w-md">
              Find the right college, coaching, school or university and take the next step towards your future.
            </p>
          </div>

          {/* Assistant panel: an auto-playing preview conversation, with the
              real category picker and search box underneath it. */}
          <ChatDemo>
            <div className="flex flex-wrap gap-2 mb-3" role="radiogroup" aria-label="What are you looking for?">
              {SEARCH_TYPES.map((t) => {
                const active = type === t.type;
                return (
                  <button
                    key={t.type}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setType(t.type)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-all ${
                      active
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
                    {t.label}
                  </button>
                );
              })}
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); runSearch(); }}
              className="flex items-center gap-2 bg-white border border-slate-300 rounded-full pl-5 pr-1.5 py-1.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100"
            >
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type your requirement..."
                aria-label="Type your requirement — name, city or course"
                className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm text-slate-900 py-2"
              />
              <button
                type="submit"
                aria-label="Search"
                className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center border-none cursor-pointer hover:bg-blue-700 shrink-0"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            </form>
          </ChatDemo>

          {/* Third column left empty: the scene behind shows through here. */}
          <div className="hidden lg:block" aria-hidden="true" />
        </div>
      </section>

      {/* Quick links */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 lg:divide-x divide-slate-200">
          {QUICK_LINKS.map((q) => (
            <button
              key={q.title}
              type="button"
              onClick={q.onClick}
              className="flex items-center gap-3 px-5 py-5 text-left bg-transparent border-none cursor-pointer hover:bg-blue-50/60 transition-colors first:rounded-l-2xl last:rounded-r-2xl"
            >
              <span className="w-11 h-11 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">{q.icon}</span>
              </span>
              <span>
                <span className="block text-sm font-bold text-slate-900">{q.title}</span>
                <span className="block text-xs text-slate-500">{q.body}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Search results */}
      {search && (
        <section ref={resultsRef} className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 scroll-mt-24">
          <div className="flex items-end justify-between gap-3 mb-4 flex-wrap">
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900 m-0">{resultsLabel}</h2>
              {pages && !loadError && (
                <p className="text-sm text-slate-500 m-0 mt-1">
                  {results.length} {results.length === 1 ? 'result' : 'results'}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSearch(null)}
              className="text-sm font-semibold text-blue-700 bg-transparent border-none cursor-pointer hover:underline"
            >
              Clear search
            </button>
          </div>

          {!pages && <p className="text-sm text-slate-500">Searching…</p>}
          {loadError && <p className="text-sm text-error">{loadError}</p>}
          {pages && !loadError && results.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <span className="material-symbols-outlined text-slate-400 text-[40px]">search_off</span>
              <p className="text-sm text-slate-600 mt-2 mb-0">
                No institutes found. Try a different name, city or course — or pick another category.
              </p>
            </div>
          )}
          {results.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {results.map((p) => <ResultCard key={p.id} page={p} />)}
            </div>
          )}
        </section>
      )}

      {/* How it works */}
      <section ref={howRef} className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 scroll-mt-24">
        <h2 className="font-display text-3xl font-extrabold text-slate-900 m-0">How It Works?</h2>
        <p className="text-sm text-slate-600 mt-1 mb-8">Just a few simple steps to find your perfect match</p>
        <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 list-none p-0 m-0">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative lg:pr-6 lg:[&:not(:last-child)]:border-r border-slate-200">
              <span className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4 ml-6">
                <span className="material-symbols-outlined text-[30px]">{s.icon}</span>
              </span>
              {i < STEPS.length - 1 && (
                <span className="hidden lg:block absolute top-6 right-8 material-symbols-outlined text-slate-400 text-[20px]" aria-hidden="true">
                  arrow_forward
                </span>
              )}
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 m-0 mb-1">{s.title}</h3>
                  <p className="text-xs text-slate-500 m-0">{s.body}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Goals + features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid lg:grid-cols-[1fr_1.5fr] gap-5">
        <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-sky-100 border border-blue-100 p-5 flex items-center gap-4">
          <GoalsIllustration />
          <div>
            <h2 className="font-display text-2xl font-extrabold text-slate-900 m-0 leading-tight">
              Your Goals <span className="block text-blue-600">Our Priority</span>
            </h2>
            <p className="text-xs text-slate-600 mt-2 mb-3">
              Trusted by students, parents and educational institutions across India.
            </p>
            <button
              type="button"
              onClick={() => howRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 bg-transparent border-none cursor-pointer p-0 hover:underline"
            >
              Learn More <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm grid grid-cols-2 lg:grid-cols-4 lg:divide-x divide-slate-200">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex flex-col items-center text-center px-4 py-6">
              <span className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[26px]">{f.icon}</span>
              </span>
              <h3 className="text-sm font-bold text-slate-900 m-0 mb-1">{f.title}</h3>
              <p className="text-xs text-slate-500 m-0">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col lg:flex-row lg:items-center gap-6">
          <Logo inverted />
          <nav className="flex flex-wrap items-center gap-x-1 gap-y-2 lg:mx-auto text-sm">
            {[
              { label: 'Home', onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
              ...QUICK_LINKS.map((q) => ({ label: q.title, onClick: q.onClick })),
            ].map((l, i) => (
              <span key={l.label} className="flex items-center gap-1">
                {i > 0 && <span className="text-white/30" aria-hidden="true">|</span>}
                <button
                  type="button"
                  onClick={l.onClick}
                  className="text-white/80 bg-transparent border-none cursor-pointer px-2 py-1 hover:text-white"
                >
                  {l.label}
                </button>
              </span>
            ))}
          </nav>
          {SOCIAL_LINKS.some((s) => s.href) && (
            <div>
              <p className="text-xs text-white/70 m-0 mb-2">Follow Us</p>
              <div className="flex gap-2">
                {SOCIAL_LINKS.filter((s) => s.href).map((s) => (
                  <a
                    key={s.name}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.name}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true"><path d={s.path} /></svg>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-6">
          <p className="text-xs text-white/60 m-0">© {new Date().getFullYear()} ConnectEDus.in. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
