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
import PostAdmissionNotice from './pages/PostAdmissionNotice';
import PostJobVacancy from './pages/PostJobVacancy';
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
import AdminSettings from './pages/admin/AdminSettings';

function RequireAdmin({ children }) {
  const { role, initializing } = useAuth();
  if (initializing) return null;
  if (!role) return <Navigate to="/" replace />;
  if (role !== 'admin') return <Navigate to="/feed" replace />;
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
        <Route path="page/edit" element={<InstitutePageEditor />} />
        <Route path="page/post-admission" element={<PostAdmissionNotice />} />
        <Route path="page/post-job" element={<PostJobVacancy />} />
        <Route path="profile" element={<ProfessionalProfile />} />
        <Route path="dashboard" element={<ProfessionalDashboard />} />
        <Route path="search" element={<SearchConnections />} />
        <Route path="purchased" element={<PurchasedHistory />} />
      </Route>

      {/* Admin uses the same unified login above — no separate admin login page. */}
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="institutes" element={<ManageInstitutes />} />
        <Route path="students" element={<ManageStudents />} />
        <Route path="mentors" element={<ManageMentors />} />
        <Route path="enquiries" element={<ManageEnquiries />} />
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
