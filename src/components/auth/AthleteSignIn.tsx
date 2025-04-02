import { AlertCircle, ArrowLeft, Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

type Coach = {
  id: string;
  full_name: string;
};

// Helper function to convert the coach name to a URL-friendly format
const createSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/--+/g, '-')     // Replace multiple hyphens with a single one
    .trim();                  // Trim any leading/trailing spaces or hyphens
};

const AthleteSignIn = () => {
  const navigate = useNavigate();
  const [coachName, setCoachName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [foundCoach, setFoundCoach] = useState<Coach | null>(null);

  const handleCoachSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachName.trim()) {
      setError('Please enter a coach name');
      return;
    }

    setIsSearching(true);
    setError('');
    setFoundCoach(null);

    try {
      // Search for coach in profiles table
      const { data, error: searchError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'coach')
        .ilike('full_name', `%${coachName}%`)
        .limit(1);
      
      if (searchError) throw searchError;
      
      if (!data || data.length === 0) {
        setError(`No coach found with name "${coachName}"`);
      } else {
        setFoundCoach(data[0] as Coach);
        
        // Update the URL with the coach name without navigating
        const coachSlug = createSlug(data[0].full_name);
        window.history.replaceState(
          {}, 
          `Join ${data[0].full_name}`, 
          `/athlete-signin/${coachSlug}`
        );
      }
    } catch (err) {
      console.error('Error searching for coach:', err);
      setError('An error occurred while searching for the coach');
    } finally {
      setIsSearching(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!foundCoach) return;
    
    try {
      // Get the current domain
      const domain = window.location.origin;
      
      // Create a URL-friendly version of the coach name
      const coachSlug = createSlug(foundCoach.full_name);
      
      // Construct the redirect URL with coach ID and name
      const redirectTo = `${domain}/auth/callback?role=athlete&coachId=${foundCoach.id}&coachName=${coachSlug}`;
      
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
              Join Your Coach on Rudo
            </h1>
            
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300">
              {!foundCoach ? (
                <>
                  <h2 className="text-2xl font-bold mb-6 text-center">Find Your Coach</h2>
                  <p className="text-gray-400 mb-6 text-center">
                    Enter your coach's name to connect with their platform
                  </p>

                  <form onSubmit={handleCoachSearch} className="mb-6">
                    <div className="relative mb-4">
                      <input
                        type="text"
                        value={coachName}
                        onChange={(e) => setCoachName(e.target.value)}
                        placeholder="Coach's name"
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 pl-10 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                      />
                      <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                    </div>
                    
                    {error && (
                      <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg flex items-center text-sm">
                        <AlertCircle className="w-4 h-4 mr-2 text-red-400" />
                        <span>{error}</span>
                      </div>
                    )}
                    
                    <button
                      type="submit"
                      disabled={isSearching}
                      className="w-full bg-white text-black hover:bg-purple-600 hover:text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSearching ? 'Searching...' : 'Find Coach'}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold mb-2">Coach Found!</h2>
                    <p className="text-gray-400">Ready to join {foundCoach.full_name}?</p>
                  </div>
                  
                  <button
                    onClick={handleGoogleLogin}
                    className="w-full bg-white text-black hover:bg-purple-600 hover:text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center"
                  >
                    <img 
                      src="https://www.google.com/favicon.ico" 
                      alt="Google" 
                      className="w-5 h-5 mr-2"
                    />
                    Sign in with Google
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AthleteSignIn; 