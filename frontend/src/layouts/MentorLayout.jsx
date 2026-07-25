import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/ui/Sidebar';
import TopBar from '../components/ui/TopBar';
import Footer from '../components/ui/Footer';
import Button from '../components/ui/Button';

const NAV = [
  { to: '/mentor', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/mentor/profile', label: 'My Profile', icon: 'person' },
  { to: '/mentor/practice-tests', label: 'Practice Tests', icon: 'assignment' },
  { to: '/mentor/post-opportunity', label: 'Post Opportunity', icon: 'post_add' },
];

export default function MentorLayout() {
  const { displayName, logout, switchRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSwitchToStudent = () => {
    switchRole('student');
    navigate('/student');
  };

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar
        title="Nexus Intellect"
        subtitle="Mentor Dashboard"
        navItems={NAV}
        bottomSlot={
          <>
            <Button variant="soft" icon="help_center" className="w-full mb-2">
              Help Center
            </Button>
            <button
              onClick={handleSwitchToStudent}
              className="flex items-center gap-3 px-4 py-2 text-xs font-semibold text-primary rounded-lg hover:bg-surface-container-high bg-transparent border-none cursor-pointer text-left"
            >
              <span className="material-symbols-outlined">swap_horiz</span>Switch to Student View
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
        searchPlaceholder="Search analytics, papers, or profiles..."
        name={displayName || 'Mentor'}
        roleLabel="Senior Mentor"
        initials={(displayName || 'M').slice(0, 2).toUpperCase()}
        userKey={displayName}
      />
      <main className="ml-64 pt-16 min-h-screen flex flex-col">
        <Outlet />
        <Footer brand="Nexus Intellect" />
      </main>
    </div>
  );
}
