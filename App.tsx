import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ModalProvider } from './contexts/ModalContext';
import { ProfileProvider } from './contexts/ProfileContext';

const App: React.FC = () => {
  return (
    <ProfileProvider>
      <ModalProvider>
        <Routes>
          <Route 
            path="/athlete-signup" 
            element={<Navigate to={`/register${window.location.search}`} replace />} 
          />
        </Routes>
      </ModalProvider>
    </ProfileProvider>
  );
};

export default App; 