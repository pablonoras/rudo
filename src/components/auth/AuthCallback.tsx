/**
 * src/components/auth/AuthCallback.tsx
 * 
 * Callback handler for authentication flows. 
 * Implements:
 * 1. Email verification
 * 2. Password reset
 * 3. Role-agnostic redirection based on user profile
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ensureProfileExists, getCurrentProfile, supabase, updatePassword } from '../../lib/supabase';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('inviteCode');
  const isEmailVerification = searchParams.has('email-verification');
  const isPasswordReset = searchParams.has('type') && searchParams.get('type') === 'recovery';
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsSubmitting] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Email verification flow
        if (isEmailVerification) {
          // The verification happens automatically with Supabase when the user clicks the link
          // Check if the user is now signed in
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            throw sessionError;
          }
          
          if (session) {
            // Update the email_verified flag in the profile table
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ email_verified: true })
              .eq('id', session.user.id);
            
            if (updateError) {
              console.error('Error updating email verification status:', updateError);
            }
            
            // Redirect based on role from profile
            await redirectBasedOnRole(session.user.id);
          } else {
            // If no session, redirect to sign in
            navigate('/login');
          }
          return;
        }
        
        // Password reset flow
        if (isPasswordReset) {
          // Show the password reset form
          setShowResetForm(true);
          setIsSubmitting(false);
          return;
        }

        // Normal auth callback flow
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (session) {
          // Handle the OAuth sign-in with invite code if provided
          if (inviteCode) {
            await handleAthleteWithInviteCode(session.user.id, inviteCode);
          } else {
            // For all other cases, ensure profile exists and redirect based on role
            // If user has no profile yet, create one with default role
            const profile = await getCurrentProfile();
            if (!profile) {
              await ensureProfileExists('coach'); // Default role if none exists
            }
            await redirectBasedOnRole(session.user.id);
          }
        } else {
          navigate('/login');
        }
      } catch (error: any) {
        console.error('Error in auth callback:', error);
        setError(error.message || 'An error occurred during authentication');
        setTimeout(() => navigate('/login'), 5000);
      } finally {
        if (!isPasswordReset) {
          setIsSubmitting(false);
        }
      }
    };

    // Function to redirect based on user role from profile
    const redirectBasedOnRole = async (userId: string) => {
      try {
        // Get the user's profile to determine their role
        const profile = await getCurrentProfile();
        
        if (!profile) {
          setError('Unable to retrieve user profile');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        
        // Redirect based on role
        if (profile.role === 'coach') {
          navigate('/coach');
        } else if (profile.role === 'athlete') {
          // For athletes, check if they have any coach relationships
          await checkAthleteCoachRelationships(userId);
        } else {
          // Fallback to login if role is not recognized
          navigate('/login');
        }
      } catch (error) {
        console.error('Error determining user role:', error);
        setError('An error occurred while accessing your account');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    // Handle athlete registration with invite code
    const handleAthleteWithInviteCode = async (userId: string, code: string) => {
      console.log('Processing invite code for athlete:', code);
      
      // Ensure profile exists as athlete since we have an invite code
      await ensureProfileExists('athlete');
      
      try {
        // Call the RPC function to resolve the invite code and create the relationship
        const { data: resolveResult, error: resolveError } = await supabase
          .rpc('resolve_invite', {
            code,
            athlete_user_id: userId
          });
        
        if (resolveError) {
          console.error('Error resolving invite code:', resolveError);
          setError(`Error resolving invite code: ${resolveError.message}`);
          setTimeout(() => navigate('/athlete'), 3000);
        } else if (!resolveResult || !resolveResult.success) {
          console.error('Invalid invite code:', resolveResult?.message);
          setError('Invalid invitation code. Please try again.');
          setTimeout(() => navigate('/invite-code-entry'), 3000);
        } else {
          // Store coach info in localStorage for use after email verification
          localStorage.setItem('pendingCoachName', resolveResult.coach_name);
          localStorage.setItem('pendingCoachId', resolveResult.coach_id);
          localStorage.setItem('pendingJoinStatus', 'true');
          
          // Redirect to athlete dashboard
          navigate('/athlete');
        }
      } catch (error: any) {
        console.error('Error processing invite code:', error);
        setError('An error occurred while processing your invitation code');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    const checkAthleteCoachRelationships = async (athleteId: string) => {
      // Check if the athlete has any coach relationship
      const { data: coachRelationships, error: relationshipError } = await supabase
        .from('coach_athletes')
        .select('id, status')
        .eq('athlete_id', athleteId)
        .in('status', ['active', 'pending']);
      
      if (relationshipError) {
        console.error('Error checking coach relationships:', relationshipError);
      }
      
      // If athlete has any active or pending coach relationship, redirect to dashboard
      // Otherwise, redirect to the invite code entry page
      if (coachRelationships && coachRelationships.length > 0) {
        console.log('Athlete has existing coach relationships, redirecting to dashboard');
        navigate('/athlete');
      } else {
        console.log('Athlete has no coach relationships, redirecting to invite code entry');
        navigate('/invite-code-entry');
      }
    };

    handleAuthCallback();
  }, [navigate, inviteCode, isEmailVerification, isPasswordReset]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long');
      return;
    }

    setIsSubmitting(true);

    try {
      const { success, error } = await updatePassword(password);
      
      if (error) {
        console.error('Error resetting password:', error);
        setErrorMessage(error.message || 'Failed to reset password. Please try again.');
        setIsSubmitting(false);
        return;
      }
      
      if (success) {
        setResetSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error: any) {
      console.error('Error resetting password:', error);
      setErrorMessage(error.message || 'Failed to reset password. Please try again.');
      setIsSubmitting(false);
    }
  };

  const renderPasswordResetForm = () => {
    if (resetSuccess) {
      return (
        <div className="bg-green-900/50 border border-green-500 rounded-lg p-4 mb-4 text-center">
          <p className="text-green-200 font-semibold mb-2">Password reset successful!</p>
          <p className="text-green-100">Redirecting you to sign in...</p>
        </div>
      );
    }

    return (
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Reset Your Password</h2>
        
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {errorMessage}
          </div>
        )}
        
        <form onSubmit={handlePasswordReset} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-gray-800 text-white focus:ring-blue-500 focus:border-blue-500"
              required
              minLength={8}
            />
            <p className="mt-1 text-xs text-gray-500">
              At least 8 characters required
            </p>
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-gray-800 text-white focus:ring-blue-500 focus:border-blue-500"
              required
              minLength={8}
            />
          </div>
          
          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mr-2"></div>
                Processing...
              </>
            ) : 'Reset Password'}
          </button>
        </form>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex flex-col items-center justify-center p-4">
      <div className="fixed inset-0 bg-grid-pattern opacity-5"></div>
      <div className="fixed inset-0 bg-gradient-to-b from-blue-500/10 to-purple-600/10"></div>
      
      {showResetForm ? (
        <div className="relative z-10">
          {renderPasswordResetForm()}
        </div>
      ) : error ? (
        <div className="relative z-10 mb-8 max-w-md text-center">
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-4">
            <p>{error}</p>
          </div>
          <p>Redirecting you to the login page...</p>
        </div>
      ) : (
        <div className="relative z-10 animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-t-blue-600 border-b-blue-600 border-l-transparent border-r-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-400">Setting up your account...</p>
        </div>
      )}
    </div>
  );
};

export default AuthCallback;