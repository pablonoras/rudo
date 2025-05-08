import { Search, Trash2, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Program } from '../../lib/workout';

interface ProgramAssignmentManagerProps {
  program: Program;
  onClose: () => void;
  onUnassign: (athleteId: string) => Promise<void>;
}

interface AthleteWithProfile {
  id: string;
  athlete_id: string;
  profiles: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

export function ProgramAssignmentManager({ program, onClose, onUnassign }: ProgramAssignmentManagerProps) {
  const [assignedAthletes, setAssignedAthletes] = useState<AthleteWithProfile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [unassigning, setUnassigning] = useState<string | null>(null);

  // Fetch assigned athletes with their profiles
  useEffect(() => {
    const fetchAssignedAthletes = async () => {
      setLoading(true);
      
      try {
        // Get all athletes assigned to this program with their profiles
        const { data, error } = await supabase
          .from('program_assignments')
          .select(`
            id,
            athlete_id,
            profiles:athlete_id (
              id, 
              full_name, 
              email, 
              avatar_url
            )
          `)
          .eq('program_id', program.id);
        
        if (error) {
          console.error('Error fetching program assignments:', error);
          // Fall back to local state
          await fetchProfilesFromLocalState();
        } else {
          if (!data || data.length === 0) {
            console.warn('No assignments found in database for program:', program.id);
            // Fall back to local state
            await fetchProfilesFromLocalState();
          } else {
            // We found assignments in the database
            // Transform the data to ensure consistent structure
            const transformedData = data.map(item => {
              // Check if profiles is an array or an object
              const profileData = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
              
              return {
                ...item,
                profiles: profileData
              };
            });
            
            setAssignedAthletes(transformedData as unknown as AthleteWithProfile[]);
          }
        }
      } catch (error) {
        console.error('Unexpected error in fetchAssignedAthletes:', error);
        // Fall back to local state
        await fetchProfilesFromLocalState();
      } finally {
        setLoading(false);
      }
    };
    
    // Helper function to fetch profiles for athletes in local state
    const fetchProfilesFromLocalState = async () => {
      if (program.assignedTo.athletes.length === 0) {
        setAssignedAthletes([]);
        return;
      }
      
      try {
        // Get profiles for the athletes in the local state
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .in('id', program.assignedTo.athletes);
        
        if (profilesError) {
          console.error('Error fetching profiles for local athletes:', profilesError);
          setAssignedAthletes([]);
        } else if (profilesData && profilesData.length > 0) {
          // Transform the profiles into the expected format
          const transformedData = profilesData.map(profile => ({
            id: `local-${profile.id}`, // Generate a temporary ID
            athlete_id: profile.id,
            profiles: profile
          }));
          
          setAssignedAthletes(transformedData as AthleteWithProfile[]);
        } else {
          console.warn('No profiles found for locally assigned athletes');
          setAssignedAthletes([]);
        }
      } catch (error) {
        console.error('Error fetching profiles for local athletes:', error);
        setAssignedAthletes([]);
      }
    };
    
    fetchAssignedAthletes();
  }, [program.id, program.assignedTo.athletes, program.name]);

  // Filter athletes based on search
  const filteredAthletes = assignedAthletes.filter((athlete) => {
    const profile = athlete.profiles;
    if (!profile) {
      return false;
    }
    return (
      profile.full_name?.toLowerCase().includes(search.toLowerCase()) || 
      profile.email?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleUnassign = async (athleteId: string) => {
    setUnassigning(athleteId);
    try {
      await onUnassign(athleteId);
      // Remove from local state after successful unassignment
      setAssignedAthletes(prev => prev.filter(a => a.athlete_id !== athleteId));
    } catch (error) {
      console.error('Error unassigning athlete:', error);
      alert('Failed to unassign athlete. Please try again.');
    } finally {
      setUnassigning(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Manage Assignments: {program.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assigned athletes..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Assigned Athletes ({filteredAthletes.length})
              </h3>
              {filteredAthletes.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  {search ? "No athletes match your search" : "No athletes assigned to this program."}
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredAthletes.map((athlete) => {
                    const profile = athlete.profiles;
                    
                    if (!profile) {
                      console.error('No profile found for athlete:', athlete);
                      return null;
                    }
                    
                    return (
                      <div
                        key={athlete.id}
                        className="flex items-center justify-between p-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {profile.avatar_url ? (
                              <img
                                className="h-10 w-10 rounded-full"
                                src={profile.avatar_url}
                                alt={`${profile.full_name}'s avatar`}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <Users className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {profile.full_name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {profile.email}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnassign(athlete.athlete_id)}
                          disabled={unassigning === athlete.athlete_id}
                          className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 