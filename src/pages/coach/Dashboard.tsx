/**
 * src/pages/coach/Dashboard.tsx
 * 
 * This file contains the actual Coach Dashboard that will display real data from Supabase.
 * Updated to show recent athlete activity instead of Quick Actions and Your Programs.
 * Invitation link functionality has been moved to Settings.
 */

import { formatDistanceToNow } from 'date-fns';
import {
    Activity,
    Calendar,
    ChevronRight,
    Loader2,
    MessageSquare,
    Trophy,
    UserCircle,
    Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useProfile } from '../../contexts/ProfileContext';
import { getCoachAthleteActivity, supabase } from '../../lib/supabase';
import { useWorkoutStore } from '../../lib/workout';

// Define a type for athlete data
interface Athlete {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  status: string;
}

// Define interface for activity data
interface AthleteActivityItem {
  id: string;
  athlete_id: string;
  workout_id: string;
  scheduled_on: string | null;
  is_completed: boolean;
  completed_at: string | null;
  notes: string | null;
  is_unscaled: boolean | null;
  created_at: string;
  updated_at: string;
  athlete: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  workout: {
    workout_id: string;
    description: string;
    session_id: string;
  };
}

export function CoachDashboard() {
  const { profile, refreshProfile } = useProfile();
  const { programs, fetchPrograms } = useWorkoutStore();
  const [loading, setLoading] = useState(true);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [recentActivity, setRecentActivity] = useState<AthleteActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  // Default coach name fallback
  const coachName = profile?.full_name || 'Coach';

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Fetch athletes assigned to this coach
  const fetchAthletes = async () => {
    if (!profile) return;
    
    try {
      setLoading(true);
      
      // Get athletes from the coach_athletes relation
      const { data: athleteRelations, error: relationError } = await supabase
        .from('coach_athletes')
        .select('athlete_id, status')
        .eq('coach_id', profile.id)
        .eq('status', 'active');
      
      if (relationError) {
        console.error('Error fetching athlete relations:', relationError);
        return;
      }
      
      if (!athleteRelations || athleteRelations.length === 0) {
        console.log('No athletes found for this coach');
        setAthletes([]);
        setLoading(false);
        return;
      }
      
      // Get athlete IDs to fetch their profile data
      const athleteIds = athleteRelations.map(relation => relation.athlete_id);
      
      // Fetch athlete profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', athleteIds);
      
      if (profileError) {
        console.error('Error fetching athlete profiles:', profileError);
        return;
      }
      
      // Create a map for quick lookups
      const profileMap: Record<string, any> = {};
      profileData?.forEach(profile => {
        profileMap[profile.id] = profile;
      });
      
      // Combine relationship data with profile data
      const formattedAthletes = athleteRelations
        .map(relation => {
          const profile = profileMap[relation.athlete_id];
          
          if (!profile) {
            return {
              id: relation.athlete_id,
              full_name: 'Athlete (data incomplete)',
              email: 'email@not.available',
              avatar_url: null,
              status: relation.status,
            } as Athlete;
          }
          
          return {
            id: profile.id,
            full_name: profile.full_name,
            email: profile.email,
            avatar_url: profile.avatar_url,
            status: relation.status,
          } as Athlete;
        });
      
      setAthletes(formattedAthletes);
    } catch (error) {
      console.error('Error in fetchAthletes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch recent athlete activity
  const fetchRecentActivity = async () => {
    if (!profile) return;
    
    try {
      setActivityLoading(true);
      const { data, error } = await getCoachAthleteActivity(profile.id, 10);
      
      if (error) {
        console.error('Error fetching recent activity:', error);
        return;
      }
      
      setRecentActivity(data || []);
    } catch (error) {
      console.error('Error in fetchRecentActivity:', error);
    } finally {
      setActivityLoading(false);
    }
  };

  // Fetch data when component mounts
  useEffect(() => {
    if (profile) {
      fetchPrograms();
      fetchAthletes();
      fetchRecentActivity();
    }
  }, [profile, fetchPrograms]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {getGreeting()}, {coachName} 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Welcome to your dashboard. Here's what's happening with your athletes.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Active Athletes
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                      {loading ? '-' : athletes.length}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Active Programs
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                      {Object.values(programs).filter(p => p.status === 'published').length}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Recent Activities
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                      {activityLoading ? '-' : recentActivity.length}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Recent Activity
            </h2>
            <RouterLink
              to="/coach/athletes"
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 flex items-center"
            >
              View all athletes
              <ChevronRight className="h-4 w-4 ml-1" />
            </RouterLink>
          </div>
        </div>
        
        {activityLoading ? (
          <div className="p-6 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-500 dark:text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400">Loading recent activity...</p>
          </div>
        ) : recentActivity.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="p-4">
                <div className="flex items-center space-x-3">
                  {/* Athlete Avatar */}
                  <div className="flex-shrink-0">
                    {activity.athlete.avatar_url ? (
                      <img
                        className="h-8 w-8 rounded-full object-cover"
                        src={activity.athlete.avatar_url}
                        alt={activity.athlete.full_name}
                        onError={(e) => {
                          // If image fails to load, replace with default icon
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <svg class="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                              </div>
                            `;
                          }
                        }}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <UserCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Activity Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {activity.athlete.full_name}
                      </p>
                      {activity.is_completed && (
                        <div className="flex items-center space-x-1">
                          <Trophy className="h-4 w-4 text-green-600 dark:text-green-400" />
                          {activity.is_unscaled !== null && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              activity.is_unscaled 
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                            }`}>
                              {activity.is_unscaled ? 'As Prescribed' : 'Scaled'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {activity.is_completed ? 'Completed' : 'Updated'}: {activity.workout.description || 'Workout'}
                    </p>
                    
                    {activity.notes && (
                      <div className="mt-1 flex items-center space-x-1">
                        <MessageSquare className="h-3 w-3 text-gray-400" />
                        <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                          "{activity.notes}"
                        </p>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(activity.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 flex flex-col items-center justify-center text-center py-12">
            <Activity className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No recent activity</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              Once your athletes start completing workouts and adding notes, their activity will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}