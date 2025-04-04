import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ensureProfileExists, supabase } from '../../lib/supabase';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role');
  const coachId = searchParams.get('coachId');
  const coachName = searchParams.get('coachName');
  const isNewCoach = searchParams.get('isNewCoach') === 'true';
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
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
              navigate('/choose-role');
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
          else if (role === 'athlete' && coachId) {
            console.log('Setting up athlete profile...');
            
            // First ensure the profile exists
            const profileCreated = await ensureProfileExists('athlete');
            
            if (!profileCreated) {
              console.error('Failed to create athlete profile');
            }
            
            // Update profile as athlete
            const { error: profileError } = await supabase
              .from('profiles')
              .update({ role: 'athlete' })
              .eq('id', session.user.id);
            
            if (profileError) {
              console.error('Error updating profile:', profileError);
              // Check if this is a role change error
              if (profileError.message && profileError.message.includes('Role change')) {
                setError('You cannot change your role from coach to athlete. Please use your existing coach account.');
                setTimeout(() => navigate('/choose-role'), 5000);
                return;
              }
            }

            // Create coach_athletes record to associate athlete with coach
            const { error: coachAthleteError } = await supabase
              .from('coach_athletes')
              .insert({
                coach_id: coachId,
                athlete_id: session.user.id
              });
            
            if (coachAthleteError) {
              console.error('Error associating with coach:', coachAthleteError);
              // Check if this is a role conflict error
              if (coachAthleteError.message && coachAthleteError.message.includes('coach cannot be added as an athlete')) {
                setError('You cannot join as an athlete because you already have a coach account.');
                setTimeout(() => navigate('/choose-role'), 5000);
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
          navigate('/choose-role');
        }
      } catch (error: any) {
        console.error('Error in auth callback:', error);
        
        // Check if this is a role-related error
        if (error.message && (
            error.message.includes('Role change') || 
            error.message.includes('coach cannot be added') || 
            error.message.includes('athlete cannot create'))) {
          setError(error.message);
          setTimeout(() => navigate('/choose-role'), 5000);
        } else {
          navigate('/choose-role');
        }
      }
    };

    handleAuthCallback();
  }, [navigate, role, coachId, coachName, isNewCoach]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      {error ? (
        <div className="mb-8 max-w-md text-center">
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-4">
            <p>{error}</p>
          </div>
          <p>Redirecting you back to the role selection page...</p>
        </div>
      ) : (
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-t-blue-600 border-b-blue-600 border-l-transparent border-r-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-xl font-medium">Setting up your account...</p>
        </div>
      )}
    </div>
  );
};

export default AuthCallback;