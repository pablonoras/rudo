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

// Auth components
import AuthCallback from './components/auth/AuthCallback';
import InviteCodeEntry from './components/auth/InviteCodeEntry';
import LoginSuccess from './components/auth/LoginSuccess';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Register from './components/Register';
import RoleSelection from './components/RoleSelection';

// Coach pages
import { CoachAccount } from './pages/coach/Account';
import { AthleteCalendar } from './pages/coach/AthleteCalendar';
import { AthleteProfile } from './pages/coach/AthleteProfile';
import { Athletes } from './pages/coach/Athletes';
import { CoachDashboard } from './pages/coach/Dashboard';
import { ProgramAssignment } from './pages/coach/ProgramAssignment';
import ProgramCalendar from './pages/coach/ProgramCalendar';
import { ProgramDashboard } from './pages/coach/ProgramDashboard';
import { Workouts } from './pages/coach/Workouts';

// Athlete pages
import { AthleteAccount } from './pages/athlete/Account';
import { AthleteDashboard } from './pages/athlete/Dashboard';

// Demo components
import DemoInitializer from './components/DemoInitializer';
import { DemoLayout } from './components/DemoLayout';
import { DemoCoachDashboard } from './pages/demo/Dashboard';

// Debug components
import InviteCodeDebug from './components/debug/InviteCodeDebug';

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
      <Route path="/athlete/:athleteId" element={<AthleteProfile />} />
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

// Demo routes component with ModalProvider for demo pages
const DemoRoutes = () => (
  <ModalProvider>
    <Routes>
      <Route path="/" element={<DemoCoachDashboard />} />
      <Route path="/programs" element={<ProgramDashboard />} />
      <Route path="/athletes" element={<Athletes />} />
      <Route path="/athlete/:athleteId" element={<AthleteProfile />} />
      <Route path="/program/:programId" element={<ProgramCalendar />} />
      <Route path="/program/:programId/assign" element={<ProgramAssignment />} />
    </Routes>
  </ModalProvider>
);

function App() {
  return (
    <ThemeProvider>
      <ProfileProvider>
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
          <Route path="/login/success" element={<LoginSuccess />} />
          
          {/* Debug routes - only available in development */}
          {import.meta.env.DEV && (
            <Route path="/debug/invite-codes" element={<InviteCodeDebug />} />
          )}
          
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
              <DemoInitializer>
                <DemoLayout>
                  <DemoRoutes />
                </DemoLayout>
              </DemoInitializer>
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
      </ProfileProvider>
    </ThemeProvider>
  );
}

export default App;