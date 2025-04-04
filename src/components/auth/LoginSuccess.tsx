import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to coach dashboard after a brief delay
    const timer = setTimeout(() => {
      navigate('/coach');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold mb-2">Login Successful!</h1>
        <p className="text-gray-400">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
};

export default LoginSuccess;