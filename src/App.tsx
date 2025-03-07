import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ThemeProvider } from './components/ThemeProvider';
import { LandingPage } from './pages/LandingPage';
import { ProgramDashboard } from './pages/coach/ProgramDashboard';
import { ProgramCalendar } from './pages/coach/ProgramCalendar';
import { ProgramAssignment } from './pages/coach/ProgramAssignment';
import { AthleteDashboard } from './pages/athlete/Dashboard';
import { initializeWithSampleData } from './lib/workout';

function App() {
  useEffect(() => {
    // Initialize sample data when the app starts
    initializeWithSampleData();
  }, []);

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Coach Routes */}
          <Route
            path="/coach"
            element={
              <Layout>
                <ProgramDashboard />
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

          {/* Athlete Routes */}
          <Route
            path="/athlete"
            element={
              <Layout>
                <AthleteDashboard />
              </Layout>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;