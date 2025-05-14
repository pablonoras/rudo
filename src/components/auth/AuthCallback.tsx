/**
 * src/components/auth/AuthCallback.tsx
 * 
 * Callback handler for authentication flows. 
 * Updated to implement:
 * 1. Email verification
 * 2. Password reset
 * 3. Athlete workflow checking for coach relationships
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ensureProfileExists, supabase, updatePassword } from '../../lib/supabase';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role');
  const coachId = searchParams.get('coachId');
  const coachName = searchParams.get('coachName');
  const inviteCode = searchParams.get('inviteCode');
  const isNewCoach = searchParams.get('isNewCoach') === 'true';
  const isEmailVerification = searchParams.has('email-verification');
  const isPasswordReset = searchParams.has('type') && searchParams.get('type') === 'recovery';
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
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
            
            // Redirect based on role
            if (role === 'coach') {
              navigate('/coach/');
            } else if (role === 'athlete') {
              // Check for coach relationships
              await checkAthleteCoachRelationships(session.user.id);
            } else {
              // Default to coach dashboard if no specific role
              navigate('/coach/');
            }
          } else {
            // If no session, redirect to sign in
            navigate('/');
          }
          return;
        }
        
        // Password reset flow
        if (isPasswordReset) {
          // Show the password reset form
          setShowResetForm(true);
          setIsProcessing(false);
          return;
        }

        // Normal auth callback flow
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (session) {
          // Check if user already has a profile with a different role
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle();

          // Handle role conflict (user trying to sign in with a different role)
          if (existingProfile && 
              ((existingProfile.role === 'coach' && role === 'athlete') || 
               (existingProfile.role === 'athlete' && role === 'coach'))) {
            setError(`You already have a ${existingProfile.role} account. You cannot switch between coach and athlete roles.`);
            
            // Wait 5 seconds and then redirect to role selection page
            setTimeout(() => {
              navigate('/');
            }, 5000);
            
            return;
          }

          // Ensure a profile exists in the database for this user
          // This is especially important for OAuth sign-ins
          if (role === 'coach') {
            console.log('Setting up coach profile...');
            
            // First ensure the profile exists
            const profileCreated = await ensureProfileExists('coach');
            
            if (!profileCreated) {
              console.error('Failed to create coach profile');
            }
            
            // Update profile as coach
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ role: 'coach' })
              .eq('id', session.user.id);
            
            if (updateError) {
              console.error('Error updating profile role:', updateError);
            }
            
            // No longer automatically creating teams for coaches
            console.log('Coach profile set up, redirecting to dashboard');
            
            // Redirect to coach dashboard
            navigate('/coach/');
          } 
          else if (role === 'athlete') {
            console.log('Setting up athlete profile...');
            
            // First ensure the profile exists
            const profileCreated = await ensureProfileExists('athlete', null); // Pass null for invite_code
            
            if (!profileCreated) {
              console.error('Failed to create athlete profile');
              
              // Try direct insert as a fallback
              try {
                console.log('Attempting direct profile creation as fallback...');
                const { data: { user } } = await supabase.auth.getUser();
                
                if (user) {
                  const fullName = user.user_metadata?.full_name || user.user_metadata?.name || 'User';
                  const email = user.email || user.user_metadata?.email || '';
                  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
                  
                  const { error: insertError } = await supabase
                    .from('profiles')
                    .insert({
                      id: user.id,
                      role: 'athlete',
                      full_name: fullName,
                      email,
                      avatar_url: avatarUrl,
                    });
                    
                  if (insertError) {
                    console.error('Direct profile creation failed:', insertError);
                  } else {
                    console.log('Direct profile creation succeeded');
                  }
                }
              } catch (err) {
                console.error('Error in fallback profile creation:', err);
              }
            }
            
            // Update profile as athlete with null invite_code
            const { error: profileError } = await supabase
              .from('profiles')
              .update({ 
                role: 'athlete',
                invite_code: null  // Ensure athletes have no invite code
              })
              .eq('id', session.user.id);
            
            if (profileError) {
              console.error('Error updating profile:', profileError);
              // Check if this is a role change error
              if (profileError.message && profileError.message.includes('Role change')) {
                setError('You cannot change your role from coach to athlete. Please use your existing coach account.');
                setTimeout(() => navigate('/'), 5000);
                return;
              }
            }

            // Handle invite code if provided from the URL
            if (inviteCode) {
              console.log('Processing invite code from URL:', inviteCode);
              
              // First verify the profile exists in the database
              const { data: profileCheck } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', session.user.id)
                .single();
                
              if (!profileCheck) {
                console.error('Profile verification failed - profile not found in database');
                // Try one more time to create the profile
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  const fullName = user.user_metadata?.full_name || user.user_metadata?.name || 'User';
                  const email = user.email || user.user_metadata?.email || '';
                  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
                  
                  await supabase
                    .from('profiles')
                    .insert({
                      id: user.id,
                      role: 'athlete',
                      full_name: fullName,
                      email,
                      avatar_url: avatarUrl,
                    });
                }
              } else {
                console.log('Profile verified successfully');
              }
              
              try {
                // Call the RPC function to resolve the invite code and create the relationship
                console.log('Calling resolve_invite RPC with:', {
                  code: inviteCode,
                  athlete_user_id: session.user.id
                });
                
                const { data: resolveResult, error: resolveError } = await supabase
                  .rpc('resolve_invite', {
                    code: inviteCode,
                    athlete_user_id: session.user.id
                  });
                
                console.log('RPC response:', { resolveResult, resolveError });
                
                if (resolveError) {
                  console.error('Error resolving invite code:', resolveError);
                  setError(`Error resolving invite code: ${resolveError.message}`);
                  setTimeout(() => navigate('/athlete/'), 3000);
                } else if (!resolveResult || !resolveResult.success) {
                  console.error('Invalid invite code:', resolveResult?.message);
                  
                  // Try a direct query as a fallback
                  console.log('Trying direct query as fallback...');
                  const { data: coachData, error: coachError } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .eq('invite_code', inviteCode)
                    .eq('role', 'coach')
                    .maybeSingle();
                    
                  if (coachError) {
                    console.error('Error in fallback query:', coachError);
                  }
                  
                  if (coachData) {
                    console.log('Found coach via direct query:', coachData);
                    
                    // Create coach_athletes relationship manually
                    const { error: relationError } = await supabase
                      .from('coach_athletes')
                      .insert({
                        coach_id: coachData.id,
                        athlete_id: session.user.id,
                        status: 'pending'
                      });
                      
                    if (relationError) {
                      console.error('Error creating relationship:', relationError);
                    } else {
                      console.log('Successfully created relationship via fallback');
                      
                      // Store coach information in localStorage for displaying the pending status
                      localStorage.setItem('pendingCoachName', coachData.full_name);
                      localStorage.setItem('pendingCoachId', coachData.id);
                      localStorage.setItem('pendingJoinStatus', 'true');
                      
                      // Redirect to athlete dashboard
                      navigate('/athlete/');
                      return;
                    }
                  } else {
                    // Try case-insensitive match as a last resort
                    console.log('Trying case-insensitive match...');
                    const { data: allCoaches } = await supabase
                      .from('profiles')
                      .select('id, full_name, invite_code')
                      .eq('role', 'coach');
                    
                    const matchingCoach = allCoaches?.find(coach => 
                      coach.invite_code && coach.invite_code.toLowerCase() === inviteCode.toLowerCase()
                    );
                    
                    if (matchingCoach) {
                      console.log('Found coach via case-insensitive match:', matchingCoach);
                      
                      // Create coach_athletes relationship manually
                      const { error: relationError } = await supabase
                        .from('coach_athletes')
                        .insert({
                          coach_id: matchingCoach.id,
                          athlete_id: session.user.id,
                          status: 'pending'
                        });
                        
                      if (relationError) {
                        console.error('Error creating relationship:', relationError);
                      } else {
                        console.log('Successfully created relationship via case-insensitive match');
                        
                        // Store coach information in localStorage for displaying the pending status
                        localStorage.setItem('pendingCoachName', matchingCoach.full_name);
                        localStorage.setItem('pendingCoachId', matchingCoach.id);
                        localStorage.setItem('pendingJoinStatus', 'true');
                        
                        // Redirect to athlete dashboard
                        navigate('/athlete/');
                        return;
                      }
                    } else {
                      setError(`Invalid invite code: ${resolveResult?.message || 'Unknown error'}`);
                      setTimeout(() => navigate('/athlete/'), 3000);
                    }
                  }
                } else {
                  console.log('Successfully resolved invite code with result:', resolveResult);
                  
                  // Store coach information in localStorage for displaying the pending status
                  localStorage.setItem('pendingCoachName', resolveResult.coach_name);
                  localStorage.setItem('pendingCoachId', resolveResult.coach_id);
                  localStorage.setItem('pendingJoinStatus', 'true');
                  
                  // Redirect to athlete dashboard
                  navigate('/athlete/');
                  return;
                }
              } catch (error) {
                console.error('Error processing invite code:', error);
                setError(`Error processing invite code: ${error instanceof Error ? error.message : 'Unknown error'}`);
                setTimeout(() => navigate('/athlete/'), 3000);
              }
            }
            // Legacy direct coach ID handling (to be phased out)
            else if (coachId) {
              console.log('Associating athlete with coach via ID (legacy)...');
              
              // Create coach_athletes record to associate athlete with coach
              const { error: coachAthleteError } = await supabase
                .from('coach_athletes')
                .insert({
                  coach_id: coachId,
                  athlete_id: session.user.id,
                  status: 'active'
                });
              
              if (coachAthleteError) {
                console.error('Error associating with coach:', coachAthleteError);
                // Check if this is a role conflict error
                if (coachAthleteError.message && coachAthleteError.message.includes('coach cannot be added as an athlete')) {
                  setError('You cannot join as an athlete because you already have a coach account.');
                  setTimeout(() => navigate('/'), 5000);
                  return;
                }
              }
              
              // Store coach information in localStorage for future reference
              if (coachName) {
                localStorage.setItem('coachName', coachName);
                localStorage.setItem('coachId', coachId);
              }
              
              // Redirect to athlete dashboard
              navigate('/athlete/');
              return;
            }
            
            // Check if the athlete has any coach relationship
            await checkAthleteCoachRelationships(session.user.id);
          }
          else {
            // Default to coach dashboard if no specific role
            console.warn('No specific role provided, defaulting to coach role');
            
            const profileCreated = await ensureProfileExists('coach');
            
            if (!profileCreated) {
              console.error('Failed to create default coach profile');
            }
            
            navigate('/coach/');
          }
        } else {
          navigate('/');
        }
      } catch (error: any) {
        console.error('Error in auth callback:', error);
        
        // Check if this is a role-related error
        if (error.message && (
            error.message.includes('Role change') || 
            error.message.includes('coach cannot be added') || 
            error.message.includes('athlete cannot create'))) {
          setError(error.message);
          setTimeout(() => navigate('/'), 5000);
        } else {
          navigate('/');
        }
      } finally {
        if (!isPasswordReset) {
          setIsProcessing(false);
        }
      }
    };

    const checkAthleteCoachRelationships = async (athleteId: string) => {
      // If we came from an invite link, we already processed the invite code
      // Skip the invite code entry page and go directly to the dashboard
      if (inviteCode) {
        console.log('Came from invite link, redirecting directly to dashboard');
        navigate('/athlete/');
        return;
      }
      
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
        navigate('/athlete/');
      } else {
        console.log('Athlete has no coach relationships, redirecting to invite code entry');
        navigate('/invite-code-entry');
      }
    };

    handleAuthCallback();
  }, [navigate, role, coachId, coachName, inviteCode, isNewCoach, isEmailVerification, isPasswordReset]);

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

    setIsProcessing(true);

    try {
      const { success, error } = await updatePassword(password);
      
      if (error) {
        console.error('Error resetting password:', error);
        setErrorMessage(error.message || 'Failed to reset password. Please try again.');
        setIsProcessing(false);
        return;
      }
      
      if (success) {
        setResetSuccess(true);
        // Redirect to sign in after 3 seconds
        setTimeout(() => {
          navigate('/coach-signin');
        }, 3000);
      }
    } catch (error: any) {
      console.error('Error resetting password:', error);
      setErrorMessage(error.message || 'Failed to reset password. Please try again.');
      setIsProcessing(false);
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
          <p>Redirecting you back to the role selection page...</p>
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