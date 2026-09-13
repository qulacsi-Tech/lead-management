import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { InstituteProvider, useInstitute } from '../context/InstituteContext';
import TopBar from '../components/ui/TopBar';
import Footer from '../components/ui/Footer';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { pagePath } from '../utils/pageUrl';

// Grouped exactly along the ownership boundary: everything below is content the
// INSTITUTE owns. Platform-level settings deliberately have no entry here —
// they live in the Main Admin portal.
const NAV_GROUPS = [
  {
    label: 'My Institute',
    items: [
      { to: '/institute', label: 'Overview', icon: 'dashboard', end: true },
      { to: '/institute/profile', label: 'Profile & Branding', icon: 'storefront' },
    ],
  },
  {
    label: 'Academic',
    items: [{ to: '/institute/courses', label: 'Courses', icon: 'menu_book' }],
  },
  {
    label: 'Admissions',
    items: [{ to: '/institute/notices', label: 'Admission Notices', icon: 'campaign' }],
  },
  {
    label: 'Careers',
    items: [{ to: '/institute/jobs', label: 'Job Vacancies', icon: 'work' }],
  },
  {
    label: 'Leads',
    items: [{ to: '/institute/enquiries', label: 'Enquiries', icon: 'forum' }],
  },
];

/** The institute identity block — this is what stops an Institute Admin from
 * thinking they are administering the whole Connectedus platform. */
function InstituteSwitcher() {
  const { page, myPages, switchPage } = useInstitute();
  if (!page) return null;

  return (
    <div className="px-2 mb-6">
      <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1.5">
        Managing
      </p>
      <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-primary-container/40 border border-outline-variant">
        <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-xs font-bold text-primary shrink-0 overflow-hidden">
          {page.logoUrl ? (
            <img src={page.logoUrl} alt={page.name} className="w-full h-full object-cover" />
          ) : (
            page.logo
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-on-surface m-0 truncate">{page.name}</p>
          <p className="text-[10px] text-on-surface-variant m-0">Institute Admin</p>
        </div>
      </div>

      {myPages.length > 1 && (
        <select
          value={page.slug}
          onChange={(e) => switchPage(e.target.value)}
          className="mt-2 w-full bg-surface-container-low border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-on-surface cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {myPages.map((p) => (
            <option key={p.slug} value={p.slug}>{p.name}</option>
          ))}
        </select>
      )}
    </div>
  );
}

function InstituteSidebar() {
  const { page } = useInstitute();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <aside className="fixed h-full w-64 left-0 top-0 bg-surface border-r border-outline-variant shadow-sm flex flex-col py-2 px-3 z-50 box-border overflow-y-auto">
      <div className="mb-6 px-2 pt-2">
        <h1 className="font-display text-xl font-bold text-primary leading-tight m-0">
          Institute Console
        </h1>
        <p className="text-xs text-on-surface-variant m-0 mt-0.5">Connectedus</p>
      </div>

      <InstituteSwitcher />

      <nav className="flex-1 flex flex-col gap-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold px-4 mb-1.5">
              {group.label}
            </p>
            <div className="flex flex-col gap-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm no-underline transition-colors ${
                      isActive
                        ? 'bg-primary-container text-on-primary-container font-bold'
                        : 'text-on-surface-variant hover:bg-surface-container-high'
                    }`
                  }
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto border-t border-outline-variant pt-3 flex flex-col gap-1">
        {page && (
          <Link
            to={pagePath(page)}
            className="flex items-center gap-3 px-4 py-2 text-sm text-on-surface-variant rounded-lg hover:bg-surface-container-high no-underline transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">open_in_new</span>
            View public page
          </Link>
        )}
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
    </aside>
  );
}

/** Shown when a signed-in user reaches /institute without administering any
 * page — the Main Admin has simply not assigned them one yet. */
function NoInstituteAssigned() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-8">
      <Card className="p-8 max-w-lg text-center">
        <span className="material-symbols-outlined text-on-surface-variant/60 text-[44px]">
          domain_disabled
        </span>
        <h2 className="text-lg font-bold text-on-surface mt-2 mb-1">
          You don't administer an Institute Page yet
        </h2>
        <p className="text-sm text-on-surface-variant mb-5">
          Institute Pages are created by the Connectedus platform team, who then assign an Institute
          Admin. If you should have access to a page, ask them to add your email as an admin — or
          create your own page to get started.
        </p>
        <div className="flex gap-2 justify-center">
          <Link to="/create-page"><Button icon="add_business">Create Institute Page</Button></Link>
          <Link to="/feed"><Button variant="outline">Back to Feed</Button></Link>
        </div>
      </Card>
    </div>
  );
}

/** A Main Admin is not an Institute Admin.
 *
 * They can write to every page, so the old "you administer nothing" copy was
 * both wrong and unhelpful — and before this the console simply opened on
 * whichever institute sorted first, implying they ran it. Institutes are
 * managed from /admin/pages, so point there. */
function NotYourConsole() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-8">
      <Card className="p-8 max-w-lg text-center">
        <span className="material-symbols-outlined text-on-surface-variant/60 text-[44px]">
          shield_person
        </span>
        <h2 className="text-lg font-bold text-on-surface mt-2 mb-1">
          The Institute Console isn&apos;t yours to open
        </h2>
        <p className="text-sm text-on-surface-variant mb-5">
          You&apos;re signed in as a Platform Admin. This console belongs to the admins of one
          specific institute — you aren&apos;t on any institute&apos;s admin team, so there is
          nothing here to manage. Institutes are administered from Institute Pages in the Platform
          Admin portal.
        </p>
        <div className="flex gap-2 justify-center">
          <Link to="/admin/pages"><Button icon="shield_person">Go to Institute Pages</Button></Link>
          <Link to="/"><Button variant="outline">Back to Connectedus</Button></Link>
        </div>
      </Card>
    </div>
  );
}

function InstituteShell() {
  const { page, isInstituteAdmin, loading } = useInstitute();
  const { displayName, role } = useAuth();

  // Hold the frame while /pages/mine is in flight. Without this a real
  // institute admin sees "you don't administer an Institute Page" flash before
  // their own console renders, because the list starts empty.
  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-xs text-on-surface-variant m-0">Loading your institute…</p>
      </div>
    );
  }

  // Membership is the gate, not write access. A Main Admin passes every
  // authorization check in the app and still does not belong here.
  if (!isInstituteAdmin) {
    return role === 'admin' ? <NotYourConsole /> : <NoInstituteAssigned />;
  }

  return (
    <div className="min-h-screen bg-surface">
      <InstituteSidebar />
      <TopBar
        searchPlaceholder="Search courses, notices, vacancies, enquiries..."
        name={displayName || 'Institute Admin'}
        roleLabel={page ? `${page.name} · Admin` : 'Institute Admin'}
        initials={(displayName || 'IA').slice(0, 2).toUpperCase()}
        userKey={displayName || 'Institute'}
      />
      <main className="ml-64 pt-16 min-h-screen flex flex-col">
        <Outlet />
        <Footer brand="Connectedus Institute Console" />
      </main>
    </div>
  );
}

export default function InstituteAdminLayout() {
  return (
    <InstituteProvider>
      <InstituteShell />
    </InstituteProvider>
  );
}
