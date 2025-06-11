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
import { handleEmailVerification } from '../../lib/auth-email-verification';
import type { UserRole } from '../../lib/supabase';
import { ensureProfileExists, getCurrentProfile, redirectBasedOnRole, supabase, updatePassword } from '../../lib/supabase';

// Helper function to handle athlete with invite code
async function handleAthleteWithInviteCode(userId: string, inviteCode: string) {
  console.log('Processing athlete with invite code:', inviteCode);
  
  // Ensure profile exists with the correct role
  await ensureProfileExists('athlete', inviteCode);
  
  // Redirect to athlete dashboard
  return redirectBasedOnRole(userId);
}

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('inviteCode');
  const urlRole = searchParams.get('role') as UserRole | null;
  const isEmailVerification = searchParams.has('email-verification');
  const isPasswordReset = searchParams.has('type') && searchParams.get('type') === 'recovery';
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsSubmitting] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Log all URL parameters when component mounts
  useEffect(() => {
    console.log('AuthCallback mounted with URL parameters:', {
      raw: window.location.href,
      isEmailVerification,
      isPasswordReset,
      inviteCode,
      urlRole,
      type: searchParams.get('type'),
      allParams: Object.fromEntries(searchParams.entries())
    });
  }, []);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Email verification flow
        if (isEmailVerification) {
          console.log('Email verification flow initiated with params:', {
            hasInviteCode: !!inviteCode,
            urlRole,
            fullUrl: window.location.href
          });
          
          // Use our dedicated email verification handler
          const result = await handleEmailVerification();
          console.log('Email verification result:', result);
          
          if (!result.success) {
            console.error('Email verification failed:', result.error);
            throw new Error(result.error || 'Email verification failed');
          }
          
          // If successful, redirect based on the role
          if (result.userId) {
            console.log('Email verification successful, redirecting user with ID:', result.userId);
            await redirectBasedOnRole(result.userId);
          } else {
            console.error('Missing userId in successful email verification result');
            navigate('/login');
          }
          return;
        }
        
        // Password reset flow
        if (isPasswordReset) {
          console.log('Password reset flow initiated');
          // Show the password reset form
          setShowResetForm(true);
          setIsSubmitting(false);
          return;
        }

        // Normal auth callback flow
        console.log('Normal OAuth callback flow initiated');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error in normal auth flow:', sessionError);
          throw sessionError;
        }
        
        console.log('Session check result:', {
          hasSession: !!session,
          userId: session?.user?.id
        });
        
        if (session) {
          // Check if user already has a profile with a different role
          try {
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('id, role')
              .eq('id', session.user.id)
              .maybeSingle();
            
            // If profile exists and role is different from requested role
            if (existingProfile && urlRole && existingProfile.role !== urlRole) {
              console.log(`Role mismatch: User is ${existingProfile.role} but trying to login as ${urlRole}`);
              
              // Redirect to auth page with error message
              const errorMessage = existingProfile.role === 'coach' 
                ? 'You have a coach account. Please use coach login.' 
                : 'You have an athlete account. Please use athlete login.';
              
              localStorage.setItem('auth_error', errorMessage);
              window.location.href = '/auth';
              return;
            }
          } catch (e) {
            console.error('Error checking existing profile:', e);
          }
          
          // Determine user role through multiple sources, in priority order:
          // 1. URL parameter (highest priority)
          // 2. localStorage from OAuth
          // 3. User metadata
          // 4. Default (lowest priority)
          let role: UserRole | undefined;
          
          // Check URL first (highest priority)
          if (urlRole && (urlRole === 'coach' || urlRole === 'athlete')) {
            role = urlRole;
            console.log('Using role from URL:', role);
          } else {
            // Check localStorage for OAuth flows
            try {
              const storedUserData = localStorage.getItem('oauthUserData');
              console.log('OAuth user data in localStorage:', storedUserData ? 'present' : 'absent');
              
              if (storedUserData) {
                const userData = JSON.parse(storedUserData);
                if (userData.role) {
                  role = userData.role as UserRole;
                  console.log('Using role from localStorage:', role);
                }
                // Don't remove the data yet, let ensureProfileExists handle that
              } else {
                // Check user metadata if no localStorage data
                const { data: { user } } = await supabase.auth.getUser();
                console.log('User metadata for role extraction:', user?.user_metadata);
                
                if (user?.user_metadata?.role) {
                  role = user.user_metadata.role as UserRole;
                  console.log('Using role from user metadata:', role);
                }
              }
            } catch (e) {
              console.error('Error determining user role:', e);
            }
          }
          
          console.log('Final role determination:', role || 'undefined (will use default)');
          
          // Handle the callback based on determined role and invite code
          if (role === 'coach') {
            // For coaches, ensure profile exists and redirect to coach dashboard
            // Never process invite codes for coaches
            console.log('Handling coach OAuth callback');
            await ensureProfileExists('coach');
            navigate('/coach');
          } else if (inviteCode) {
            // For athletes with invite code
            console.log('Handling athlete with invite code:', inviteCode);
            await handleAthleteWithInviteCode(session.user.id, inviteCode);
          } else {
            // For all other cases, ensure profile exists with the determined role
            console.log('Handling general OAuth callback with role:', role);
            const profile = await getCurrentProfile();
            console.log('Current profile check result:', !!profile);
            
            if (!profile) {
              // If no profile exists yet, create one with the determined role
              console.log('No profile found, creating with role:', role);
              const success = await ensureProfileExists(role);
              console.log('Profile creation result:', success ? 'success' : 'failed');
            }
            
            await redirectBasedOnRole(session.user.id);
          }
        } else {
          console.log('No session found, redirecting to login');
          navigate('/login');
        }
      } catch (error: any) {
        console.error('Error in auth callback:', error);
        setError(error.message || 'An error occurred during authentication');
        setIsSubmitting(false);
      }
    };

    handleAuthCallback();
  }, [navigate, inviteCode, isEmailVerification, isPasswordReset, urlRole, searchParams]);

  // Handle password reset submission
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long');
      return;
    }
    
    try {
      setIsSubmitting(true);
      console.log('Attempting password reset');
      
      // Update the password using the updatePassword function
      const { error } = await updatePassword(password);
      
      if (error) {
        console.error('Password reset error:', error);
        throw error;
      }
      
      console.log('Password reset successful');
      setResetSuccess(true);
      setTimeout(() => {
        // Redirect to login page after successful password reset
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      setErrorMessage(error.message || 'Failed to reset password');
      setIsSubmitting(false);
    }
  };

  // If there was an error, show it
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">Authentication Error</h1>
          <p className="text-center text-red-500 mb-4">{error}</p>
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Password reset form
  if (showResetForm) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
            Reset Your Password
          </h1>
          
          {resetSuccess ? (
            <div className="text-center">
              <p className="text-green-500 mb-4">Password updated successfully!</p>
              <p className="text-gray-600 dark:text-gray-300">Redirecting to login page...</p>
            </div>
          ) : (
            <form onSubmit={handlePasswordReset}>
              {errorMessage && (
                <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                  {errorMessage}
                </div>
              )}
              
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Reset Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Processing state
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Authenticating...</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-4">Please wait while we verify your credentials.</p>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;