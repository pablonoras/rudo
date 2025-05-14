/**
 * src/components/auth/AthleteSignIn.tsx
 * 
 * Enhanced sign-in page for athletes that supports both Google and email authentication.
 * After sign-in, athletes are redirected to either their dashboard (if they have a coach)
 * or to the invitation code entry page.
 * 
 * This component also handles invite codes passed via URL query parameters and displays
 * the coach's name when coming from an invitation link.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { signInWithOAuth, supabase } from '../../lib/supabase';
import AuthScreen from './AuthScreen';

const AthleteSignIn = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('code');
  const [coachName, setCoachName] = useState<string | null>(null);

  useEffect(() => {
    const fetchCoachInfo = async () => {
      // Check if we have a coach name in session storage (from the invite signup page)
      const storedCoachName = sessionStorage.getItem('inviteCoachName');
      if (storedCoachName) {
        setCoachName(storedCoachName);
        return;
      }
      
      // If we have an invite code but no coach name, try to fetch it directly
      if (inviteCode && !coachName) {
        try {
          console.log('Fetching coach info for invite code:', inviteCode);
          
          // Try a direct query first
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('invite_code', inviteCode)
            .eq('role', 'coach')
            .maybeSingle();
          
          if (profileData && profileData.full_name) {
            console.log('Found coach via direct query:', profileData.full_name);
            setCoachName(profileData.full_name);
            sessionStorage.setItem('inviteCoachName', profileData.full_name);
            return;
          }
          
          // Try case-insensitive match
          const { data: allCoaches } = await supabase
            .from('profiles')
            .select('id, full_name, invite_code')
            .eq('role', 'coach');
          
          const matchingCoach = allCoaches?.find(coach => 
            coach.invite_code && coach.invite_code.toLowerCase() === inviteCode.toLowerCase()
          );
          
          if (matchingCoach) {
            console.log('Found coach via case-insensitive match:', matchingCoach.full_name);
            setCoachName(matchingCoach.full_name);
            sessionStorage.setItem('inviteCoachName', matchingCoach.full_name);
          }
        } catch (error) {
          console.error('Error fetching coach info:', error);
        }
      }
    };
    
    fetchCoachInfo();
  }, [inviteCode, coachName]);

  const handleGoogleLogin = async () => {
    try {
      // Get the current domain
      const domain = window.location.origin;
      
      // Use the enhanced signInWithOAuth function
      const { error: authError } = await signInWithOAuth(
        'google', 
        'athlete', 
        `${domain}/auth/callback`,
        inviteCode || undefined
      );

      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error signing in with Google');
    }
  };

  // Create subtitle based on whether this is an invitation or regular sign-in
  const getSubtitle = () => {
    if (inviteCode && coachName) {
      return `Sign in to join Coach ${coachName}'s team`;
    } else if (inviteCode) {
      return "Sign in to join your coach's team";
    } else {
      return "Sign in to access your workout programs and connect with coaches";
    }
  };

  return (
    <AuthScreen 
      role="athlete"
      title="Sign In as Athlete"
      subtitle={getSubtitle()}
      handleGoogleLogin={handleGoogleLogin}
      inviteCode={inviteCode || undefined}
      coachName={coachName}
    />
  );
};

export default AthleteSignIn; 