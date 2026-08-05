import { useState } from 'react';
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useProtoAuth } from '../pages/prototype/useProtoAuth';

const NAV_ICONS = [
  { to: '/prototype/feed', icon: 'home', label: 'Home', end: true },
  { to: '/prototype/search', icon: 'travel_explore', label: 'Search' },
  { to: '/prototype/dashboard', icon: 'space_dashboard', label: 'Dashboard' },
];

export default function PrototypeLayout() {
  const { auth, role, name, logout } = useProtoAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!auth) return <Navigate to="/prototype" replace />;

  const doLogout = () => {
    logout();
    navigate('/prototype');
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-40 border-b border-outline-variant bg-surface-container-lowest">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-4">
          <NavLink to="/prototype/feed" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold">E</div>
            <span className="text-lg font-bold text-on-surface hidden sm:inline">EduNet</span>
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
                    Signed in as <strong className="text-on-surface">{name}</strong> · {role}
                  </p>
                  <NavLink
                    to="/prototype/profile"
                    onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm text-on-surface hover:bg-surface-container-low"
                  >
                    View Profile
                  </NavLink>
                  {role === 'professional' && (
                    <>
                      <NavLink
                        to="/prototype/page"
                        onClick={() => setMenuOpen(false)}
                        className="block px-3 py-2 rounded-lg text-sm text-on-surface hover:bg-surface-container-low"
                      >
                        My Institute Page
                      </NavLink>
                      <NavLink
                        to="/prototype/create-page"
                        onClick={() => setMenuOpen(false)}
                        className="block px-3 py-2 rounded-lg text-sm text-on-surface hover:bg-surface-container-low"
                      >
                        Create Institute Page
                      </NavLink>
                    </>
                  )}
                  <NavLink
                    to="/prototype/purchased"
                    onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm text-on-surface hover:bg-surface-container-low"
                  >
                    Purchased History
                  </NavLink>
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
