import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const CoachSignIn = () => {
  const navigate = useNavigate();

  const handleCoachSignIn = async () => {
    try {
      // Get the current domain
      const domain = window.location.origin;
      
      // Construct the redirect URL with coach role and additional metadata
      const redirectTo = `${domain}/auth/callback?role=coach&isNewCoach=true`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            role: 'coach'
          },
        },
      });

      if (error) {
        console.error('Auth error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      alert('Error signing in with Google');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="fixed inset-0 bg-gradient-to-b from-purple-900/20 to-black"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/choose-role')}
          className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Role Selection
        </button>
      </div>

      <main className="flex-grow relative z-10 flex items-center justify-center">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-bold text-center mb-12">
              Coach Sign In
            </h1>
            
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-4">Welcome Coach!</h2>
                <p className="text-gray-400 mb-6">
                  Sign in with your Google account to access your dashboard and manage your athletes.
                </p>
                
                <div className="max-w-xs mx-auto">
                  <img 
                    src="https://images.unsplash.com/photo-1544216717-3bbf52512659?auto=format&fit=crop&w=400&q=80" 
                    alt="Coach instructing athlete" 
                    className="w-full h-48 object-cover rounded-lg mb-8 opacity-80"
                  />
                </div>

                <button
                  onClick={handleCoachSignIn}
                  className="w-full bg-white text-black hover:bg-purple-600 hover:text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 flex items-center justify-center"
                >
                  <img 
                    src="https://www.google.com/favicon.ico" 
                    alt="Google" 
                    className="w-5 h-5 mr-2"
                  />
                  Sign in with Google
                </button>
              </div>

              <div className="text-center text-sm text-gray-500 mt-6">
                <p>By signing in, you'll have access to the coach dashboard where you can create and manage workout programs, track athlete progress, and more.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CoachSignIn; 