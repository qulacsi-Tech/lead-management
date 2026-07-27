import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/ui/Sidebar';
import TopBar from '../components/ui/TopBar';
import Footer from '../components/ui/Footer';
import Button from '../components/ui/Button';

const NAV = [
  { to: '/institute', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/institute/profile', label: 'My Profile', icon: 'account_circle' },
  { to: '/institute/buy-leads', label: 'Buy Leads', icon: 'shopping_cart' },
];

export default function InstituteLayout() {
  const { displayName, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar
        title="Institute Portal"
        subtitle="Admin Dashboard"
        navItems={NAV}
        bottomSlot={
          <>
            <Button variant="secondary" icon="support_agent" className="w-full mb-2">
              Get Support
            </Button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2 text-sm text-error rounded-lg hover:bg-error-container bg-transparent border-none cursor-pointer text-left"
            >
              <span className="material-symbols-outlined">logout</span>Log out
            </button>
          </>
        }
      />
      <TopBar
        searchPlaceholder="Search leads, candidates..."
        name={displayName || 'Institute'}
        roleLabel="Admin"
        initials={(displayName || 'IN').slice(0, 2).toUpperCase()}
        userKey={displayName}
      />
      <main className="ml-64 pt-16 min-h-screen flex flex-col">
        <Outlet />
        <Footer brand="Next Move" />
      </main>
    </div>
  );
}
