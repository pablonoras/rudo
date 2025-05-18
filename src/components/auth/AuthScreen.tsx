/**
 * src/components/auth/AuthScreen.tsx
 * 
 * Shared authentication screen component that provides email/password sign-in
 * with Google authentication as an alternative option.
 */

import { ArrowLeft, AtSign, Loader2 } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail, signInWithEmail, signUpWithEmail, updatePassword } from '../../lib/supabase';

type AuthMode = 'signin' | 'signup' | 'forgot-password' | 'check-email' | 'reset-password';

interface AuthScreenProps {
  role: 'coach' | 'athlete';
  title: string;
  subtitle: string;
  handleGoogleLogin: () => Promise<void>;
  inviteCode?: string;
  coachName?: string | null;
}

const AuthScreen = ({ role, title, handleGoogleLogin, inviteCode, coachName }: AuthScreenProps) => {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [isLoading, setIsLoading] = useState(false);
  
  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  
  // Handle email sign in
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsLoading(true);
    
    try {
      const { data, error } = await signInWithEmail(email, password);
      
      if (error) {
        console.error('Error signing in:', error);
        setFormError(error instanceof Error ? error.message : 'Invalid email or password. Please try again.');
        return;
      }
      
      // If successful, navigate to appropriate dashboard
      if (data?.user) {
        if (role === 'coach') {
          navigate('/coach/');
        } else {
          // For athletes, auth callback will handle redirect based on coach relationships
          const redirectUrl = `/auth/callback?role=athlete${inviteCode ? `&inviteCode=${inviteCode}` : ''}`;
          console.log('Redirecting to:', redirectUrl);
          window.location.href = redirectUrl;
        }
      }
    } catch (error: any) {
      console.error('Error signing in:', error);
      setFormError(error.message || 'Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle email sign up
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }
    
    // Validate password strength
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters long');
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log(`Signing up with email for ${role}${inviteCode ? ' with invite code: ' + inviteCode : ''}`);
      
      const { error } = await signUpWithEmail(
        email,
        password,
        role,
        firstName,
        lastName,
        inviteCode
      );
      
      if (error) {
        console.error('Error signing up:', error);
        setFormError(error instanceof Error ? error.message : 'Failed to create account. Please try again.');
        return;
      }
      
      // Show check email screen
      setAuthMode('check-email');
    } catch (error: any) {
      console.error('Error signing up:', error);
      setFormError(error.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle forgot password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!email.trim()) {
      setFormError('Please enter your email address');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { success, error } = await sendPasswordResetEmail(email);
      
      if (error) {
        console.error('Error sending reset email:', error);
        setFormError(error instanceof Error ? error.message : 'Failed to send reset email. Please try again.');
        return;
      }
      
      if (success) {
        // Show check email screen
        setAuthMode('check-email');
      }
    } catch (error: any) {
      console.error('Error resetting password:', error);
      setFormError(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle password reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }
    
    // Validate password strength
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters long');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { success, error } = await updatePassword(password);
      
      if (error) {
        console.error('Error resetting password:', error);
        setFormError(error instanceof Error ? error.message : 'Failed to reset password. Please try again.');
        return;
      }
      
      if (success) {
        // Redirect to sign in
        setAuthMode('signin');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      console.error('Error resetting password:', error);
      setFormError(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render different content based on the current auth mode
  const renderContent = (): ReactNode => {
    switch (authMode) {
      case 'signin':
        return (
          <>
            <h2 className="text-2xl font-bold mb-6 text-center">Sign In</h2>
            
            {formError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                {formError}
              </div>
            )}
            
            {inviteCode && (
              <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-200 text-sm">
                {coachName 
                  ? `You have been invited to join Coach ${coachName}'s team. Sign in or create an account to continue.`
                  : "You have been invited to join a coach. Sign in or create an account to continue."
                }
              </div>
            )}
            
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-gray-800 text-white focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-gray-800 text-white focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setAuthMode('forgot-password')}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Forgot password?
                </button>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                Don't have an account?{' '}
                <button
                  onClick={() => setAuthMode('signup')}
                  className="text-blue-400 hover:text-blue-300"
                >
                  Sign Up
                </button>
              </p>
            </div>
            
            <div className="relative flex items-center justify-center my-6">
              <div className="border-t border-gray-600 w-full absolute"></div>
              <span className="bg-gray-900 px-3 relative text-gray-400 text-sm">or</span>
            </div>
            
            <button
              onClick={handleGoogleLogin}
              className="w-full bg-white text-black hover:bg-blue-600 hover:text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center shadow-md"
            >
              <img 
                src="https://www.google.com/favicon.ico" 
                alt="Google" 
                className="w-5 h-5 mr-2"
              />
              Sign in with Google
            </button>
          </>
        );
        
      case 'signup':
        return (
          <>
            <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>
            
            {formError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                {formError}
              </div>
            )}
            
            {inviteCode && (
              <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-200 text-sm">
                {coachName 
                  ? `You have been invited to join Coach ${coachName}'s team. Create an account to continue.`
                  : "You have been invited to join a coach. Create an account to continue."
                }
              </div>
            )}
            
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-1">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-gray-800 text-white focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-1">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-gray-800 text-white focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-gray-800 text-white focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                  Password
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
                  Confirm Password
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
                disabled={isLoading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                Already have an account?{' '}
                <button
                  onClick={() => setAuthMode('signin')}
                  className="text-blue-400 hover:text-blue-300"
                >
                  Sign In
                </button>
              </p>
            </div>
            
            <div className="relative flex items-center justify-center my-6">
              <div className="border-t border-gray-600 w-full absolute"></div>
              <span className="bg-gray-900 px-3 relative text-gray-400 text-sm">or</span>
            </div>
            
            <button
              onClick={handleGoogleLogin}
              className="w-full bg-white text-black hover:bg-blue-600 hover:text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center shadow-md"
            >
              <img 
                src="https://www.google.com/favicon.ico" 
                alt="Google" 
                className="w-5 h-5 mr-2"
              />
              Sign up with Google
            </button>
          </>
        );
        
      case 'forgot-password':
        return (
          <>
            <h2 className="text-2xl font-bold mb-6 text-center">Reset Password</h2>
            
            {formError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                {formError}
              </div>
            )}
            
            <p className="mb-4 text-gray-400 text-sm">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-gray-800 text-white focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <button
                onClick={() => setAuthMode('signin')}
                className="text-sm text-gray-400 hover:text-gray-300"
              >
                Back to Sign In
              </button>
            </div>
          </>
        );
        
      case 'check-email':
        return (
          <>
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                <AtSign className="w-8 h-8 text-blue-400" />
              </div>
              
              <h2 className="text-2xl font-bold mb-4">Check Your Email</h2>
              
              <p className="text-gray-400 text-sm mb-6">
                We've sent an email to <strong>{email}</strong>. 
                Please follow the instructions to {
                  // Type-safe comparison - cast strings to specific auth mode type
                  authMode === 'forgot-password' as unknown as string ? 'reset your password' : 'verify your account'
                }.
              </p>
              
              <div className="mt-8">
                <button
                  onClick={() => setAuthMode('signin')}
                  className="text-blue-400 hover:text-blue-300"
                >
                  Return to Sign In
                </button>
              </div>
            </div>
          </>
        );
        
      case 'reset-password':
        return (
          <>
            <h2 className="text-2xl font-bold mb-6 text-center">Set New Password</h2>
            
            {formError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                {formError}
              </div>
            )}
            
            <form onSubmit={handleResetPassword} className="space-y-4">
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
                disabled={isLoading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
              </button>
            </form>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex flex-col">
      <div className="fixed inset-0 bg-grid-pattern opacity-5"></div>
      <div className="fixed inset-0 bg-gradient-to-b from-blue-500/10 to-purple-600/10"></div>
      
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
          <div className="max-w-md mx-auto">
            <h1 className="text-4xl sm:text-5xl font-bold text-center mb-6">
              {title}
            </h1>
            
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300 shadow-xl">
              {renderContent()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuthScreen; 