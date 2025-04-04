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
            
            // Create a default team for the coach
            await createCoachTeam(session.user.id);
            
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

            // Create team_members record to associate with coach
            const { error: teamError } = await supabase
              .from('team_members')
              .insert({
                team_id: await getCoachTeamId(coachId),
                athlete_id: session.user.id
              });
            
            if (teamError) {
              console.error('Error associating with coach:', teamError);
              // Check if this is a role conflict error
              if (teamError.message && teamError.message.includes('coach cannot be added as an athlete')) {
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

    // Helper function to get or create a team for the coach
    const getCoachTeamId = async (coachId: string): Promise<string> => {
      // Check if coach has a team
      const { data: teams } = await supabase
        .from('teams')
        .select('id')
        .eq('coach_id', coachId)
        .limit(1);
      
      // If coach has a team, return its ID
      if (teams && teams.length > 0) {
        return teams[0].id;
      }
      
      // If coach doesn't have a team, create one
      const { data: coach } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', coachId)
        .single();
      
      const teamName = coach ? `${coach.full_name}'s Team` : 'New Team';
      
      const { data: newTeam, error } = await supabase
        .from('teams')
        .insert({
          coach_id: coachId,
          name: teamName
        })
        .select('id')
        .single();
      
      if (error) {
        console.error('Error creating team for coach:', error);
        throw error;
      }
      
      return newTeam.id;
    };

    // Helper function to create a team for a new coach
    const createCoachTeam = async (coachId: string): Promise<void> => {
      try {
        // Check if coach already has a team
        const { data: teams } = await supabase
          .from('teams')
          .select('id')
          .eq('coach_id', coachId)
          .limit(1);
        
        // If coach already has a team, don't create a new one
        if (teams && teams.length > 0) {
          console.log('Coach already has a team, skipping team creation');
          return;
        }
        
        // Get the coach's profile data
        const { data: coach } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', coachId)
          .single();
          
        if (!coach) {
          console.error('Coach profile not found');
          return;
        }
          
        const teamName = `${coach.full_name}'s Team`;
        
        // Create a new team for the coach
        const { error } = await supabase
          .from('teams')
          .insert({
            coach_id: coachId,
            name: teamName
          });
        
        if (error) {
          console.error('Error creating coach team:', error);
        } else {
          console.log('Successfully created team for coach:', teamName);
        }
      } catch (err) {
        console.error('Error in createCoachTeam:', err);
      }
    };

    handleAuthCallback();
  }, [navigate, role, coachId, coachName, isNewCoach]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      {error ? (
        <div className="mb-8 max-w-md text-center">
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-4">
            <h2 className="text-xl font-semibold mb-2">Role Conflict</h2>
            <p>{error}</p>
          </div>
          <p className="text-gray-400">Redirecting to role selection page in a few seconds...</p>
        </div>
      ) : (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          <p className="ml-4">Completing sign-in process...</p>
        </div>
      )}
    </div>
  );
};

export default AuthCallback;