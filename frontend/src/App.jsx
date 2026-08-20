import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/ui/ErrorBoundary';

import Login from './pages/Login';
import Signup from './pages/Signup';

import AppLayout from './layouts/AppLayout';
import Feed from './pages/Feed';
import CreateInstitutePage from './pages/CreateInstitutePage';
import InstitutePage from './pages/InstitutePage';
import InstitutePageEditor from './pages/InstitutePageEditor';
import ProfessionalProfile from './pages/ProfessionalProfile';
import ProfessionalDashboard from './pages/ProfessionalDashboard';
import SearchConnections from './pages/SearchConnections';
import PurchasedHistory from './pages/PurchasedHistory';

import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import ManageInstitutes from './pages/admin/ManageInstitutes';
import ManageStudents from './pages/admin/ManageStudents';
import ManageMentors from './pages/admin/ManageMentors';
import ManageEnquiries from './pages/admin/ManageEnquiries';
import ManagePages from './pages/admin/ManagePages';
import PlatformTaxonomy from './pages/admin/PlatformTaxonomy';
import AdminSettings from './pages/admin/AdminSettings';

import InstituteAdminLayout from './layouts/InstituteAdminLayout';
import InstituteDashboard from './pages/institute/InstituteDashboard';
import ManageCourses from './pages/institute/ManageCourses';
import ManageOpportunities from './pages/institute/ManageOpportunities';
import InstituteEnquiries from './pages/institute/InstituteEnquiries';

/** Platform-level gate: only the Main/Platform Admin reaches /admin. */
function RequireAdmin({ children }) {
  const { role, initializing } = useAuth();
  if (initializing) return null;
  if (!role) return <Navigate to="/" replace />;
  if (role !== 'admin') return <Navigate to="/feed" replace />;
  return children;
}

/** Any signed-in user may reach /institute; the layout itself decides whether
 * they administer a page and shows the "not assigned" state if they don't.
 * Real per-page authorization arrives with the backend in Phase 2. */
function RequireSignedIn({ children }) {
  const { role, initializing } = useAuth();
  if (initializing) return null;
  if (!role) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Common feed + profile experience — Professional and Student roles
          both live here (see docs/EDUCATION_NETWORK_ROADMAP.md). */}
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route path="/" element={<AppLayout />}>
        <Route path="feed" element={<Feed />} />
        <Route path="create-page" element={<CreateInstitutePage />} />
        <Route path="page" element={<InstitutePage />} />
        {/* Institute content management moved into the Institute Console, so
            ownership of each screen is unambiguous. These keep old links and
            bookmarks working. */}
        <Route path="page/edit" element={<Navigate to="/institute/profile" replace />} />
        <Route path="page/post-admission" element={<Navigate to="/institute/notices" replace />} />
        <Route path="page/post-job" element={<Navigate to="/institute/jobs" replace />} />
        <Route path="profile" element={<ProfessionalProfile />} />
        <Route path="dashboard" element={<ProfessionalDashboard />} />
        <Route path="search" element={<SearchConnections />} />
        <Route path="purchased" element={<PurchasedHistory />} />
        {/* Public, per-institute vanity URL — connectedus.in/<slug>. Static
            paths above (feed, profile, search, ...) always win over this,
            since react-router ranks literal segments above dynamic ones. */}
        <Route path=":instituteSlug" element={<InstitutePage />} />
      </Route>

      {/* INSTITUTE-OWNED: operational content for the page(s) a user administers.
          Separate from /admin so an Institute Admin never appears to be
          managing the whole platform. */}
      <Route
        path="/institute"
        element={
          <RequireSignedIn>
            <InstituteAdminLayout />
          </RequireSignedIn>
        }
      >
        <Route index element={<InstituteDashboard />} />
        <Route path="profile" element={<InstitutePageEditor />} />
        <Route path="courses" element={<ManageCourses />} />
        <Route path="notices" element={<ManageOpportunities type="admission" />} />
        <Route path="jobs" element={<ManageOpportunities type="job" />} />
        <Route path="enquiries" element={<InstituteEnquiries />} />
      </Route>

      {/* PLATFORM-OWNED: Main Admin. Uses the same unified login above — no
          separate admin login page. */}
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="pages" element={<ManagePages />} />
        <Route path="institutes" element={<ManageInstitutes />} />
        <Route path="students" element={<ManageStudents />} />
        <Route path="mentors" element={<ManageMentors />} />
        <Route path="enquiries" element={<ManageEnquiries />} />
        <Route path="taxonomy" element={<PlatformTaxonomy />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <ToastProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </ToastProvider>
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
