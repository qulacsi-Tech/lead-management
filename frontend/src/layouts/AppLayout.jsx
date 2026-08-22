import { useEffect, useRef, useState } from 'react';
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useSession } from '../context/useSession';
import { useMyPages } from '../hooks/useMyPages';
import { mockNotifications, notificationPool } from '../pages/mockData';
import { useDesiredCriteria } from '../pages/useDesiredCriteria';

const NAV_ICONS = [
  { to: '/feed', icon: 'home', label: 'Home', end: true },
  { to: '/search', icon: 'travel_explore', label: 'Search' },
  { to: '/dashboard', icon: 'space_dashboard', label: 'Dashboard' },
];

const NEW_NOTIFICATION_SECONDS = 4;
let notifIdCounter = 100;

function NotificationBell() {
  const [notifications, setNotifications] = useState(
    mockNotifications.map((n, i) => ({ ...n, id: i, read: false }))
  );
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const poolIndex = useRef(0);
  const toastTimer = useRef(null);
  const { desiredJob } = useDesiredCriteria();

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const tick = setInterval(() => {
      // Every 4th notification is a real match against the user's saved
      // desired criteria (matrimony-style "your saved search matched a new
      // lead"), instead of a random pool item — see
      // docs/CLIENT_FEEDBACK_2026-08-16.md, Section 4.
      const isMatch = poolIndex.current > 0 && poolIndex.current % 4 === 0;
      const template = isMatch
        ? {
            icon: 'work',
            title: `New Job Vacancy matches your saved search: ${desiredJob.role} in ${desiredJob.preferredLocation}`,
          }
        : notificationPool[poolIndex.current % notificationPool.length];
      poolIndex.current += 1;
      notifIdCounter += 1;
      const fresh = { ...template, id: notifIdCounter, time: 'Just now', read: false };

      setNotifications((prev) => [fresh, ...prev].slice(0, 12));
      setToast(fresh);

      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 5000);
    }, NEW_NOTIFICATION_SECONDS * 1000);

    return () => {
      clearInterval(tick);
      clearTimeout(toastTimer.current);
    };
  }, [desiredJob]);

  const toggleOpen = () => {
    setOpen((o) => {
      const next = !o;
      if (next) setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      return next;
    });
  };

  return (
    <div className="relative" onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onClick={toggleOpen}
        className="relative flex flex-col items-center px-3 py-1.5 rounded-lg text-[11px] font-semibold text-on-surface-variant hover:bg-surface-container-low cursor-pointer"
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

      {/* Transient live-notification toast — auto-collapses after 2s */}
      {toast && !open && (
        <div className="absolute right-0 mt-2 w-72 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg p-3 flex items-start gap-2.5 animate-pulse">
          <span className="w-8 h-8 rounded-full bg-error-container text-error flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px]">{toast.icon}</span>
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-on-surface mb-0">{toast.title}</p>
            <p className="text-[11px] text-on-surface-variant mb-0">Just now</p>
          </div>
        </div>
      )}

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-outline-variant">
            <p className="text-sm font-bold text-on-surface mb-0">Notifications</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((n) => (
              <div key={n.id} className="flex items-start gap-2.5 px-4 py-3 border-b border-outline-variant last:border-0 hover:bg-surface-container-low">
                <span className="w-8 h-8 rounded-full bg-surface-container-high text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">{n.icon}</span>
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-on-surface mb-0">{n.title}</p>
                  <p className="text-[11px] text-on-surface-variant mb-0">{n.time}</p>
                </div>
              </div>
            ))}
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
  const [menuOpen, setMenuOpen] = useState(false);

  // Wait for the session-restore check (getMe() against the stored token)
  // to finish before deciding there's no session — otherwise every hard
  // refresh briefly sees auth=null and bounces straight to login before the
  // async check even resolves.
  if (initializing) return null;
  if (!auth) return <Navigate to="/" replace />;

  const doLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-40 border-b border-outline-variant bg-surface-container-lowest">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-4">
          <NavLink to="/feed" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold">E</div>
            <span className="text-lg font-bold text-on-surface hidden sm:inline">Connectedus</span>
          </NavLink>

          <div className="flex-1 max-w-sm hidden md:flex items-center gap-2 bg-surface-container-low border border-outline-variant rounded-full px-4 py-2">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
            <span className="text-sm text-on-surface-variant">Search people, pages, courses...</span>
          </div>

          <nav className="flex items-center gap-1 ml-auto">
            {NAV_ICONS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex flex-col items-center px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                    isActive ? 'text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'
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
                className="flex flex-col items-center px-3 py-1.5 rounded-lg text-[11px] font-semibold text-on-surface-variant hover:bg-surface-container-low cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-[11px] font-bold text-primary">
                  {(name || 'U')[0]}
                </div>
                <span className="hidden sm:inline">Me</span>
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg p-2"
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
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
