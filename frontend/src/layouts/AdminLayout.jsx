import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/ui/Sidebar';
import TopBar from '../components/ui/TopBar';
import Footer from '../components/ui/Footer';

// Grouped along the ownership boundary. Everything here is PLATFORM-OWNED:
// the Main Admin establishes institutes and platform-wide configuration, then
// hands day-to-day content to each Institute Admin in the Institute Console.
// See docs/CONNECTEDUS_INTEGRATION_AUDIT_2026-08-20.md §Ownership.
const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [{ to: '/admin', label: 'Dashboard', icon: 'dashboard', end: true }],
  },
  {
    label: 'Platform',
    items: [
      { to: '/admin/pages', label: 'Institute Pages', icon: 'storefront' },
      { to: '/admin/taxonomy', label: 'Types & Categories', icon: 'category' },
      { to: '/admin/settings', label: 'Platform Settings', icon: 'settings' },
    ],
  },
  {
    label: 'Accounts',
    items: [
      { to: '/admin/students', label: 'Students', icon: 'school' },
      { to: '/admin/mentors', label: 'Mentors', icon: 'person' },
    ],
  },
  {
    label: 'Oversight',
    items: [{ to: '/admin/enquiries', label: 'All Enquiries', icon: 'campaign' }],
  },
];

export default function AdminLayout() {
  const { displayName, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar
        title="Platform Admin"
        subtitle="Connectedus"
        navGroups={NAV_GROUPS}
        headerSlot={
          <div className="px-2 mb-6">
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-tertiary-fixed/40 border border-outline-variant">
              <span className="material-symbols-outlined text-tertiary text-[20px]">shield_person</span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-on-surface m-0">Whole platform</p>
                <p className="text-[10px] text-on-surface-variant m-0">Main Admin access</p>
              </div>
            </div>
          </div>
        }
        bottomSlot={
          <div className="flex flex-col gap-1">
            <Link
              to="/feed"
              className="flex items-center gap-3 px-4 py-2 text-sm text-on-surface-variant rounded-lg hover:bg-surface-container-high no-underline transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">switch_account</span>
              Back to Connectedus
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2 text-sm text-error rounded-lg hover:bg-error-container bg-transparent border-none cursor-pointer text-left transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>Log out
            </button>
          </div>
        }
      />
      <TopBar
        searchPlaceholder="Search institutes, students, mentors, logs..."
        name={displayName || 'System Admin'}
        roleLabel="Super Admin"
        initials={(displayName || 'AD').slice(0, 2).toUpperCase()}
        userKey={displayName || 'Admin'}
      />
      <main className="ml-64 pt-16 min-h-screen flex flex-col">
        <Outlet />
        <Footer brand="Connectedus Admin Portal" />
      </main>
    </div>
  );
}
