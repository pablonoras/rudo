import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ThemeProvider } from './components/ThemeProvider';
import { LanguageProvider } from './contexts/LanguageContext';
import { ModalProvider } from './contexts/ModalContext';

// Auth components
import AthleteSignIn from './components/auth/AthleteSignIn';
import AuthCallback from './components/auth/AuthCallback';
import CoachSearch from './components/auth/CoachSearch';
import CoachSignIn from './components/auth/CoachSignIn';
import LoginSuccess from './components/auth/LoginSuccess';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleSelection from './components/auth/RoleSelection';
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

// Debugging tools
import CoachSearchDebug from './debugging/CoachSearchDebug';

import { initializeWithSampleData } from './lib/workout';

function App() {
  useEffect(() => {
    initializeWithSampleData();
  }, []);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <ModalProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/choose-role" element={<RoleSelection />} />
            <Route path="/role-selection" element={<CoachSearch />} />
            <Route path="/athlete-signin" element={<AthleteSignIn />} />
            <Route path="/athlete-signin/:coachName" element={<AthleteSignIn />} />
            <Route path="/coach-signin" element={<CoachSignIn />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/login/success" element={<LoginSuccess />} />
            
            {/* Debugging routes */}
            <Route path="/debug/coach-search" element={<CoachSearchDebug />} />
            
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
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ModalProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;