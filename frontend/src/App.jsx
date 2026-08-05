import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/ui/ErrorBoundary';

import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';

import StudentLayout from './layouts/StudentLayout';
import StudentDashboard from './pages/student/Dashboard';
import StudentCareerProfile from './pages/student/StudentCareerProfile';
import AICareerRoadmap from './pages/student/AICareerRoadmap';
import Enquiries from './pages/student/Enquiries';
import PracticeTests from './pages/student/PracticeTests';
import TakeTest from './pages/student/TakeTest';
import Leaderboard from './pages/student/Leaderboard';
import BrowseMentors from './pages/student/BrowseMentors';
import MentorDetail from './pages/student/MentorDetail';
import MyMentors from './pages/student/MyMentors';

import MentorLayout from './layouts/MentorLayout';
import MentorDashboard from './pages/mentor/Dashboard';
import MentorProfile from './pages/mentor/MentorProfile';
import MentorPracticeTests from './pages/mentor/MentorPracticeTests';
import PostOpportunity from './pages/mentor/PostOpportunity';
import OpportunityHistory from './pages/mentor/OpportunityHistory';
import ImpactAnalytics from './pages/mentor/ImpactAnalytics';

import InstituteLayout from './layouts/InstituteLayout';
import InstituteDashboard from './pages/institute/Dashboard';
import InstituteProfile from './pages/institute/InstituteProfile';
import BuyLeads from './pages/institute/BuyLeads';

import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import ManageInstitutes from './pages/admin/ManageInstitutes';
import ManageStudents from './pages/admin/ManageStudents';
import ManageMentors from './pages/admin/ManageMentors';
import ManageEnquiries from './pages/admin/ManageEnquiries';
import AdminSettings from './pages/admin/AdminSettings';

import PrototypeLayout from './layouts/PrototypeLayout';
import PrototypeLanding from './pages/prototype/Landing';
import PrototypeSignup from './pages/prototype/Signup';
import PrototypeFeed from './pages/prototype/Feed';
import CreateInstitutePage from './pages/prototype/CreateInstitutePage';
import InstitutePage from './pages/prototype/InstitutePage';
import PostAdmissionNotice from './pages/prototype/PostAdmissionNotice';
import PostJobVacancy from './pages/prototype/PostJobVacancy';
import ProfessionalProfile from './pages/prototype/ProfessionalProfile';
import ProfessionalDashboard from './pages/prototype/ProfessionalDashboard';
import SearchConnections from './pages/prototype/SearchConnections';
import PurchasedHistory from './pages/prototype/PurchasedHistory';

function RequireRole({ role, children }) {
  const { role: currentRole, initializing } = useAuth();
  if (initializing) return null;
  if (!currentRole) return <Navigate to="/login" replace />;
  if (currentRole !== role) return <Navigate to={`/${currentRole}`} replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route
        path="/student"
        element={
          <RequireRole role="student">
            <StudentLayout />
          </RequireRole>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="profile" element={<StudentCareerProfile />} />
        <Route path="roadmap" element={<AICareerRoadmap />} />
        <Route path="enquiries" element={<Enquiries />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="practice-tests" element={<PracticeTests />} />
        <Route path="practice-tests/:id" element={<TakeTest />} />
        <Route path="mentors" element={<BrowseMentors />} />
        <Route path="mentors/:id" element={<MentorDetail />} />
        <Route path="my-mentors" element={<MyMentors />} />
      </Route>

      <Route
        path="/mentor"
        element={
          <RequireRole role="mentor">
            <MentorLayout />
          </RequireRole>
        }
      >
        <Route index element={<MentorDashboard />} />
        <Route path="profile" element={<MentorProfile />} />
        <Route path="practice-tests" element={<MentorPracticeTests />} />
        <Route path="post-opportunity" element={<PostOpportunity />} />
        <Route path="history" element={<OpportunityHistory />} />
        <Route path="analytics" element={<ImpactAnalytics />} />
      </Route>

      <Route
        path="/institute"
        element={
          <RequireRole role="institute">
            <InstituteLayout />
          </RequireRole>
        }
      >
        <Route index element={<InstituteDashboard />} />
        <Route path="profile" element={<InstituteProfile />} />
        <Route path="buy-leads" element={<BuyLeads />} />
      </Route>

      <Route
        path="/admin"
        element={
          <RequireRole role="admin">
            <AdminLayout />
          </RequireRole>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="institutes" element={<ManageInstitutes />} />
        <Route path="students" element={<ManageStudents />} />
        <Route path="mentors" element={<ManageMentors />} />
        <Route path="enquiries" element={<ManageEnquiries />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route path="/prototype" element={<PrototypeLanding />} />
      <Route path="/prototype/signup" element={<PrototypeSignup />} />
      <Route path="/prototype" element={<PrototypeLayout />}>
        <Route path="feed" element={<PrototypeFeed />} />
        <Route path="create-page" element={<CreateInstitutePage />} />
        <Route path="page" element={<InstitutePage />} />
        <Route path="page/post-admission" element={<PostAdmissionNotice />} />
        <Route path="page/post-job" element={<PostJobVacancy />} />
        <Route path="profile" element={<ProfessionalProfile />} />
        <Route path="dashboard" element={<ProfessionalDashboard />} />
        <Route path="search" element={<SearchConnections />} />
        <Route path="purchased" element={<PurchasedHistory />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
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

