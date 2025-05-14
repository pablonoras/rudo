/**
 * src/pages/athlete/Dashboard.tsx
 * 
 * Athlete Dashboard main page showing workouts and program information.
 * Updated to remove find-coach functionality and display pending coach approval message.
 * Athletes now join coaches exclusively through invitation links.
 */

import { addDays, format, isToday, subDays } from 'date-fns';
import { Calendar, CheckCircle, ChevronLeft, ChevronRight, ClockIcon, MoreHorizontal, User, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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

  const getTypeColor = (type: string) => {
    const colors = {
      warmup: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      strength: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      wod: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      cooldown: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border ${
      isCompleted ? 'border-green-500 dark:border-green-400' : 'border-gray-200 dark:border-gray-700'
    }`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {workout.name}
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-full capitalize mt-1 inline-block ${getTypeColor(workout.type)}`}>
              {workout.type}
            </span>
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
        
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
          {workout.description}
        </div>
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

  // Mock assigned program for demonstration
  const assignedProgram = Object.values(programs)[0];

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

  // Fetch coach connections immediately when profile is available
  useEffect(() => {
    if (profile) {
      fetchCoachConnections();
    }
  }, [profile]);

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

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const dayWorkouts = assignedProgram?.days[dateStr]?.workouts || [];
  
  // Check if athlete has an active coach or pending requests
  const activeCoaches = coachConnections.filter(conn => conn.status === 'active');
  const pendingCoaches = coachConnections.filter(conn => conn.status === 'pending');
  
  const hasActiveCoach = activeCoaches.length > 0;
  const hasPendingRequest = pendingCoaches.length > 0 || hasPendingInvite;
  
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

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
          <RouterLink
            to="/athlete/account"
            className="flex items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            <User className="h-6 w-6 text-purple-600 dark:text-purple-400 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Account Settings</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage your profile</p>
            </div>
          </RouterLink>
        </div>
      </div>

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