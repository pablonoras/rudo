/**
 * src/App.tsx
 * 
 * Main application component that sets up routing for the entire application.
 * The app now has two distinct flows:
 * 1. Main application with actual data (starting without any pre-loaded data)
 * 2. Demo mode with sample data for testing and demos
 * 
 * Updated athlete workflow to direct to sign in first before finding a coach.
 */

import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ThemeProvider } from './components/ThemeProvider';
import { LanguageProvider, ModalProvider, ProfileProvider } from './contexts';

// Auth components
import AthleteSignIn from './components/auth/AthleteSignIn';
import AuthCallback from './components/auth/AuthCallback';
import CoachSignIn from './components/auth/CoachSignIn';
import LoginSuccess from './components/auth/LoginSuccess';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LandingPage from './components/LandingPage';

// Coach pages
import { AthleteProfile } from './pages/coach/AthleteProfile';
import { Athletes } from './pages/coach/Athletes';
import { CoachDashboard } from './pages/coach/Dashboard';
import { ProgramAssignment } from './pages/coach/ProgramAssignment';
import ProgramCalendar from './pages/coach/ProgramCalendar';
import { ProgramDashboard } from './pages/coach/ProgramDashboard';

// Athlete pages
import { AthleteDashboard } from './pages/athlete/Dashboard';
import { FindCoach } from './pages/athlete/FindCoach';

// Demo components
import DemoInitializer from './components/DemoInitializer';
import { DemoLayout } from './components/DemoLayout';
import { DemoCoachDashboard } from './pages/demo/Dashboard';

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
              <Route path="/coach-signin" element={<CoachSignIn />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/login/success" element={<LoginSuccess />} />
              
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
                        <Route path="/find-coach" element={<FindCoach />} />
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