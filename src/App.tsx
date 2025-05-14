/**
 * src/App.tsx
 * 
 * Main application component that sets up routing for the entire application.
 * Updated to implement the new athlete sign-in workflow:
 * 1. Athlete signs in with Google
 * 2. If no coach relationship exists, they're redirected to the invite code entry page
 * 3. After entering a valid invite code, they're redirected to the athlete dashboard
 */

import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ThemeProvider } from './components/ThemeProvider';
import { LanguageProvider, ModalProvider, ProfileProvider } from './contexts';

// Auth components
import AthleteInviteSignup from './components/auth/AthleteInviteSignup';
import AthleteSignIn from './components/auth/AthleteSignIn';
import AuthCallback from './components/auth/AuthCallback';
import CoachSignIn from './components/auth/CoachSignIn';
import InviteCodeEntry from './components/auth/InviteCodeEntry';
import LoginSuccess from './components/auth/LoginSuccess';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LandingPage from './components/LandingPage';

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

function App() {
  return (
    <ThemeProvider>
      <ProfileProvider>
        <LanguageProvider>
          <ModalProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/athlete-signin" element={<AthleteSignIn />} />
              <Route path="/athlete-signin/:coachName" element={<AthleteSignIn />} />
              <Route path="/athlete-signup" element={<AthleteInviteSignup />} />
              <Route path="/coach-signin" element={<CoachSignIn />} />
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
        </LanguageProvider>
      </ProfileProvider>
    </ThemeProvider>
  );
}

export default App;