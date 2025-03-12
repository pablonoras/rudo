import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import RoleSelection from './components/auth/RoleSelection';
import AuthCallback from './components/auth/AuthCallback';
import CoachDashboard from './components/dashboard/CoachDashboard';
import AthleteDashboard from './components/dashboard/AthleteDashboard';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/role-selection" element={<RoleSelection />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route 
        path="/coach/*" 
        element={
          <ProtectedRoute role="coach">
            <CoachDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/athlete/*" 
        element={
          <ProtectedRoute role="athlete">
            <AthleteDashboard />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<LandingPage />} />
    </Routes>
  );
}

export default App;