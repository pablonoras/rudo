/**
 * src/pages/athlete/Dashboard.tsx
 * 
 * Athlete Dashboard main page showing workouts and program information.
 * Updated to include a link to the Find a Coach page and display current coach status.
 * Fixed to properly detect and display active coach connections.
 * Fixed the Supabase query to correctly join coach_athletes and profiles tables.
 * Added support for managing multiple coaches and unsubscribing from coaches.
 * Fixed unsubscribe functionality with improved error handling.
 */

import { addDays, format, isToday, parseISO, subDays } from 'date-fns';
import { Calendar, CheckCircle, ChevronLeft, ChevronRight, ExternalLink, MoreHorizontal, PlusCircle, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const dayWorkouts = assignedProgram?.days[dateStr]?.workouts || [];
  
  // Check if athlete has an active coach or pending requests
  const activeCoaches = coachConnections.filter(conn => conn.status === 'active');
  const pendingCoaches = coachConnections.filter(conn => conn.status === 'pending');
  
  const hasActiveCoach = activeCoaches.length > 0;
  const hasPendingRequest = pendingCoaches.length > 0;
  
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
      
      // Get connection details first for logging
      const { data: connection, error: getError } = await supabase
        .from('coach_athletes')
        .select('*')
        .eq('id', connectionId)
        .single();
        
      if (getError) {
        console.error('Error getting coach connection details:', getError);
      } else {
        console.log('Connection details before update:', connection);
      }
      
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {isToday(selectedDate) ? "Today's Workouts" : format(selectedDate, 'MMMM d, yyyy')}
        </h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateDay('prev')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            title="Go to today"
          >
            <Calendar className="h-5 w-5" />
          </button>
          <button
            onClick={() => navigateDay('next')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Coach Connection Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="h-5 w-5 text-purple-500 mr-2" />
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              My Coaches
            </h2>
          </div>
          {hasActiveCoach && (
            <Link
              to="/athlete/find-coach"
              className="inline-flex items-center text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 p-1 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/20"
              title="Add another coach"
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              Add Coach
            </Link>
          )}
        </div>
        
        {errorMessage && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded border border-red-200 dark:border-red-800">
            {errorMessage}
          </div>
        )}
        
        {isLoadingCoach ? (
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading coach information...</p>
        ) : hasActiveCoach ? (
          <div className="mt-3 space-y-3">
            {activeCoaches.map(conn => (
              <div key={conn.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 group">
                <div className="flex items-center">
                  {conn.coach?.avatar_url ? (
                    <img 
                      src={conn.coach.avatar_url} 
                      alt={conn.coach.full_name} 
                      className="w-10 h-10 rounded-full mr-3"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mr-3">
                      <span className="text-purple-600 font-semibold">
                        {conn.coach?.full_name.substring(0, 1)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {conn.coach?.full_name}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Active Coach
                    </p>
                  </div>
                </div>
                
                {/* Menu for coach actions */}
                <div className="relative">
                  <button 
                    onClick={() => toggleCoachActions(conn.id)}
                    className="p-2 opacity-0 group-hover:opacity-100 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-opacity"
                  >
                    <MoreHorizontal className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </button>
                  
                  {showCoachActions[conn.id] && (
                    <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 p-1 z-10">
                      <button
                        onClick={() => unsubscribeFromCoach(conn.id)}
                        disabled={unsubscribingCoach === conn.id}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md flex items-center"
                      >
                        {unsubscribingCoach === conn.id ? (
                          <span className="flex items-center">
                            <div className="h-3 w-3 mr-2 rounded-full border-2 border-t-transparent border-red-400 animate-spin"></div>
                            Unsubscribing...
                          </span>
                        ) : (
                          <>
                            <X className="h-3.5 w-3.5 mr-2" />
                            Unsubscribe
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {pendingCoaches.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Pending Requests</h3>
                {pendingCoaches.map(conn => (
                  <div key={conn.id} className="flex items-center mt-2 bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                    <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mr-2">
                      <span className="text-yellow-600 dark:text-yellow-400 font-semibold">
                        {conn.coach?.full_name.substring(0, 1)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {conn.coach?.full_name}
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400">
                        Request Pending
                      </p>
                    </div>
                    <button
                      onClick={() => unsubscribeFromCoach(conn.id)}
                      disabled={unsubscribingCoach === conn.id}
                      className="p-1 text-gray-400 hover:text-red-500 rounded"
                      title="Cancel request"
                    >
                      {unsubscribingCoach === conn.id ? (
                        <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-gray-400 animate-spin"></div>
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <Link
                to="/athlete/find-coach"
                className="inline-flex items-center text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
              >
                Find More Coaches
                <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </div>
        ) : hasPendingRequest ? (
          <div className="mt-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You have pending coach requests. Coaches will review your requests and accept them soon.
            </p>
            <div className="mt-2">
              {pendingCoaches.map(conn => (
                <div key={conn.id} className="flex items-center mt-2 bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                  <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mr-2">
                    <span className="text-yellow-600 dark:text-yellow-400 font-semibold">
                      {conn.coach?.full_name.substring(0, 1)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {conn.coach?.full_name}
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      Request Pending
                    </p>
                  </div>
                  <button
                    onClick={() => unsubscribeFromCoach(conn.id)}
                    disabled={unsubscribingCoach === conn.id}
                    className="p-1 text-gray-400 hover:text-red-500 rounded"
                    title="Cancel request"
                  >
                    {unsubscribingCoach === conn.id ? (
                      <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-gray-400 animate-spin"></div>
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link
                to="/athlete/find-coach"
                className="inline-flex items-center text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
              >
                Find More Coaches
                <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              You are not connected with any coach yet. Find a coach to get personalized workouts and tracking.
            </p>
            <Link 
              to="/athlete/find-coach" 
              className="inline-flex items-center text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
            >
              Find a Coach
              <ExternalLink className="ml-1 h-4 w-4" />
            </Link>
          </div>
        )}
      </div>

      {assignedProgram ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {assignedProgram.name}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {format(parseISO(assignedProgram.startDate), 'MMM d')} -{' '}
            {format(parseISO(assignedProgram.endDate), 'MMM d, yyyy')}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            No Active Program
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {hasActiveCoach 
              ? "You don't have any assigned programs yet."
              : "Connect with a coach to get assigned programs and workouts."}
          </p>
          {!hasActiveCoach && !hasPendingRequest && (
            <Link 
              to="/athlete/find-coach" 
              className="mt-4 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
            >
              Find a Coach
            </Link>
          )}
        </div>
      )}

      {dayWorkouts.length > 0 ? (
        <div className="space-y-4">
          {dayWorkouts.map((workout) => (
            <WorkoutCard key={workout.id} workout={workout} />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No workouts scheduled for this day
          </p>
        </div>
      )}
    </div>
  );
}