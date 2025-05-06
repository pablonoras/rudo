/**
 * src/pages/coach/Dashboard.tsx
 * 
 * This file contains the actual Coach Dashboard that will display real data from Supabase.
 * Currently shows an empty state that will be populated as the user adds programs and athletes.
 */

import { format, parseISO } from 'date-fns';
import {
    BarChart2,
    Calendar,
    ChevronRight,
    Clock,
    FilePlus,
    Plus,
    PlusCircle,
    UserPlus,
    Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '../../contexts/ProfileContext';
import { supabase } from '../../lib/supabase';
import { useWorkoutStore } from '../../lib/workout';

// Define a type for athlete data
interface Athlete {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  status: string;
}

export function CoachDashboard() {
  const { profile } = useProfile();
  const { programs, fetchPrograms } = useWorkoutStore();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Get coach name from profile
  const coachName = profile?.full_name || 'Coach';
  
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

  // Fetch data when component mounts
  useEffect(() => {
    if (profile) {
      fetchPrograms();
      fetchAthletes();
    }
  }, [profile, fetchPrograms]);

  // Get programs to display
  const programList = Object.values(programs)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {getGreeting()}, {coachName} 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Welcome to your dashboard. Here you can manage your athletes and programs.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/coach/programs"
            className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <FilePlus className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Create Program</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Build workout templates</p>
            </div>
          </Link>
          <Link
            to="/coach/athletes"
            className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <UserPlus className="h-6 w-6 text-green-600 dark:text-green-400 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Add Athletes</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Invite people to join</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Programs */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Your Programs
            </h2>
            <Link
              to="/coach/programs"
              className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              New Program
            </Link>
          </div>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">Loading programs...</p>
          </div>
        ) : programList.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {programList.map((program) => (
              <Link
                key={program.id}
                to={`/coach/program/${program.id}`}
                className="block px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {program.name}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {format(parseISO(program.startDate), 'MMM d')} -{' '}
                      {format(parseISO(program.endDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{program.weekCount} weeks</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{program.assignedTo.athletes.length} assigned</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </Link>
            ))}
            {programList.length < Object.values(programs).length && (
              <Link 
                to="/coach/programs"
                className="block px-6 py-3 text-center text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                View all programs
              </Link>
            )}
          </div>
        ) : (
          <div className="p-6 flex flex-col items-center justify-center text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No programs yet</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
              Create your first workout program to start assigning to your athletes and teams.
            </p>
            <Link
              to="/coach/programs"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Program
            </Link>
          </div>
        )}
      </div>

      {/* Athletes */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Your Athletes
            </h2>
            <Link
              to="/coach/athletes"
              className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              Add Athletes
            </Link>
          </div>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">Loading athletes...</p>
          </div>
        ) : athletes.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {athletes.slice(0, 5).map((athlete) => (
              <Link
                key={athlete.id}
                to={`/coach/athletes/${athlete.id}`}
                className="block px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    {athlete.avatar_url ? (
                      <img
                        className="h-10 w-10 rounded-full"
                        src={athlete.avatar_url}
                        alt={`${athlete.full_name}'s avatar`}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <Users className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {athlete.full_name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{athlete.email}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </Link>
            ))}
            {athletes.length > 5 && (
              <Link 
                to="/coach/athletes"
                className="block px-6 py-3 text-center text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                View all athletes
              </Link>
            )}
          </div>
        ) : (
          <div className="p-6 flex flex-col items-center justify-center text-center py-12">
            <Users className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No athletes yet</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
              Add athletes to your roster to start assigning programs and tracking their progress.
            </p>
            <Link
              to="/coach/athletes"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Athletes
            </Link>
          </div>
        )}
      </div>

      {/* Recent Activity - Will be implemented when data is available */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Recent Activity
          </h2>
        </div>
        <div className="p-6 flex flex-col items-center justify-center text-center py-12">
          <BarChart2 className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No activity yet</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md">
            Your recent activity will appear here once you start creating programs and adding athletes.
          </p>
        </div>
      </div>
    </div>
  );
}