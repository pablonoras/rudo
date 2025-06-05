/**
 * src/pages/auth/EmailConfirmation.tsx
 * 
 * Email confirmation page that users are redirected to after clicking
 * the confirmation link in their email.
 */

import { AlertCircle, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

type ConfirmationState = 'loading' | 'success' | 'error' | 'already_confirmed';

export function EmailConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>('loading');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // First, check if there are error parameters in the URL
        const urlError = searchParams.get('error');
        const errorCode = searchParams.get('error_code');
        const errorDescription = searchParams.get('error_description');
        
        console.log('URL parameters:', { urlError, errorCode, errorDescription });

        if (urlError) {
          // Handle specific error cases
          let errorMsg = 'Email confirmation failed.';
          
          if (errorCode === 'otp_expired') {
            errorMsg = 'The confirmation link has expired. Please request a new confirmation email.';
          } else if (errorCode === 'otp_invalid') {
            errorMsg = 'The confirmation link is invalid. Please check your email and try again.';
          } else if (errorDescription) {
            // Decode the error description
            errorMsg = decodeURIComponent(errorDescription.replace(/\+/g, ' '));
          }
          
          console.log('Error detected in URL:', { urlError, errorCode, errorMsg });
          setConfirmationState('error');
          setErrorMessage(errorMsg);
          return;
        }

        // Check current session first - this is the most reliable indicator
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error checking session:', sessionError);
          setConfirmationState('error');
          setErrorMessage('There was an error checking your session. Please try again.');
          return;
        }

        if (session && session.user.email_confirmed_at) {
          // User is confirmed and logged in - this is success!
          console.log('User is confirmed and logged in:', session.user);
          setConfirmationState('success');
          setUserRole(session.user.user_metadata?.role || 'athlete');
          setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User');
          return;
        }

        // If no active session, check if we have confirmation parameters
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        
        console.log('Email confirmation parameters:', { token, type });

        if (!token || type !== 'signup') {
          // No session and no valid confirmation parameters
          setConfirmationState('error');
          setErrorMessage('Invalid confirmation link. Please check your email and try again.');
          return;
        }

        // If we have parameters but no session yet, wait a moment for Supabase to process
        console.log('Waiting for Supabase to process confirmation...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check session again after waiting
        const { data: { session: newSession }, error: newSessionError } = await supabase.auth.getSession();
        
        if (newSessionError) {
          console.error('Error checking new session:', newSessionError);
          setConfirmationState('error');
          setErrorMessage('There was an error confirming your email. Please try again.');
          return;
        }

        if (newSession && newSession.user.email_confirmed_at) {
          // Confirmation successful after waiting
          console.log('Email confirmed successfully after waiting:', newSession.user);
          setConfirmationState('success');
          setUserRole(newSession.user.user_metadata?.role || 'athlete');
          setUserName(newSession.user.user_metadata?.full_name || newSession.user.email?.split('@')[0] || 'User');
        } else {
          // Still no confirmed session
          setConfirmationState('error');
          setErrorMessage('Email confirmation failed. The link may be expired or invalid.');
        }

      } catch (error: any) {
        console.error('Error during email confirmation:', error);
        setConfirmationState('error');
        setErrorMessage(error.message || 'An unexpected error occurred during confirmation.');
      }
    };

    handleEmailConfirmation();
  }, [searchParams]);

  const handleContinue = async () => {
    setIsRedirecting(true);
    
    try {
      // Redirect to role selection page instead of dashboard
      navigate('/auth');
    } catch (error) {
      console.error('Error redirecting:', error);
      // Fallback redirect
      navigate('/auth');
    }
  };

  const renderContent = () => {
    switch (confirmationState) {
      case 'loading':
        return (
          <div className="text-center">
            <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Confirming Your Email
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we confirm your email address...
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Email Confirmed!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Great{userName ? ` ${userName}` : ''}! Your email has been successfully confirmed. 
              You can now sign in with your email and password to access your {userRole} account.
            </p>
            <button
              onClick={handleContinue}
              disabled={isRedirecting}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isRedirecting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Redirecting...
                </>
              ) : (
                <>
                  Sign In Now
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </button>
          </div>
        );

      case 'already_confirmed':
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
              <CheckCircle className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Already Confirmed
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Welcome back{userName ? ` ${userName}` : ''}! Your email was already confirmed. 
              You can sign in to access your {userRole} account.
            </p>
            <button
              onClick={handleContinue}
              disabled={isRedirecting}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isRedirecting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Redirecting...
                </>
              ) : (
                <>
                  Sign In Now
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
              <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Confirmation Failed
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {errorMessage || 'We were unable to confirm your email address.'}
            </p>
            
            {/* Show specific guidance based on error type */}
            {errorMessage?.includes('expired') && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                  <strong>Need a new confirmation email?</strong>
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Go to the sign-in page and try to log in with your email and password. 
                  If your email isn't confirmed yet, you'll be prompted to request a new confirmation email.
                </p>
              </div>
            )}
            
            <div className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This could happen if:
              </p>
              <ul className="text-sm text-gray-500 dark:text-gray-400 list-disc list-inside space-y-1">
                <li>The confirmation link has expired (links expire after 24 hours)</li>
                <li>The link has already been used</li>
                <li>The link is invalid or corrupted</li>
              </ul>
            </div>
            <div className="mt-6 space-x-3">
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Try Signing In
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign Up Again
              </Link>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {renderContent()}
        </div>
      </div>
      
      {/* Footer with support link */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Having trouble? {' '}
          <Link to="/contact" className="text-blue-600 dark:text-blue-400 hover:text-blue-500">
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  );
} 