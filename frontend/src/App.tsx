import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ApplicationsListPage from './pages/ApplicationsListPage';
import ApplicationDetailPage from './pages/ApplicationDetailPage';
import NewApplicationPage from './pages/NewApplicationPage';
import OfficerReviewPage from './pages/OfficerReviewPage';
import NotificationsPage from './pages/NotificationsPage';
import ReportsPage from './pages/ReportsPage';
import AuditTrailPage from './pages/AuditTrailPage';
import ValidationPage from './pages/ValidationPage';
import HelpPage from './pages/HelpPage';
import PublicVerifyPage from './pages/PublicVerifyPage';

function ProtectedRoute({ children, officerOnly = false }: { children: React.ReactNode; officerOnly?: boolean }) {
  const { user, isLoading, isOfficer } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gov-blue/20 border-t-gov-blue rounded-full animate-spin" />
          <p className="text-sm font-medium text-text-secondary">Loading AICTE Portal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (officerOnly && !isOfficer) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public login & verify routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify/:applicationNo" element={<PublicVerifyPage />} />

          {/* Authenticated routes wrapped in AppLayout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="applications" element={<ApplicationsListPage />} />
            <Route path="applications/new" element={<NewApplicationPage />} />
            <Route path="applications/:id" element={<ApplicationDetailPage />} />
            <Route path="validation" element={<ValidationPage />} />
            <Route
              path="officer/review"
              element={
                <ProtectedRoute officerOnly>
                  <OfficerReviewPage />
                </ProtectedRoute>
              }
            />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route
              path="reports"
              element={
                <ProtectedRoute officerOnly>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            <Route path="audit" element={<AuditTrailPage />} />
            <Route path="help" element={<HelpPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
