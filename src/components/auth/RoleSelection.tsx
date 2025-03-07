import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Users, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const RoleSelection = () => {
  const navigate = useNavigate();

  const handleGoogleLogin = async (role: 'coach' | 'athlete') => {
    try {
      const redirectTo = `${window.location.origin}/${role}`;
      console.log('Redirect URL:', redirectTo); // For debugging
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('Auth error:', error);
        throw error;
      }

      console.log('Auth successful:', data); // For debugging
      
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
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-bold text-center mb-12">
              Choose Your Role
            </h1>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Coach Option */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300">
                <div className="text-purple-400 mb-6">
                  <Users className="w-12 h-12" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Rudo Coach</h2>
                <p className="text-gray-400 mb-8">
                  Manage your box, program workouts, and track athlete progress.
                </p>
                <button
                  onClick={() => handleGoogleLogin('coach')}
                  className="w-full bg-white text-black hover:bg-purple-600 hover:text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center"
                >
                  <img 
                    src="https://www.google.com/favicon.ico" 
                    alt="Google" 
                    className="w-5 h-5 mr-2"
                  />
                  Sign in with Google
                </button>
              </div>

              {/* Athlete Option */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300">
                <div className="text-purple-400 mb-6">
                  <Dumbbell className="w-12 h-12" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Rudo Athlete</h2>
                <p className="text-gray-400 mb-8">
                  Track your workouts, view programming, and connect with your community.
                </p>
                <button
                  onClick={() => handleGoogleLogin('athlete')}
                  className="w-full bg-white text-black hover:bg-purple-600 hover:text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center"
                >
                  <img 
                    src="https://www.google.com/favicon.ico" 
                    alt="Google" 
                    className="w-5 h-5 mr-2"
                  />
                  Sign in with Google
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RoleSelection;