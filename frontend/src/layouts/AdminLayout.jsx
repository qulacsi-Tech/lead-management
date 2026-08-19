import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/ui/Sidebar';
import TopBar from '../components/ui/TopBar';
import Footer from '../components/ui/Footer';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/admin/pages', label: 'Institute Pages', icon: 'storefront' },
  { to: '/admin/institutes', label: 'Institutes', icon: 'account_balance' },
  { to: '/admin/students', label: 'Students', icon: 'school' },
  { to: '/admin/mentors', label: 'Mentors', icon: 'person' },
  { to: '/admin/enquiries', label: 'Enquiries', icon: 'campaign' },
  { to: '/admin/settings', label: 'System Settings', icon: 'settings' },
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
        title="Admin Portal"
        subtitle="Connectedus Executive Suite"
        navItems={NAV}
        bottomSlot={
          <div className="flex flex-col gap-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2 text-sm text-error rounded-lg hover:bg-error-container bg-transparent border-none cursor-pointer text-left transition-colors"
            >
              <span className="material-symbols-outlined">logout</span>Log out
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
