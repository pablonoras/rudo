/**
 * src/components/auth/AthleteSignup.tsx
 * 
 * Athlete signup page that handles invitation codes from coaches.
 * It can take an invite code from a URL parameter or allow manual entry.
 * After signup, it creates a pending connection with the coach.
 */

import { ArrowLeft, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const AthleteSignup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const codeParam = searchParams.get('code');
  
  const [inviteCode, setInviteCode] = useState(codeParam || '');
  const [coachName, setCoachName] = useState('');
  const [isCodeValid, setIsCodeValid] = useState(!!codeParam);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate the code when component mounts or code changes
  useEffect(() => {
    if (inviteCode.trim()) {
      validateInviteCode(inviteCode);
    } else {
      setIsCodeValid(false);
      setCoachName('');
    }
  }, [inviteCode]);

  // Function to validate the invite code
  const validateInviteCode = async (code: string) => {
    if (!code.trim()) {
      setIsCodeValid(false);
      setCoachName('');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      // Check if the code exists and fetch the coach name
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('invite_code', code)
        .eq('role', 'coach')
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        setIsCodeValid(true);
        setCoachName(data.full_name);
      } else {
        setIsCodeValid(false);
        setCoachName('');
        setError('Invalid invitation code. Please check and try again.');
      }
    } catch (err) {
      console.error('Error validating invite code:', err);
      setIsCodeValid(false);
      setCoachName('');
      setError('An error occurred while validating the code. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  // Handle manual code input
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCode = e.target.value.toLowerCase().replace(/\s/g, '');
    setInviteCode(newCode);
    
    // Cancel any pending validation
    if (isValidating) {
      setIsValidating(false);
    }
    
    // Clear validation state
    setIsCodeValid(false);
    setCoachName('');
    setError(null);
  };

  // Validate code on blur
  const handleCodeBlur = () => {
    if (inviteCode.trim()) {
      validateInviteCode(inviteCode);
    }
  };

  // Validate code on Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inviteCode.trim()) {
      validateInviteCode(inviteCode);
    }
  };

  const handleGoogleLogin = async () => {
    if (!isCodeValid) {
      setError('Please enter a valid invitation code before signing up.');
      return;
    }

    try {
      // Store selected role and invite code in localStorage to be retrieved during the OAuth process
      localStorage.setItem('selectedRole', 'athlete');
      // Store more detailed user data for the OAuth flow
      localStorage.setItem('oauthUserData', JSON.stringify({
        role: 'athlete',
        inviteCode: inviteCode
      }));
      
      // Get the current domain
      const domain = window.location.origin;
      
      // Construct the redirect URL with athlete role and invitation code
      const redirectTo = `${domain}/auth/callback?role=athlete&inviteCode=${encodeURIComponent(inviteCode)}`;
      
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error signing in with Google. Please try again.');
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
              Join Your Coach
            </h1>
            
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300">
              <h2 className="text-2xl font-bold mb-6 text-center">
                {isCodeValid 
                  ? `Join ${coachName} at Rudo` 
                  : 'Enter Your Invitation Code'}
              </h2>
              
              {!codeParam && (
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Coach Invitation Code
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={handleCodeChange}
                      onBlur={handleCodeBlur}
                      onKeyDown={handleKeyDown}
                      placeholder="Enter the code your coach shared with you"
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:ring-blue-500 focus:border-blue-500"
                      autoFocus
                    />
                    {isValidating && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
                      </div>
                    )}
                  </div>
                  
                  {error && (
                    <p className="mt-2 text-sm text-red-400">
                      {error}
                    </p>
                  )}
                  
                  {isCodeValid && coachName && (
                    <p className="mt-2 text-sm text-green-400">
                      Valid code! You'll join {coachName}'s team.
                    </p>
                  )}
                </div>
              )}
              
              <div className="mt-6">
                <button
                  onClick={handleGoogleLogin}
                  disabled={!isCodeValid || isValidating}
                  className="w-full bg-white text-black hover:bg-blue-600 hover:text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <img 
                    src="https://www.google.com/favicon.ico" 
                    alt="Google" 
                    className="w-5 h-5 mr-2"
                  />
                  Sign up with Google
                </button>
                
                <p className="mt-6 text-xs text-center text-gray-500">
                  After signing up, you'll be added to your coach's pending list.
                  Your coach will approve your request to get started.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AthleteSignup; 