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
import { supabase } from '../../lib/supabase';
import AuthScreen from './AuthScreen';

const AthleteSignIn = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [inviteCode, setInviteCode] = useState<string | null>(searchParams.get('code'));
  const [coachName, setCoachName] = useState<string | null>(null);

  // If invite code is provided, fetch coach info
  useEffect(() => {
    if (!inviteCode) return;

    const fetchCoachInfo = async () => {
      try {
        // Validate the invite code and get the coach's name
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('invite_code', inviteCode)
          .eq('role', 'coach')
          .maybeSingle();

        if (error) {
          console.error('Error validating invite code:', error);
          return;
        }

        if (data) {
          setCoachName(data.full_name);
        }
      } catch (err) {
        console.error('Error fetching coach info:', err);
      }
    };
    
    fetchCoachInfo();
  }, [inviteCode, coachName]);

  const handleGoogleLogin = async () => {
    try {
      // Store selected role in localStorage to be retrieved during the OAuth process
      localStorage.setItem('selectedRole', 'athlete');
      
      // Store user data with role and invite code (if present)
      const userData = { role: 'athlete' };
      if (inviteCode) {
        Object.assign(userData, { inviteCode });
      }
      
      localStorage.setItem('oauthUserData', JSON.stringify(userData));
      
      // Get the current domain
      const domain = window.location.origin;
      
      // Build redirect URL with role
      const redirectUrl = `${domain}/auth/callback?role=athlete`;
      
      // Add invite code to the redirect URL if it exists
      const finalRedirectUrl = inviteCode 
        ? `${redirectUrl}&inviteCode=${inviteCode}`
        : redirectUrl;
      
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: finalRedirectUrl,
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