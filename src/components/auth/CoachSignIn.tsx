/**
 * src/components/auth/CoachSignIn.tsx
 * 
 * Enhanced sign-in page for coaches that supports both Google and email authentication.
 */

import { AuthError } from '@supabase/supabase-js';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { supabase } from '../../lib/supabase';
import AuthScreen from './AuthScreen';

const CoachSignIn = () => {
  const navigate = useNavigate();

  const handleGoogleLogin = useCallback(async () => {
    try {
      // Store selected role in localStorage to be retrieved during the OAuth process
      localStorage.setItem('selectedRole', 'coach');
      // Store more detailed user data for the OAuth flow
      localStorage.setItem('oauthUserData', JSON.stringify({
        role: 'coach'
      }));
      
      // Get the current domain
      const domain = window.location.origin;
      
      // Construct the redirect URL with coach role
      const redirectTo = `${domain}/auth/callback?role=coach`;
      
      // Use Supabase's signInWithOAuth method directly
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
        throw authError;
      }
    } catch (error) {
      const errorMessage = error instanceof AuthError 
        ? error.message 
        : 'An unexpected error occurred during Google sign in';
      console.error('Google sign in error:', error);
      // Store error in localStorage to be displayed on the auth page
      localStorage.setItem('auth_error', errorMessage);
      // Redirect to auth page to show the error
      navigate('/auth');
    }
  }, [navigate]);

  return (
    <AuthScreen 
      role="coach"
      title="Coach Sign In"
      subtitle="Sign in to manage your athletes and programs"
      handleGoogleLogin={handleGoogleLogin}
    />
  );
};

export default CoachSignIn; 