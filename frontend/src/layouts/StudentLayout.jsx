import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/ui/Sidebar';
import TopBar from '../components/ui/TopBar';
import Footer from '../components/ui/Footer';
import Button from '../components/ui/Button';

const NAV = [
  { to: '/student', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/student/profile', label: 'My Profile', icon: 'account_circle' },
  { to: '/student/roadmap', label: 'AI Career Roadmap', icon: 'alt_route' },
  { to: '/student/practice-tests', label: 'Practice Tests', icon: 'quiz' },
  { to: '/student/post-lead', label: 'Post Lead', icon: 'campaign' },
];

export default function StudentLayout() {
  const { displayName, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar
        title="Next Move"
        subtitle="Student Portal"
        navItems={NAV}
        bottomSlot={
          <>
            <Button variant="secondary" icon="auto_awesome" className="w-full mb-2">
              AI Study Plan
            </Button>
            <button className="flex items-center gap-3 px-4 py-2 text-sm text-on-surface-variant rounded-lg hover:bg-surface-container-high bg-transparent border-none cursor-pointer text-left">
              <span className="material-symbols-outlined">settings</span>Settings
            </button>
            <button className="flex items-center gap-3 px-4 py-2 text-sm text-on-surface-variant rounded-lg hover:bg-surface-container-high bg-transparent border-none cursor-pointer text-left">
              <span className="material-symbols-outlined">help</span>Support
            </button>
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
        searchPlaceholder="Search for mock tests, mentors, or topics..."
        name={displayName || 'Student'}
        roleLabel="Premium Student"
        initials={(displayName || 'S').slice(0, 2).toUpperCase()}
        userKey={displayName}
      />
      <main className="ml-64 pt-16 min-h-screen flex flex-col">
        <Outlet />
        <Footer />
      </main>
    </div>
  );
}
