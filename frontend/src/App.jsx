import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useMyPages } from './hooks/useMyPages';
import { LoginPromptProvider, useLoginPrompt } from './context/LoginPrompt';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/ui/ErrorBoundary';

import Login from './pages/Login';
import Signup from './pages/Signup';

import AppLayout from './layouts/AppLayout';
import Feed from './pages/Feed';
import CreateInstitutePage from './pages/CreateInstitutePage';
import InstitutePage from './pages/InstitutePage';
import LegacySlugRedirect from './pages/LegacySlugRedirect';
import InstitutePageEditor from './pages/InstitutePageEditor';
import ProfessionalProfile from './pages/ProfessionalProfile';
import ProfessionalDashboard from './pages/ProfessionalDashboard';
import SearchConnections from './pages/SearchConnections';
import PurchasedHistory from './pages/PurchasedHistory';

import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import ManageStudents from './pages/admin/ManageStudents';
import ManageMentors from './pages/admin/ManageMentors';
import ManageEnquiries from './pages/admin/ManageEnquiries';
import ManagePages from './pages/admin/ManagePages';
import InstituteDetails from './pages/admin/InstituteDetails';
import PlatformTaxonomy from './pages/admin/PlatformTaxonomy';
import AdminSettings from './pages/admin/AdminSettings';

import InstituteAdminLayout from './layouts/InstituteAdminLayout';
import InstituteDashboard from './pages/institute/InstituteDashboard';
import ManageCourses from './pages/institute/ManageCourses';
import ManageOpportunities from './pages/institute/ManageOpportunities';
import InstituteEnquiries from './pages/institute/InstituteEnquiries';
import InstituteApplications from './pages/institute/InstituteApplications';

/** Platform-level gate: only the Main/Platform Admin reaches /admin. */
function RequireAdmin({ children }) {
  const { role, initializing } = useAuth();
  if (initializing) return null;
  if (!role) return <Navigate to="/" replace />;
  if (role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

/** Gate for member-only screens.
 *
 * Sends an anonymous visitor to the public feed and opens the sign-in dialog
 * over it, rather than to a dead-end login page — the feed is public now, so
 * there is always something to land on. */
function RequireSignedIn({ children }) {
  const { role, initializing } = useAuth();
  const { openLogin } = useLoginPrompt();

  useEffect(() => {
    if (!initializing && !role) openLogin('Sign in to continue.');
  }, [initializing, role, openLogin]);

  if (initializing) return null;
  if (!role) return <Navigate to="/" replace />;
  return children;
}

/** `/page` used to render "my" institute page by matching the signed-in
 *  user's email against a bundled array. It now just forwards: to the page
 *  they administer, or to the create flow if they have none. Keeping
 *  InstitutePage slug-only is what lets it be public and cacheable. */
function MyPageRedirect() {
  const { pages, loading } = useMyPages();
  if (loading) return null;
  if (pages.length > 0) return <Navigate to={`/${pages[0].slug}`} replace />;
  return <Navigate to="/create-page" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Common feed + profile experience — Professional and Student roles
          both live here (see docs/EDUCATION_NETWORK_ROADMAP.md). */}
      {/* `/login` stays a real page for deep links and bookmarks; day to day
          the same form opens as a dialog over whatever you were reading. */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route path="/" element={<AppLayout />}>
        {/* PUBLIC. The feed is the front door: an anonymous visitor lands here
            rather than on a login wall, and signs in from the header when they
            want to act. /feed keeps older links working. */}
        <Route index element={<Feed />} />
        <Route path="feed" element={<Navigate to="/" replace />} />

        {/* Member-only from here down. */}
        <Route path="create-page" element={<RequireSignedIn><CreateInstitutePage /></RequireSignedIn>} />
        <Route path="page" element={<RequireSignedIn><MyPageRedirect /></RequireSignedIn>} />
        {/* Institute content management moved into the Institute Console, so
            ownership of each screen is unambiguous. These keep old links and
            bookmarks working. */}
        <Route path="page/edit" element={<Navigate to="/institute/profile" replace />} />
        <Route path="page/post-admission" element={<Navigate to="/institute/notices" replace />} />
        <Route path="page/post-job" element={<Navigate to="/institute/jobs" replace />} />
        <Route path="profile" element={<RequireSignedIn><ProfessionalProfile /></RequireSignedIn>} />
        <Route path="dashboard" element={<RequireSignedIn><ProfessionalDashboard /></RequireSignedIn>} />
        <Route path="search" element={<RequireSignedIn><SearchConnections /></RequireSignedIn>} />
        <Route path="purchased" element={<RequireSignedIn><PurchasedHistory /></RequireSignedIn>} />

        {/* PUBLIC. Per-institute URL — connectedus.in/college/sait/indore.
            Namespacing institutes under their type means they can no longer
            collide with an app route, which the old single-segment scheme
            risked on every route added. See docs/CLIENT_FEEDBACK_2026-09-01.md §9.

            The two-segment form is the fallback for a page with no city; both
            are last in this block because react-router ranks literal segments
            above dynamic ones, so every route above still wins. */}
        <Route path=":typeSegment/:instituteSlug/:citySegment" element={<InstitutePage />} />
        <Route path=":typeSegment/:instituteSlug" element={<InstitutePage />} />

        {/* Links shared before the format changed. Resolves the old slug and
            replaces the history entry with the canonical URL. */}
        <Route path=":instituteSlug" element={<LegacySlugRedirect />} />
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
        {/* People who clicked Apply on a notice or vacancy. Separate from
            enquiries — see pages/institute/InstituteApplications.jsx. */}
        <Route path="applications" element={<InstituteApplications />} />
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
        {/* Institute accounts used to live at /admin/institutes as a second,
            parallel screen. Merged into Institute Pages, which is now the one
            place an institute is created — see
            docs/CLIENT_FEEDBACK_2026-09-01.md. Old links land on the list. */}
        <Route path="pages/:pageId" element={<InstituteDetails />} />
        <Route path="institutes" element={<Navigate to="/admin/pages" replace />} />
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
              <LoginPromptProvider>
                <AppRoutes />
              </LoginPromptProvider>
            </BrowserRouter>
          </ToastProvider>
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
