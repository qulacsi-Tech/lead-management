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
import PostLead from './pages/student/PostLead';
import PracticeTests from './pages/student/PracticeTests';
import TakeTest from './pages/student/TakeTest';
import Leaderboard from './pages/student/Leaderboard';

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

function RequireRole({ role, children }) {
  const { role: currentRole } = useAuth();
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
        <Route path="post-lead" element={<PostLead />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="practice-tests" element={<PracticeTests />} />
        <Route path="practice-tests/:id" element={<TakeTest />} />
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
