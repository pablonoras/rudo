/**
 * src/pages/athlete/FindCoach.tsx
 * 
 * FindCoach component for the Athlete Dashboard that displays a list of available
 * coaches from Supabase. Athletes can request to join a coach, which adds a new row
 * to the coach_athletes table with status 'pending'.
 * Updated to support multiple coach connections and filtering of inactive connections.
 * Added back button to navigate to the dashboard.
 */

import { ArrowLeft, CircleUserRound, Loader2, Search, UserCheck, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../../contexts/ProfileContext';
import { supabase } from '../../lib/supabase';

type Coach = {
  id: string;
  full_name: string;
  avatar_url: string | null;
};

type CoachStatus = {
  [coachId: string]: 'none' | 'pending' | 'active' | 'inactive' | 'loading';
};

export function FindCoach() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [filteredCoaches, setFilteredCoaches] = useState<Coach[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coachStatus, setCoachStatus] = useState<CoachStatus>({});

  // Fetch all coaches and the athlete's coach connections
  useEffect(() => {
    const fetchCoaches = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('Fetching coaches...');

        // Fetch all coaches from profiles table
        const { data: coachData, error: coachError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('role', 'coach');

        if (coachError) {
          console.error('Error fetching coaches:', coachError);
          throw coachError;
        }
        
        console.log('Coaches data:', coachData);
        
        if (coachData) {
          setCoaches(coachData);
          setFilteredCoaches(coachData);
        }

        // If the athlete is logged in, fetch their coach connections
        if (profile) {
          console.log('Fetching coach connections for athlete:', profile.id);
          
          const { data: connections, error: connectionsError } = await supabase
            .from('coach_athletes')
            .select('coach_id, status')
            .eq('athlete_id', profile.id);

          if (connectionsError) {
            console.error('Error fetching connections:', connectionsError);
            throw connectionsError;
          }

          console.log('Athlete connections:', connections);

          // Initialize coach status map
          const initialStatus: CoachStatus = {};
          
          // Set all coaches initially to 'none'
          coachData?.forEach(coach => {
            initialStatus[coach.id] = 'none';
          });
          
          // Update with actual statuses from connections
          connections?.forEach(conn => {
            initialStatus[conn.coach_id] = conn.status as 'pending' | 'active' | 'inactive';
          });
          
          console.log('Coach status map:', initialStatus);
          
          setCoachStatus(initialStatus);
        }
      } catch (err) {
        console.error('Error fetching coaches:', err);
        setError('Failed to load coaches. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoaches();
  }, [profile]);

  // Filter coaches based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCoaches(coaches);
    } else {
      const filtered = coaches.filter(coach => 
        coach.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCoaches(filtered);
    }
  }, [searchTerm, coaches]);

  // Request to join a coach
  const handleRequestJoin = async (coachId: string) => {
    if (!profile) return;

    try {
      console.log(`Requesting to join coach: ${coachId}`);
      
      // Update local state to show loading
      setCoachStatus(prev => ({ ...prev, [coachId]: 'loading' }));

      // Check if there's an existing connection to this coach
      const { data: existingConnection, error: connectionError } = await supabase
        .from('coach_athletes')
        .select('id, status')
        .eq('coach_id', coachId)
        .eq('athlete_id', profile.id)
        .maybeSingle();
        
      if (connectionError) {
        console.error('Error checking existing connection:', connectionError);
        throw connectionError;
      }
        
      console.log('Existing connection:', existingConnection);

      if (existingConnection) {
        // If there's an existing connection, update it to pending
        console.log(`Updating existing connection (ID: ${existingConnection.id}, status: ${existingConnection.status}) to pending`);
        
        const { error: updateError } = await supabase
          .from('coach_athletes')
          .update({ status: 'pending' })
          .eq('id', existingConnection.id);

        if (updateError) {
          console.error('Error updating connection to pending:', updateError);
          throw updateError;
        }
        
        console.log('Successfully updated connection to pending');
      } else {
        console.log('Creating new coach connection with pending status');
        
        // Insert new row in coach_athletes table with 'pending' status
        const { error: insertError } = await supabase
          .from('coach_athletes')
          .insert({
            coach_id: coachId,
            athlete_id: profile.id,
            status: 'pending'
          });

        if (insertError) {
          console.error('Error creating new connection:', insertError);
          throw insertError;
        }
        
        console.log('Successfully created new connection');
      }

      // Update local state with pending status
      setCoachStatus(prev => ({ ...prev, [coachId]: 'pending' }));
      console.log(`Updated coach status for ${coachId} to pending`);
    } catch (err) {
      console.error('Error requesting to join coach:', err);
      // Revert back to none on error
      setCoachStatus(prev => ({ ...prev, [coachId]: 'none' }));
      setError('Failed to send request. Please try again later.');
    }
  };

  const handleBack = () => {
    navigate('/athlete');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={handleBack}
            className="mr-3 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Find a Coach
          </h1>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            Browse available coaches and request to join their team. You can have multiple coaches at the same time for different types of training.
          </p>
        </div>

        {/* Search bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search coaches by name..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading coaches...</span>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-md mb-4">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && filteredCoaches.length === 0 && (
          <div className="text-center py-12">
            <CircleUserRound className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No coaches found</h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Try a different search term' : 'There are no coaches available at the moment'}
            </p>
          </div>
        )}

        {/* Coaches grid */}
        {!isLoading && !error && filteredCoaches.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredCoaches.map(coach => {
              // Log the coach and its status for debugging
              console.log(`Coach ${coach.full_name} (${coach.id}) - Status: ${coachStatus[coach.id]}`);
              
              // Don't hide inactive coaches anymore - allow them to be displayed
              // if (coachStatus[coach.id] === 'inactive') return null;
              
              return (
                <div 
                  key={coach.id} 
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 p-4 flex flex-col items-center"
                >
                  {/* Avatar */}
                  {coach.avatar_url ? (
                    <img 
                      src={coach.avatar_url} 
                      alt={coach.full_name} 
                      className="w-20 h-20 rounded-full object-cover mb-3"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3">
                      <CircleUserRound className="h-12 w-12 text-purple-500" />
                    </div>
                  )}
                  
                  {/* Name */}
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 text-center">
                    {coach.full_name}
                  </h3>
                  
                  {/* Status indicator for inactive connections */}
                  {coachStatus[coach.id] === 'inactive' && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Previously connected
                    </span>
                  )}
                  
                  {/* Join button */}
                  <div className="mt-4 w-full">
                    {coachStatus[coach.id] === 'pending' ? (
                      <button
                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 cursor-not-allowed"
                        disabled
                      >
                        <UserCheck className="mr-2 h-4 w-4" />
                        Request Pending
                      </button>
                    ) : coachStatus[coach.id] === 'active' ? (
                      <button
                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 cursor-not-allowed"
                        disabled
                      >
                        <UserCheck className="mr-2 h-4 w-4" />
                        Active Coach
                      </button>
                    ) : coachStatus[coach.id] === 'loading' ? (
                      <button
                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 cursor-not-allowed"
                        disabled
                      >
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending Request...
                      </button>
                    ) : (
                      // For both 'none' and 'inactive' statuses, show Request to Join button
                      <button
                        onClick={() => handleRequestJoin(coach.id)}
                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:bg-purple-700 dark:hover:bg-purple-600"
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        {coachStatus[coach.id] === 'inactive' ? 'Request to Rejoin' : 'Request to Join'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 