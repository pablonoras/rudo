/**
 * src/components/auth/AthleteSignIn.tsx
 * 
 * Updated to provide direct sign-in with Google for athletes without requiring
 * coach search first. Coach search is now handled in the Athlete Dashboard.
 */

import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const AthleteSignIn = () => {
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      // Get the current domain
      const domain = window.location.origin;
      
      // Construct the redirect URL with athlete role
      const redirectTo = `${domain}/auth/callback?role=athlete`;
      
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error signing in with Google');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="fixed inset-0 bg-gradient-to-b from-purple-900/20 to-black"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </button>
      </div>

      <main className="flex-grow relative z-10 flex items-center justify-center">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-bold text-center mb-12">
              Sign In as Athlete
            </h1>
            
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300">
              <h2 className="text-2xl font-bold mb-6 text-center">Welcome to Rudo</h2>
              <p className="text-gray-400 mb-8 text-center">
                Sign in to access your workout programs, track your progress, and connect with coaches.
              </p>
              
              <button
                onClick={handleGoogleLogin}
                className="w-full bg-white text-black hover:bg-blue-600 hover:text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center"
              >
                <img 
                  src="https://www.google.com/favicon.ico" 
                  alt="Google" 
                  className="w-5 h-5 mr-2"
                />
                Sign in with Google
              </button>
              
              <p className="mt-6 text-xs text-center text-gray-500">
                After signing in, you'll be able to find and request to join a coach from your dashboard.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AthleteSignIn; 