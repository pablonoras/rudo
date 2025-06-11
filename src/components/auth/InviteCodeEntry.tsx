/**
 * src/components/auth/InviteCodeEntry.tsx
 * 
 * Updated: Enhanced UI to prominently display coach name with fancy icons and profile picture.
 * Component for athletes to enter a coach invitation code after logging in.
 * Shown to athletes who don't have any coach relationship yet.
 */

import { Loader2, UserCheck, UserPlus, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../../contexts/ProfileContext';
import { supabase } from '../../lib/supabase';

const InviteCodeEntry = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [inviteCode, setInviteCode] = useState('');
  const [coachName, setCoachName] = useState('');
  const [coachAvatar, setCoachAvatar] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCodeValid, setIsCodeValid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If user is not logged in, redirect to home
    if (!profile) {
      navigate('/');
      return;
    }
    
    // If user is a coach, redirect to coach dashboard
    if (profile.role === 'coach') {
      navigate('/coach');
      return;
    }
    
    // Only athletes should see this page
    if (profile.role !== 'athlete') {
      navigate('/');
    }
  }, [profile, navigate]);

  // Validate the invite code
  const validateInviteCode = async (code: string) => {
    if (!code.trim()) {
      setIsCodeValid(false);
      setCoachName('');
      setCoachAvatar(null);
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      // Check if the code exists and fetch the coach info
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('invite_code', code)
        .eq('role', 'coach')
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        setIsCodeValid(true);
        setCoachName(data.full_name);
        setCoachAvatar(data.avatar_url);
      } else {
        setIsCodeValid(false);
        setCoachName('');
        setCoachAvatar(null);
        setError('Invalid invitation code. Please check and try again.');
      }
    } catch (err) {
      console.error('Error validating invite code:', err);
      setIsCodeValid(false);
      setCoachName('');
      setCoachAvatar(null);
      setError('An error occurred while validating the code. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  // Handle code input change
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCode = e.target.value.toLowerCase().replace(/\s/g, '');
    setInviteCode(newCode);
    
    // Clear validation state
    setIsCodeValid(false);
    setCoachName('');
    setCoachAvatar(null);
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

  // Submit the invite code
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCodeValid || !profile) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Call the RPC function to resolve the invite code
      const { data: resolveResult, error: resolveError } = await supabase
        .rpc('resolve_invite', {
          code: inviteCode,
          athlete_user_id: profile.id
        });

      if (resolveError) {
        console.error('Error resolving invite code:', resolveError);
        setError('Failed to process invitation. Please try again.');
        return;
      }

      if (!resolveResult || !resolveResult.success) {
        setError('Invalid invitation code. Please check and try again.');
        return;
      }

      // Store coach information in localStorage
      localStorage.setItem('pendingCoachName', resolveResult.coach_name);
      localStorage.setItem('pendingCoachId', resolveResult.coach_id);
      localStorage.setItem('pendingJoinStatus', 'true');

      // Redirect to athlete dashboard
      navigate('/athlete/');
    } catch (err) {
      console.error('Error submitting invite code:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            {/* Enhanced header with icon */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 rounded-full border border-blue-500/30">
                  <UserPlus className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Join Your Coach
            </h1>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 text-center mb-8">
              Enter the invitation code provided by your coach to start training together.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Invitation Code
                </label>
                <div className="relative">
                  <input
                    id="inviteCode"
                    type="text"
                    value={inviteCode}
                    onChange={handleCodeChange}
                    onBlur={handleCodeBlur}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter your invitation code"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    autoFocus
                  />
                  {isValidating && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                    </div>
                  )}
                </div>
                
                {error && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                )}
                
                {isCodeValid && coachName && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        Ready to join Coach {coachName}!
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={!isCodeValid || isSubmitting}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 dark:disabled:bg-blue-800 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      <span>{coachName ? `Join ${coachName}` : 'Join Coach'}</span>
                    </div>
                  )}
                </button>
              </div>
            </form>
            
            <div className="mt-6 text-center">
              <button 
                onClick={() => navigate('/')}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteCodeEntry; 