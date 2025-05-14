import React from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route 
          path="/athlete-signup" 
          element={<Navigate to={`/athlete-signin${window.location.search}`} replace />} 
        />
      </Routes>
    </Router>
  );
};

export default App; 