import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role');
  const coachId = searchParams.get('coachId');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session) {
          // Set user role (athlete or coach) and handle coach association
          if (role === 'athlete' && coachId) {
            // Update profile as athlete
            const { error: profileError } = await supabase
              .from('profiles')
              .update({ role: 'athlete' })
              .eq('id', session.user.id);
            
            if (profileError) {
              console.error('Error updating profile:', profileError);
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
            }
            
            // Redirect to athlete dashboard
            navigate('/athlete/');
          } else {
            // Default to coach for backward compatibility
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ role: 'coach' })
              .eq('id', session.user.id);
            
            if (updateError) {
              console.error('Error updating profile role:', updateError);
            }
            
            // Redirect to coach dashboard
            navigate('/coach/');
          }
        } else {
          navigate('/role-selection');
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        navigate('/role-selection');
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

    handleAuthCallback();
  }, [navigate, role, coachId]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
    </div>
  );
};

export default AuthCallback;