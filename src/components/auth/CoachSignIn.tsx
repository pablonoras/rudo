/**
 * src/components/auth/CoachSignIn.tsx
 * 
 * Enhanced sign-in page for coaches that supports both Google and email authentication.
 */

import { useNavigate } from 'react-router-dom';
import { signInWithOAuth } from '../../lib/supabase';
import AuthScreen from './AuthScreen';

const CoachSignIn = () => {
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      // Get the current domain
      const domain = window.location.origin;
      
      // Use the enhanced signInWithOAuth function
      const { error: authError } = await signInWithOAuth(
        'google',
        'coach',
        `${domain}/auth/callback`,
      );

      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      alert('Error signing in with Google');
    }
  };

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