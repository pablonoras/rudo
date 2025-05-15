/**
 * src/App.tsx
 * 
 * Main application component that sets up routing for the entire application.
 * Updated to implement a role-agnostic authentication flow:
 * 1. User signs in through a common login page
 * 2. System determines their role from their profile
 * 3. User is redirected to the appropriate dashboard based on their role
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

// Coach pages
import { CoachAccount } from './pages/coach/Account';
import { AthleteProfile } from './pages/coach/AthleteProfile';
import { Athletes } from './pages/coach/Athletes';
import { CoachDashboard } from './pages/coach/Dashboard';
import { ProgramAssignment } from './pages/coach/ProgramAssignment';
import ProgramCalendar from './pages/coach/ProgramCalendar';
import { ProgramDashboard } from './pages/coach/ProgramDashboard';

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
    return <Navigate to={`/register?code=${searchParams.get('code')}`} replace />;
  }
  
  // Otherwise, just redirect to the target path
  return <Navigate to={to} replace />;
};

function App() {
  return (
    <ThemeProvider>
      <ProfileProvider>
        <ModalProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Legacy route redirects */}
            <Route path="/athlete-signin" element={<RedirectWithParams to="/login" />} />
            <Route path="/athlete-signin/:coachName" element={<RedirectWithParams to="/login" />} />
            <Route path="/coach-signin" element={<Navigate to="/login" replace />} />
            
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
                    <Routes>
                      <Route path="/" element={<DemoCoachDashboard />} />
                      <Route path="/programs" element={<ProgramDashboard />} />
                      <Route path="/athletes" element={<Athletes />} />
                      <Route path="/athletes/:athleteId" element={<AthleteProfile />} />
                      <Route path="/program/:programId" element={<ProgramCalendar />} />
                      <Route path="/program/:programId/assign" element={<ProgramAssignment />} />
                    </Routes>
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
                    <Routes>
                      <Route path="/" element={<CoachDashboard />} />
                      <Route path="/programs" element={<ProgramDashboard />} />
                      <Route path="/athletes" element={<Athletes />} />
                      <Route path="/athletes/:athleteId" element={<AthleteProfile />} />
                      <Route path="/program/:programId" element={<ProgramCalendar />} />
                      <Route path="/program/:programId/assign" element={<ProgramAssignment />} />
                      <Route path="/account" element={<CoachAccount />} />
                    </Routes>
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
                    <Routes>
                      <Route path="/" element={<AthleteDashboard />} />
                      <Route path="/account" element={<AthleteAccount />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ModalProvider>
      </ProfileProvider>
    </ThemeProvider>
  );
}

export default App;