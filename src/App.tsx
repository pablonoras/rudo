import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ThemeProvider } from './components/ThemeProvider';
import { ModalProvider } from './contexts/ModalContext';
import { LandingPage } from './pages/LandingPage';
import { CoachDashboard } from './pages/coach/Dashboard';
import { ProgramDashboard } from './pages/coach/ProgramDashboard';
import ProgramCalendar from './pages/coach/ProgramCalendar';
import { ProgramAssignment } from './pages/coach/ProgramAssignment';
import { Athletes } from './pages/coach/Athletes';
import { AthleteProfile } from './pages/coach/AthleteProfile';
import { AthleteDashboard } from './pages/athlete/Dashboard';
import { initializeWithSampleData } from './lib/workout';

function App() {
  useEffect(() => {
    initializeWithSampleData();
  }, []);

  return (
    <ThemeProvider>
      <ModalProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/coach"
              element={
                <Layout>
                  <CoachDashboard />
                </Layout>
              }
            />
            <Route
              path="/coach/programs"
              element={
                <Layout>
                  <ProgramDashboard />
                </Layout>
              }
            />
            <Route
              path="/coach/athletes"
              element={
                <Layout>
                  <Athletes />
                </Layout>
              }
            />
            <Route
              path="/coach/athletes/:athleteId"
              element={
                <Layout>
                  <AthleteProfile />
                </Layout>
              }
            />
            <Route
              path="/coach/program/:programId"
              element={
                <Layout>
                  <ProgramCalendar />
                </Layout>
              }
            />
            <Route
              path="/coach/program/:programId/assign"
              element={
                <Layout>
                  <ProgramAssignment />
                </Layout>
              }
            />
            <Route
              path="/athlete"
              element={
                <Layout>
                  <AthleteDashboard />
                </Layout>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ModalProvider>
    </ThemeProvider>
  );
}

export default App;