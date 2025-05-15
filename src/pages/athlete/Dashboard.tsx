/**
 * src/pages/athlete/Dashboard.tsx
 * 
 * Athlete Dashboard main page showing workouts and program information.
 * Updated to include week navigation, assigned programs list, and display all assigned programs in the calendar.
 * Athletes can view all their assigned programs and navigate through days of the week.
 */

import { addDays, format, isToday, subDays } from 'date-fns';
import { Calendar, CheckCircle, ChevronLeft, ChevronRight, ClockIcon, MoreHorizontal, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AssignedProgram, AssignedPrograms } from '../../components/athlete/AssignedPrograms';
import { WeekNavigation } from '../../components/athlete/WeekNavigation';
import { useProfile } from '../../contexts/ProfileContext';
import { supabase } from '../../lib/supabase';
import { useWorkoutStore } from '../../lib/workout';

// Type for coach connection
type CoachConnection = {
  id: string;
  coach_id: string;
  status: 'pending' | 'active' | 'inactive' | 'declined';
  coach: {
    full_name: string;
    avatar_url: string | null;
  };
};

function WorkoutCard({ workout }: { workout: any }) {
  const [isCompleted, setIsCompleted] = useState(false);

  // Check if we have a valid color value
  const hasValidColor = workout.color && 
    (workout.color.startsWith('#') || 
     workout.color.startsWith('rgb') || 
     workout.color.startsWith('hsl'));

  // Get background color based on type if no direct color is provided
  const getBackgroundColor = (type: string) => {
    const colors = {
      warmup: 'bg-yellow-50 dark:bg-yellow-900/10',
      strength: 'bg-red-50 dark:bg-red-900/10',
      wod: 'bg-blue-50 dark:bg-blue-900/10',
      cooldown: 'bg-green-50 dark:bg-green-900/10',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-50 dark:bg-gray-800';
  };

  // Get border color based on workout type
  const getBorderColor = (type: string) => {
    const colors = {
      warmup: 'border-yellow-300 dark:border-yellow-800',
      strength: 'border-red-300 dark:border-red-800',
      wod: 'border-blue-300 dark:border-blue-800',
      cooldown: 'border-green-300 dark:border-green-800',
    };
    return colors[type as keyof typeof colors] || 'border-gray-200 dark:border-gray-700';
  };

  // Create style object for direct color values
  const cardStyle = hasValidColor ? {
    backgroundColor: workout.color,
    color: '#fff', // Use white text for better contrast on colored backgrounds
  } : {};

  console.log('Workout color:', workout.color, 'Type:', workout.type, 'Has valid color:', hasValidColor);

  return (
    <div 
      className={`${!hasValidColor ? getBackgroundColor(workout.type) : ''} rounded-lg shadow-sm border ${
        isCompleted ? 'border-green-500 dark:border-green-400' : getBorderColor(workout.type)
      }`}
      style={cardStyle}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className={`text-lg font-medium ${hasValidColor ? '' : 'text-gray-900 dark:text-gray-100'}`}>
              {workout.name}
            </h3>
          </div>
          <button
            onClick={() => setIsCompleted(!isCompleted)}
            className={`p-1 rounded-full transition-colors ${
              isCompleted
                ? 'text-green-500 dark:text-green-400'
                : 'text-gray-400 hover:text-gray-500 dark:hover:text-gray-300'
            }`}
          >
            <CheckCircle className="h-6 w-6" />
          </button>
        </div>
        
        <div className={`mt-2 text-sm ${hasValidColor ? '' : 'text-gray-600 dark:text-gray-400'} whitespace-pre-wrap`}>
          {workout.description}
        </div>
        
        {workout.notes && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <h4 className={`text-sm font-medium ${hasValidColor ? '' : 'text-gray-700 dark:text-gray-300'} mb-1`}>Notes:</h4>
            <p className={`text-sm ${hasValidColor ? '' : 'text-gray-600 dark:text-gray-400'} whitespace-pre-wrap`}>
              {workout.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function AthleteDashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { programs } = useWorkoutStore();
  const { profile } = useProfile();
  const [coachConnections, setCoachConnections] = useState<CoachConnection[]>([]);
  const [isLoadingCoach, setIsLoadingCoach] = useState(true);
  const [unsubscribingCoach, setUnsubscribingCoach] = useState<string | null>(null);
  const [showCoachActions, setShowCoachActions] = useState<{[key: string]: boolean}>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Pending coach invitation state
  const [pendingCoachName, setPendingCoachName] = useState<string | null>(null);
  const [hasPendingInvite, setHasPendingInvite] = useState(false);

  // Assigned programs state
  const [assignedPrograms, setAssignedPrograms] = useState<AssignedProgram[]>([]);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [dayWorkouts, setDayWorkouts] = useState<any[]>([]);

  const navigateDay = (direction: 'prev' | 'next') => {
    setSelectedDate(direction === 'prev' ? subDays(selectedDate, 1) : addDays(selectedDate, 1));
  };

  // Function to refresh coach connections
  const fetchCoachConnections = async () => {
    if (!profile) return;
    
    try {
      setIsLoadingCoach(true);
      console.log('Fetching coach connections for athlete:', profile.id);
      
      // Use the proper foreign key reference to disambiguate the relationship
      const { data, error } = await supabase
        .from('coach_athletes')
        .select(`
          id,
          coach_id,
          status,
          coach:profiles!coach_athletes_coach_id_fkey(full_name, avatar_url)
        `)
        .eq('athlete_id', profile.id)
        .not('status', 'eq', 'inactive'); // Don't show inactive coaches
      
      if (error) {
        console.error('Error fetching coach connections:', error);
        throw error;
      }
      
      console.log('Coach connections data:', data);
      setCoachConnections(data || []);
      
      // Check if we have a pending coach invitation from localStorage
      const storedCoachName = localStorage.getItem('pendingCoachName');
      const hasPendingStatus = localStorage.getItem('pendingJoinStatus') === 'true';
      const pendingCoachId = localStorage.getItem('pendingCoachId');
      
      console.log('Pending coach data from localStorage:', { 
        storedCoachName, 
        hasPendingStatus, 
        pendingCoachId 
      });
      
      // Only show the pending message if we don't already have this coach in our connections
      if (storedCoachName && hasPendingStatus && pendingCoachId) {
        // Check if this coach relationship is now active or no longer pending
        const coachRelationship = data?.find(conn => 
          conn.coach_id === pendingCoachId
        );
        
        console.log('Found coach relationship:', coachRelationship);
        
        if (coachRelationship) {
          if (coachRelationship.status === 'active') {
            // Coach has approved the request, clear localStorage
            console.log('Coach has approved the request, clearing localStorage');
            localStorage.removeItem('pendingCoachName');
            localStorage.removeItem('pendingCoachId');
            localStorage.removeItem('pendingJoinStatus');
            setHasPendingInvite(false);
            setPendingCoachName(null);
          } else if (coachRelationship.status === 'pending') {
            // Still pending, show the message
            setPendingCoachName(storedCoachName);
            setHasPendingInvite(true);
          } else {
            // Status is something else (declined, etc.), clear localStorage
            localStorage.removeItem('pendingCoachName');
            localStorage.removeItem('pendingCoachId');
            localStorage.removeItem('pendingJoinStatus');
            setHasPendingInvite(false);
            setPendingCoachName(null);
          }
        } else {
          // Coach relationship not found in database but exists in localStorage
          // This could happen if the relationship was deleted or if the localStorage is stale
          // Show the message anyway, it will be cleared on next refresh if not valid
          setPendingCoachName(storedCoachName);
          setHasPendingInvite(true);
        }
      }
    } catch (err) {
      console.error('Error fetching coach connections:', err);
    } finally {
      setIsLoadingCoach(false);
    }
  };

  // Fetch assigned programs for the athlete
  const fetchAssignedPrograms = async () => {
    if (!profile) return;
    
    try {
      setIsLoadingPrograms(true);
      console.log('Fetching assigned programs for athlete:', profile.id);
      
      // Step 1: Get all program assignments for this athlete
      const { data: assignments, error: assignmentsError } = await supabase
        .from('program_assignments')
        .select('id, program_id, start_date, end_date')
        .eq('athlete_id', profile.id);
      
      if (assignmentsError) {
        console.error('Error fetching program assignments:', assignmentsError);
        throw assignmentsError;
      }
      
      console.log('Program assignments:', assignments);
      
      if (!assignments || assignments.length === 0) {
        setAssignedPrograms([]);
        setIsLoadingPrograms(false);
        return;
      }
      
      // Step 2: Get program details for each assignment
      const programIds = assignments.map(a => a.program_id);
      
      const { data: programs, error: programsError } = await supabase
        .from('programs')
        .select(`
          id, 
          name, 
          description, 
          coach_id
        `)
        .in('id', programIds);
      
      if (programsError) {
        console.error('Error fetching programs:', programsError);
        throw programsError;
      }
      
      console.log('Programs data:', programs);
      
      // Step 3: Get coach names for each program
      const coachIds = programs.map(p => p.coach_id);
      
      const { data: coaches, error: coachesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', coachIds);
      
      if (coachesError) {
        console.error('Error fetching coaches:', coachesError);
        throw coachesError;
      }
      
      console.log('Coaches data:', coaches);
      
      // Step 4: Combine all data
      const formattedPrograms: AssignedProgram[] = assignments.map(assignment => {
        const program = programs.find(p => p.id === assignment.program_id);
        const coach = program ? coaches.find(c => c.id === program.coach_id) : null;
        
        return {
          id: assignment.program_id,
          name: program?.name || 'Unknown Program',
          description: program?.description,
          startDate: assignment.start_date,
          endDate: assignment.end_date,
          coachName: coach?.full_name || 'Unknown Coach'
        };
      });
      
      setAssignedPrograms(formattedPrograms);
    } catch (err) {
      console.error('Error fetching assigned programs:', err);
    } finally {
      setIsLoadingPrograms(false);
    }
  };

  // Fetch workouts for the selected date and program
  const fetchDayWorkouts = async () => {
    if (!profile) return;
    
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      console.log('Fetching workouts for date:', dateStr);
      console.log('Selected program ID:', selectedProgramId);
      console.log('All assigned program IDs:', assignedPrograms.map(p => p.id));
      
      // Check if we have any assigned programs
      if (assignedPrograms.length === 0) {
        console.log('No assigned programs found, cannot fetch workouts');
        setDayWorkouts([]);
        return;
      }
      
      // If a specific program is selected, only show workouts from that program
      let query = supabase
        .from('sessions')
        .select(`
          session_id,
          name,
          description,
          program_id,
          workouts(workout_id, description, color, notes)
        `)
        .eq('session_date', dateStr);
      
      if (selectedProgramId) {
        console.log('Filtering by selected program:', selectedProgramId);
        query = query.eq('program_id', selectedProgramId);
      } else {
        // Otherwise, show workouts from all assigned programs
        const programIds = assignedPrograms.map(p => p.id);
        if (programIds.length > 0) {
          console.log('Filtering by all assigned programs:', programIds);
          query = query.in('program_id', programIds);
        }
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching day workouts:', error);
        return;
      }
      
      console.log('Day workouts data:', data);
      
      // Check if we have any sessions returned
      if (!data || data.length === 0) {
        console.log('No sessions found for this date');
        setDayWorkouts([]);
        return;
      }
      
      // Check if each session has workouts
      data.forEach(session => {
        console.log(`Session ${session.name} has ${session.workouts?.length || 0} workouts`);
      });
      
      // Transform the data to match the expected format
      const workouts = data?.flatMap(session => {
        if (!session.workouts || session.workouts.length === 0) {
          console.log(`No workouts found for session: ${session.name}`);
          return [];
        }
        
        return session.workouts.map((workout: any) => {
          console.log('Raw workout data:', workout);
          return {
            id: workout.workout_id,
            name: session.name,
            description: workout.description,
            type: workout.color ? workout.color : 'wod', // Use color as type if available
            color: workout.color, // Store the original color value
            notes: workout.notes
          };
        });
      }) || [];
      
      console.log('Transformed workouts:', workouts);
      setDayWorkouts(workouts);
    } catch (err) {
      console.error('Error fetching day workouts:', err);
      setDayWorkouts([]);
    }
  };

  // Fetch coach connections immediately when profile is available
  useEffect(() => {
    if (profile) {
      fetchCoachConnections();
      fetchAssignedPrograms();
    }
  }, [profile]);

  // Fetch workouts when date or selected program changes
  useEffect(() => {
    if (profile) {
      fetchDayWorkouts();
    }
  }, [selectedDate, selectedProgramId, assignedPrograms]);

  // Add a useEffect to check localStorage when component mounts
  useEffect(() => {
    // Check if we have a pending coach invitation from localStorage
    const storedCoachName = localStorage.getItem('pendingCoachName');
    const hasPendingStatus = localStorage.getItem('pendingJoinStatus') === 'true';
    
    if (storedCoachName && hasPendingStatus) {
      setPendingCoachName(storedCoachName);
      setHasPendingInvite(true);
      console.log('Found pending coach invitation in localStorage:', storedCoachName);
    }
  }, []); // Empty dependency array means this runs once on mount

  const toggleCoachActions = (coachId: string) => {
    setShowCoachActions(prev => ({
      ...prev,
      [coachId]: !prev[coachId]
    }));
  };

  const unsubscribeFromCoach = async (connectionId: string) => {
    if (!profile) return;
    setErrorMessage(null);

    try {
      setUnsubscribingCoach(connectionId);
      console.log(`Attempting to unsubscribe from coach with connection ID: ${connectionId}`);
      
      // Update the coach_athletes record to set status to 'inactive'
      const { data, error } = await supabase
        .from('coach_athletes')
        .update({ status: 'inactive' })
        .eq('id', connectionId)
        .select();
      
      if (error) {
        console.error('Error unsubscribing from coach:', error);
        setErrorMessage(`Failed to unsubscribe: ${error.message}`);
        throw error;
      }
      
      console.log('Unsubscribe result:', data);
      
      // Update local state
      setCoachConnections(prev => 
        prev.filter(conn => conn.id !== connectionId)
      );
      
      // Reset action menu
      setShowCoachActions({});
      
    } catch (err) {
      console.error('Error unsubscribing from coach:', err);
      setErrorMessage('Failed to unsubscribe from coach. Please try again later.');
    } finally {
      setUnsubscribingCoach(null);
    }
  };

  // Update the cleanup effect to not clear localStorage immediately
  useEffect(() => {
    // Don't clear localStorage values automatically
    // We'll let the coach approval process handle this
    // This ensures the message persists across page refreshes
  }, [hasPendingInvite, pendingCoachName]);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  
  // Check if athlete has an active coach or pending requests
  const activeCoaches = coachConnections.filter(conn => conn.status === 'active');
  const pendingCoaches = coachConnections.filter(conn => conn.status === 'pending');
  
  const hasActiveCoach = activeCoaches.length > 0;
  const hasPendingRequest = pendingCoaches.length > 0 || hasPendingInvite;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {isToday(selectedDate) ? 'Today\'s Workouts' : format(selectedDate, 'MMMM d, yyyy')}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Your scheduled training for the day.
        </p>
      </div>

      {/* Assigned Programs */}
      {isLoadingPrograms ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Assigned Programs
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Loading your programs...
          </p>
        </div>
      ) : (
        <AssignedPrograms 
          programs={assignedPrograms} 
          onSelectProgram={setSelectedProgramId} 
          selectedProgramId={selectedProgramId} 
        />
      )}

      {/* Pending Coach Invitation Message */}
      {hasPendingInvite && pendingCoachName && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ClockIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Waiting for coach approval
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-400">
                <p>
                  You've joined <strong>{pendingCoachName}</strong>. Waiting for coach approval.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Coach Connections Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Your Coaches</h2>
        </div>
        
        {isLoadingCoach ? (
          <div className="p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">Loading coach information...</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {activeCoaches.length > 0 ? (
              activeCoaches.map(connection => (
                <div key={connection.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {connection.coach.avatar_url ? (
                        <img
                          className="h-10 w-10 rounded-full"
                          src={connection.coach.avatar_url}
                          alt={`${connection.coach.full_name}'s avatar`}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <Users className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {connection.coach.full_name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Active
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <button
                      onClick={() => toggleCoachActions(connection.id)}
                      className="p-1 rounded-full text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                    
                    {showCoachActions[connection.id] && (
                      <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                        <div className="py-1">
                          <button
                            onClick={() => unsubscribeFromCoach(connection.id)}
                            disabled={unsubscribingCoach === connection.id}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            {unsubscribingCoach === connection.id ? 'Unsubscribing...' : 'Unsubscribe'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : pendingCoaches.length > 0 ? (
              pendingCoaches.map(connection => (
                <div key={connection.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {connection.coach.avatar_url ? (
                        <img
                          className="h-10 w-10 rounded-full"
                          src={connection.coach.avatar_url}
                          alt={`${connection.coach.full_name}'s avatar`}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <Users className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {connection.coach.full_name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          Pending approval
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  You don't have any coaches yet. Ask a coach for their invitation link to join.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Week Navigation (above calendar) */}
      <WeekNavigation 
        selectedDate={selectedDate} 
        onSelectDate={setSelectedDate} 
      />

      {/* Date Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateDay('prev')}
          className="p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {format(selectedDate, 'MMMM d, yyyy')}
          </span>
        </div>
        
        <button
          onClick={() => navigateDay('next')}
          className="p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Workouts */}
      <div className="space-y-4">
        {dayWorkouts.length > 0 ? (
          dayWorkouts.map((workout: any, index: number) => (
            <WorkoutCard key={index} workout={workout} />
          ))
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
            <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No workouts scheduled</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {hasActiveCoach
                ? "You don't have any workouts scheduled for this day."
                : "Join a coach to get personalized workout programs."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}