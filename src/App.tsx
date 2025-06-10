/**
 * src/App.tsx
 * 
 * Main application component that sets up routing for the entire application.
 * Updated to implement a role-first authentication flow:
 * 1. User selects their role (coach or athlete)
 * 2. User chooses to login or register
 * 3. System handles role-specific flows (e.g., invitation code for athletes)
 * 4. User is redirected to the appropriate dashboard based on their role
 */

import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ThemeProvider } from './components/ThemeProvider';
import { ModalProvider, ProfileProvider } from './contexts';
import { I18nProvider } from './lib/i18n/context';

// Lazy load pages for better performance
import { lazy, Suspense } from 'react';

// Auth components
import AuthCallback from './components/auth/AuthCallback';
import InviteCodeEntry from './components/auth/InviteCodeEntry';
import LoginSuccess from './components/auth/LoginSuccess';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Register from './components/Register';
import RoleSelection from './components/RoleSelection';
import { EmailConfirmation } from './pages/auth/EmailConfirmation';

// Coach pages
const CoachDashboard = lazy(() => import('./pages/coach/Dashboard').then(module => ({ default: module.CoachDashboard })));
const ProgramDashboard = lazy(() => import('./pages/coach/ProgramDashboard').then(module => ({ default: module.ProgramDashboard })));
const Workouts = lazy(() => import('./pages/coach/Workouts').then(module => ({ default: module.Workouts })));
const Athletes = lazy(() => import('./pages/coach/Athletes').then(module => ({ default: module.Athletes })));
const CoachAthleteProfile = lazy(() => import('./pages/coach/AthleteProfile').then(module => ({ default: module.AthleteProfile })));
const AthleteCalendar = lazy(() => import('./pages/coach/AthleteCalendar').then(module => ({ default: module.AthleteCalendar })));
const ProgramCalendar = lazy(() => import('./pages/coach/ProgramCalendar').then(module => ({ default: module.ProgramCalendar })));
const ProgramAssignment = lazy(() => import('./pages/coach/ProgramAssignment').then(module => ({ default: module.ProgramAssignment })));
const CoachAccount = lazy(() => import('./pages/coach/Account').then(module => ({ default: module.CoachAccount })));

// Athlete pages
const AthleteDashboard = lazy(() => import('./pages/athlete/Dashboard').then(module => ({ default: module.AthleteDashboard })));
const AthleteAccount = lazy(() => import('./pages/athlete/Account').then(module => ({ default: module.AthleteAccount })));

// Demo pages
const DemoCoachDashboard = lazy(() => import('./pages/demo/Dashboard').then(module => ({ default: module.DemoCoachDashboard })));

// Simple loading screen component
const LoadingScreen = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
      <p className="text-gray-600 dark:text-gray-400 text-sm">Loading...</p>
    </div>
  </div>
);

// Redirect component that preserves URL parameters
const RedirectWithParams = ({ to }: { to: string }) => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  // If there's a 'code' parameter, redirect to register with the code
  if (searchParams.has('code')) {
    return <Navigate to={`/register/athlete?code=${searchParams.get('code')}`} replace />;
  }
  
  // Otherwise, just redirect to the target path
  return <Navigate to={to} replace />;
};

// Coach routes component with ModalProvider for coach pages
const CoachRoutes = () => (
  <ModalProvider>
    <Routes>
      <Route path="/" element={<CoachDashboard />} />
      <Route path="/programs" element={<ProgramDashboard />} />
      <Route path="/workouts" element={<Workouts />} />
      <Route path="/athletes" element={<Athletes />} />
      <Route path="/athlete/:athleteId" element={<CoachAthleteProfile />} />
      <Route path="/athlete/:athleteId/calendar" element={<AthleteCalendar />} />
      <Route path="/program/:programId" element={<ProgramCalendar />} />
      <Route path="/program/:programId/assign" element={<ProgramAssignment />} />
      <Route path="/account" element={<CoachAccount />} />
    </Routes>
  </ModalProvider>
);

// Athlete routes component with ModalProvider for athlete pages
const AthleteRoutes = () => (
  <ModalProvider>
    <Routes>
      <Route path="/" element={<AthleteDashboard />} />
      <Route path="/account" element={<AthleteAccount />} />
    </Routes>
  </ModalProvider>
);

// Simple demo routes for now
const DemoRoutes = () => (
  <Routes>
    <Route path="/" element={<DemoCoachDashboard />} />
  </Routes>
);

function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <ProfileProvider>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              
              {/* New role-first authentication flow */}
              <Route path="/auth" element={<RoleSelection />} />
              <Route path="/login/:role" element={<Login />} />
              <Route path="/register/:role" element={<Register />} />
              
              {/* Legacy routes for backward compatibility */}
              <Route path="/login" element={<Navigate to="/auth" replace />} />
              <Route path="/register" element={<Register />} />
              
              {/* Legacy route redirects */}
              <Route path="/athlete-signin" element={<RedirectWithParams to="/auth" />} />
              <Route path="/athlete-signin/:coachName" element={<RedirectWithParams to="/auth" />} />
              <Route path="/coach-signin" element={<Navigate to="/auth" replace />} />
              
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/auth/confirm" element={<EmailConfirmation />} />
              <Route path="/login/success" element={<LoginSuccess />} />
              
              {/* Protected route for invite code entry */}
              <Route 
                path="/invite-code-entry" 
                element={
                  <ProtectedRoute role="athlete">
                    <InviteCodeEntry />
                  </ProtectedRoute>
                } 
              />
              
              {/* Demo Routes with Sample Data */}
              <Route 
                path="/demo/*" 
                element={
                  <Layout>
                    <DemoRoutes />
                  </Layout>
                } 
              />
              
              {/* Protected Coach Routes */}
              <Route 
                path="/coach/*" 
                element={
                  <ProtectedRoute role="coach">
                    <Layout>
                      <CoachRoutes />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              {/* Protected Athlete Routes */}
              <Route 
                path="/athlete/*" 
                element={
                  <ProtectedRoute role="athlete">
                    <Layout>
                      <AthleteRoutes />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ProfileProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

export default App;