import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ThemeProvider } from './components/ThemeProvider';
import { ModalProvider } from './contexts/ModalContext';

// Auth components
import LandingPage from './components/LandingPage';
import AuthCallback from './components/auth/AuthCallback';
import LoginSuccess from './components/auth/LoginSuccess';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleSelection from './components/auth/RoleSelection';

// Coach pages
import { AthleteProfile } from './pages/coach/AthleteProfile';
import { Athletes } from './pages/coach/Athletes';
import { CoachDashboard } from './pages/coach/Dashboard';
import { ProgramAssignment } from './pages/coach/ProgramAssignment';
import ProgramCalendar from './pages/coach/ProgramCalendar';
import { ProgramDashboard } from './pages/coach/ProgramDashboard';

// Athlete pages
import { AthleteDashboard } from './pages/athlete/Dashboard';

import { initializeWithSampleData } from './lib/workout';

function App() {
  useEffect(() => {
    initializeWithSampleData();
  }, []);

  return (
    <ThemeProvider>
      <ModalProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/role-selection" element={<RoleSelection />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/login/success" element={<LoginSuccess />} />
          
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
    </ThemeProvider>
  );
}

export default App;