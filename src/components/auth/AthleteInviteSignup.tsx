/**
 * src/components/auth/AthleteInviteSignup.tsx
 * 
 * Component to handle athlete signup with invite code.
 * Fetches coach name from the invite code and redirects to the AthleteSignIn component.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const AthleteInviteSignup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('code');
  const [coachName, setCoachName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCoachInfo = async () => {
      if (!inviteCode) {
        console.log('No invite code found, redirecting to regular athlete sign-in');
        navigate('/athlete-signin', { replace: true });
        return;
      }

      try {
        console.log('Fetching coach info for invite code:', inviteCode);
        
        // List all coach profiles to see what's available
        const { data: allCoaches, error: coachError } = await supabase
          .from('profiles')
          .select('id, full_name, role, invite_code')
          .eq('role', 'coach');
        
        console.log('All coaches:', { allCoaches, coachError });
        
        // Check if any coach has a matching invite code (case insensitive)
        const matchingCoach = allCoaches?.find(coach => 
          coach.invite_code && coach.invite_code.toLowerCase() === inviteCode.toLowerCase()
        );
        
        if (matchingCoach) {
          console.log('Found matching coach with case-insensitive check:', matchingCoach);
        }
        
        // First, let's check if the invite code exists in the profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, role, invite_code')
          .eq('invite_code', inviteCode)
          .eq('role', 'coach');
        
        console.log('Direct profile query result:', { profileData, profileError });
        
        // Call the get_coach_by_invite_code RPC function to get coach info
        const { data, error } = await supabase.rpc('get_coach_by_invite_code', {
          code: inviteCode
        });
        
        console.log('RPC result:', { data, error });
        
        // Use either the RPC result or fall back to direct query result
        let coachInfo = null;
        
        if (error) {
          console.error('Error fetching coach info with RPC:', error);
          
          // Fall back to direct query result
          if (profileData && profileData.length > 0) {
            coachInfo = {
              coach_id: profileData[0].id,
              coach_name: profileData[0].full_name,
              success: true
            };
            console.log('Using fallback coach info from direct query:', coachInfo);
          } 
          // Try case-insensitive match as another fallback
          else if (matchingCoach) {
            coachInfo = {
              coach_id: matchingCoach.id,
              coach_name: matchingCoach.full_name,
              success: true
            };
            console.log('Using fallback coach info from case-insensitive match:', coachInfo);
          }
        } else if (data) {
          // Handle the case where data is an array
          if (Array.isArray(data) && data.length > 0) {
            coachInfo = data[0]; // Use the first result
            console.log('Using coach info from RPC result array:', coachInfo);
          } 
          // Handle the case where data is a direct object
          else if (data.success) {
            coachInfo = data;
            console.log('Using coach info from RPC result object:', coachInfo);
          }
        }
        
        // Process coach info (from either source)
        if (coachInfo && coachInfo.success && coachInfo.coach_name) {
          console.log('Found coach:', coachInfo.coach_name);
          setCoachName(coachInfo.coach_name);
          // Store coach name in session storage for use in the sign-in component
          sessionStorage.setItem('inviteCoachName', coachInfo.coach_name);
          // Redirect to athlete sign-in with the invite code
          navigate(`/athlete-signin?code=${inviteCode}`, { replace: true });
        } else {
          console.error('No coach found for this invite code');
          setError('No coach found for this invitation code.');
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error processing invite code:', err);
        setError('An error occurred while processing your invitation.');
        setIsLoading(false);
      }
    };

    fetchCoachInfo();
  }, [inviteCode, navigate]);

  // Show a loading state while redirecting or error if something went wrong
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
      <div className="fixed inset-0 bg-grid-pattern opacity-5"></div>
      <div className="fixed inset-0 bg-gradient-to-b from-blue-500/10 to-purple-600/10"></div>
      
      <div className="relative z-10 text-center">
        {error ? (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 max-w-md">
            <h2 className="text-xl font-semibold text-white mb-4">Invitation Error</h2>
            <p className="text-red-200 mb-4">{error}</p>
            <p className="text-gray-300 mb-6 text-sm">
              This may be due to:
              <br />- The invitation code being incorrect
              <br />- The coach has changed or disabled their invitation code
              <br />- A temporary system issue
            </p>
            <div className="flex flex-col space-y-3">
              <button 
                onClick={() => navigate('/', { replace: true })}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Return to Home
              </button>
              <button 
                onClick={() => navigate('/athlete-signin', { replace: true })}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Sign In as Athlete
              </button>
              <button 
                onClick={() => navigate('/invite-code-entry', { replace: true })}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Enter Invitation Code Manually
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 border-4 border-t-blue-600 border-b-blue-600 border-l-transparent border-r-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-6 text-white text-xl font-semibold">Processing your invitation</p>
            {coachName && <p className="mt-2 text-blue-300">from Coach {coachName}</p>}
            <p className="mt-2 text-gray-400 text-sm">Redirecting to sign in...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AthleteInviteSignup; 