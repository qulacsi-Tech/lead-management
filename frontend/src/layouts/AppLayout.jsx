import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSession } from '../context/useSession';
import { useMyPages } from '../hooks/useMyPages';
import { isInstitutePath } from '../utils/pageUrl';
import { useLoginPrompt } from '../context/LoginPrompt';
import Logo from '../components/landing/Logo';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
} from '../Api/Api';

const NAV_ICONS = [
  { to: '/feed', icon: 'home', label: 'Home', end: true },
  { to: '/search', icon: 'travel_explore', label: 'Search' },
  { to: '/dashboard', icon: 'space_dashboard', label: 'Dashboard' },
];



// Notification `type` -> icon. Types come from NOTIFICATION_TYPES in
// backend/models/social.py; anything unrecognised falls back to a bell.
const NOTIFICATION_ICONS = {
  opportunity_match: 'work',
  page_opportunity: 'campaign',
  enquiry_received: 'contact_mail',
  profile_unlocked: 'lock_open',
  page_admin_assigned: 'shield_person',
  system: 'notifications',
};

function timeAgo(value) {
  if (!value) return '';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '';
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return 'Just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/**
 * Real notifications, from /api/notifications.
 *
 * This used to invent one every four seconds from a fixture pool — a bell that
 * always had something in it and never anything true. Rows are now written by
 * the services that cause them (an enquiry arriving, a page admin being
 * assigned) and read back by the recipient.
 */
function NotificationBell() {
  const { auth } = useSession();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const authId = auth?.id || auth?.email;

  const load = useCallback(async () => {
    if (!authId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      const [rows, count] = await Promise.all([
        fetchNotifications({ limit: 20 }),
        fetchUnreadCount(),
      ]);
      setNotifications(Array.isArray(rows) ? rows : []);
      setUnreadCount(count?.unread ?? count?.count ?? 0);
    } catch {
      // A failing bell must not break the header.
    }
  }, [authId]);

  // Initial load & WebSocket event subscription (No continuous polling!)
  useEffect(() => {
    if (!authId) {
      setNotifications([]);
      setUnreadCount(0);
      return undefined;
    }

    load();

    const userId = authId;
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.host.includes('localhost:5173')
      ? 'localhost:8000'
      : window.location.host;
    const wsUrl = `${wsProtocol}//${wsHost}/api/notifications/ws/${userId}`;

    let socket = null;
    try {
      socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'notification_update' || data.type === 'notification_new') {
            load();
          }
        } catch {
          // ignore non-json
        }
      };
    } catch (err) {
      console.warn('WebSocket notification error:', err);
    }

    return () => {
      if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        socket.close();
      }
    };
  }, [authId, load]);



  // Opening the panel is the read receipt, as before — but it now persists.
  const toggleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      try {
        await markAllNotificationsRead();
      } catch {
        load();
      }
    }
  };

  // Nothing to show a signed-out visitor: notifications are per account.
  if (!auth) return null;

  return (
    <div className="relative" onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onClick={toggleOpen}
        className="relative flex flex-col items-center px-3 py-1.5 rounded-xl text-[11px] font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 bg-transparent border-none cursor-pointer"
      >
        <span className="relative">
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-error text-white text-[9px] font-bold flex items-center justify-center leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </span>
        <span className="hidden sm:inline">Alerts</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-outline-variant">
            <p className="text-sm font-bold text-on-surface mb-0">Notifications</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-xs text-on-surface-variant text-center m-0">
                Nothing yet.
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-2.5 px-4 py-3 border-b border-outline-variant last:border-0 hover:bg-surface-container-low ${n.is_read ? '' : 'bg-primary-fixed/30'
                    }`}
                >
                  <span className="w-8 h-8 rounded-full bg-surface-container-high text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">
                      {NOTIFICATION_ICONS[n.type] || 'notifications'}
                    </span>
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-on-surface mb-0">{n.title}</p>
                    {n.message && (
                      <p className="text-[11px] text-on-surface-variant mb-0">{n.message}</p>
                    )}
                    <p className="text-[11px] text-on-surface-variant mb-0">{timeAgo(n.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AppLayout() {
  const { auth, initializing, name, logout } = useSession();
  // Surfaces the Institute Console only to users who actually administer a
  // page — a normal user never sees an institute-management entry point. Read
  // from /pages/mine (the page_admins table), not from a bundled array.
  const { isInstituteAdmin: instituteAdmin } = useMyPages();
  const isPlatformAdmin = auth?.role === 'admin';
  const navigate = useNavigate();
  const { openLogin } = useLoginPrompt();
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  // A public institute page is a landing page for outsiders, not a screen
  // inside the product. Client feedback, 01–02 Sep 2026: the app's navigation
  // "nahi dikhna chahiye varna bachee enquiry post nahi karte" — a parent or
  // student arriving from Google or a shared link reads our nav as "this is
  // somebody else's app, I need an account" and leaves without enquiring.
  //
  // The brand stays (it is what the page is published under, and it carries
  // the platform's SEO value) and so does Sign in / Join now for anonymous
  // visitors, since converting them is the point. What goes is the member
  // navigation, which competes with the enquiry CTA.
  //
  // See docs/CLIENT_FEEDBACK_2026-09-01.md, Section 5.
  const bareHeader = isInstitutePath(pathname);
  // The feed runs 20% wider than other screens so its three columns fill
  // more of a large monitor (client request, 26 Sep 2026); the header
  // matches so its edges line up with the columns below.
  const width = pathname === '/feed' ? 'max-w-[1384px]' : 'max-w-6xl';

  // Wait for the session-restore check (getMe() against the stored token) to
  // finish before deciding there is no session — otherwise every hard refresh
  // briefly renders the signed-out header before the async check resolves.
  if (initializing) return null;

  // No redirect for anonymous visitors. This layout wraps the public feed and
  // the institute pages as well as member screens, so the chrome adapts and
  // the individual private routes are guarded instead (see RequireSignedIn in
  // App.jsx). Redirecting here would make every public URL invisible to
  // logged-out visitors and to crawlers.

  const doLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Same brand, colours and shapes as the landing page (client request,
          26 Sep 2026: the feed "should match the vibe"). */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className={`${width} mx-auto px-4 sm:px-6 h-[72px] flex items-center gap-4`}>
          <Logo compact />

          <Link
            to="/search"
            className={`flex-1 max-w-md ${bareHeader ? 'hidden' : 'hidden md:flex'} items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-full pl-4 pr-1.5 py-1.5 no-underline hover:border-blue-400 transition-colors`}
          >
            <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
            <span className="text-sm text-slate-500 flex-1">Search people, pages, courses...</span>
            <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </span>
          </Link>

          {!auth ? (
            <nav className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => openLogin()}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-blue-700 bg-white border border-blue-600 cursor-pointer hover:bg-blue-50"
              >
                Login
              </button>
              <Link
                to="/signup"
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 no-underline shadow-sm"
              >
                Create Account
              </Link>
            </nav>
          ) : bareHeader ? null : (
            <nav className="flex items-center gap-1 ml-auto">
              {NAV_ICONS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `relative flex flex-col items-center px-3 py-1.5 rounded-xl text-[11px] font-semibold no-underline transition-all ${isActive
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50'
                    }`
                  }
                >
                  <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </NavLink>
              ))}

              <NotificationBell />

              <div className="relative ml-2">
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex flex-col items-center px-3 py-1.5 rounded-xl text-[11px] font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 bg-transparent border-none cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-[11px] font-bold text-white">
                    {(name || 'U')[0]}
                  </div>
                  <span className="hidden sm:inline">Me</span>
                </button>
                {menuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl p-2"
                    onMouseLeave={() => setMenuOpen(false)}
                  >
                    <p className="px-3 py-2 text-xs text-on-surface-variant">
                      Signed in as <strong className="text-on-surface">{name}</strong>
                    </p>
                    <NavLink
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="block px-3 py-2 rounded-lg text-sm text-on-surface hover:bg-surface-container-low"
                    >
                      View Profile
                    </NavLink>
                    {/* User-side entries only. A Main Admin creates institutes in
                      the Admin portal and has no marketplace credits of their
                      own, so neither belongs in their menu. */}
                    {!isPlatformAdmin && (
                      <>
                        {instituteAdmin ? (
                          <NavLink
                            to="/institute"
                            onClick={() => setMenuOpen(false)}
                            className="block px-3 py-2 rounded-lg text-sm text-on-surface hover:bg-surface-container-low"
                          >
                            Institute Console
                          </NavLink>
                        ) : (
                          <NavLink
                            to="/create-page"
                            onClick={() => setMenuOpen(false)}
                            className="block px-3 py-2 rounded-lg text-sm text-on-surface hover:bg-surface-container-low"
                          >
                            Create Institute Page
                          </NavLink>
                        )}
                        <NavLink
                          to="/purchased"
                          onClick={() => setMenuOpen(false)}
                          className="block px-3 py-2 rounded-lg text-sm text-on-surface hover:bg-surface-container-low"
                        >
                          Purchased History
                        </NavLink>
                      </>
                    )}
                    {/* A Main Admin browsing Connectedus as a normal user needs a
                      way back to the platform portal — otherwise "Back to
                      Connectedus" in the admin sidebar is a one-way door. */}
                    {isPlatformAdmin && (
                      <>
                        <div className="border-t border-outline-variant my-1" />
                        <NavLink
                          to="/admin"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-primary font-semibold hover:bg-surface-container-low"
                        >
                          <span className="material-symbols-outlined text-[18px]">shield_person</span>
                          Back to Admin Dashboard
                        </NavLink>
                      </>
                    )}
                    <div className="border-t border-outline-variant my-1" />
                    <button
                      type="button"
                      onClick={doLogout}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-error hover:bg-error-container cursor-pointer"
                    >
                      Switch role / Log out
                    </button>
                  </div>
                )}
              </div>
            </nav>
          )}
        </div>
      </header>

      <main className={`${width} mx-auto w-full px-4 sm:px-6 py-8`}>
        <Outlet />
      </main>
    </div>
  );
}
