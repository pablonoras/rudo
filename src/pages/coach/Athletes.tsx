import { AlertCircle, BarChart2, CheckCircle, Plus, Search, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AddAthleteModal } from '../../components/athlete/AddAthleteModal';
import { useProfile } from '../../contexts/ProfileContext';
import { supabase } from '../../lib/supabase';

type AthleteLevel = 'beginner' | 'intermediate' | 'advanced';
type TeamFilter = 'all' | string;

type Athlete = {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  level?: AthleteLevel;
  team?: string;
  joined_at: string;
  status: string;
};

export function Athletes() {
  const { profile } = useProfile();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<AthleteLevel | 'all'>('all');
  const [teamFilter] = useState<TeamFilter>('all');
  const [showAddAthlete, setShowAddAthlete] = useState(false);
  const [activatingAthleteId, setActivatingAthleteId] = useState<string | null>(null);
  const [updatingAthleteId, setUpdatingAthleteId] = useState<string | null>(null);
  const [showStatusMenu, setShowStatusMenu] = useState<string | null>(null);

  // Fetch athletes for the current coach
  const fetchAthletes = async () => {
    if (!profile?.id) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const coachId = profile.id;
      
      // First query to get all athlete_ids for this coach
      const { data: athleteRelations, error: relationsError } = await supabase
        .from('coach_athletes')
        .select('athlete_id, joined_at, status')
        .eq('coach_id', coachId);
        
      if (relationsError) {
        console.error('Error fetching coach-athlete relations:', relationsError);
        throw relationsError;
      }
      
      if (!athleteRelations || athleteRelations.length === 0) {
        setAthletes([]);
        setIsLoading(false);
        return;
      }
      
      // Extract athlete IDs
      const athleteIds = athleteRelations.map(rel => rel.athlete_id);
      
      // Query athlete profiles
      const { data: athleteProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', athleteIds);
      
      if (profilesError) {
        console.error('Error fetching athlete profiles:', profilesError);
      }
      
      // Create a map of athlete IDs to profiles for efficient lookup
      const profileMap = (athleteProfiles || []).reduce((map: Record<string, any>, profile: any) => {
        map[profile.id] = profile;
        return map;
      }, {});
      
      // Combine the relation data with profile data
      const formattedAthletes = athleteRelations
        .map(relation => {
          const profile = profileMap[relation.athlete_id];
          
          if (!profile) {
            // Create a placeholder profile for athletes without profile data
            return {
              id: relation.athlete_id,
              full_name: 'Athlete (data incomplete)',
              email: 'email@not.available',
              avatar_url: null,
              joined_at: relation.joined_at,
              status: relation.status,
              level: 'beginner' as AthleteLevel,
            } as Athlete;
          }
          
          return {
            id: profile.id,
            full_name: profile.full_name,
            email: profile.email,
            avatar_url: profile.avatar_url,
            joined_at: relation.joined_at,
            status: relation.status,
            level: 'beginner' as AthleteLevel,
          } as Athlete;
        });
      
      setAthletes(formattedAthletes);
      
    } catch (error) {
      console.error('Error fetching athletes:', error);
      setError('Failed to load athletes. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchAthletes();
    }
  }, [profile]);

  // Filter athletes based on search query and filters
  const filteredAthletes = athletes.filter((athlete) => {
    const matchesSearch = 
      athlete.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      athlete.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === 'all' || athlete.level === levelFilter;
    const matchesTeam = teamFilter === 'all' || athlete.team === teamFilter;
    return matchesSearch && matchesLevel && matchesTeam;
  });

  // Function to activate an athlete (change status from pending to active)
  const activateAthlete = async (athleteId: string) => {
    if (!profile?.id) return;
    
    try {
      setActivatingAthleteId(athleteId);
      console.log(`Activating athlete: ${athleteId}`);
      
      // Find the coach-athlete relationship for this athlete
      const { data: relationships, error: findError } = await supabase
        .from('coach_athletes')
        .select('id')
        .eq('coach_id', profile.id)
        .eq('athlete_id', athleteId)
        .single();
      
      if (findError) {
        console.error('Error finding coach-athlete relationship:', findError);
        throw findError;
      }
      
      if (!relationships) {
        throw new Error('Relationship not found');
      }
      
      // Update the status to active
      const { error: updateError } = await supabase
        .from('coach_athletes')
        .update({ status: 'active' })
        .eq('id', relationships.id);
      
      if (updateError) {
        console.error('Error activating athlete:', updateError);
        throw updateError;
      }
      
      console.log('Successfully activated athlete');
      
      // Update the local state
      setAthletes(prev => 
        prev.map(athlete => 
          athlete.id === athleteId 
            ? { ...athlete, status: 'active' } 
            : athlete
        )
      );
    } catch (err) {
      console.error('Error activating athlete:', err);
      setError('Failed to activate athlete. Please try again.');
    } finally {
      setActivatingAthleteId(null);
    }
  };

  // Function to change athlete status
  const updateAthleteStatus = async (athleteId: string, newStatus: string) => {
    if (!profile?.id) return;
    
    try {
      setUpdatingAthleteId(athleteId);
      console.log(`Updating athlete ${athleteId} status to: ${newStatus}`);
      
      // Find the coach-athlete relationship for this athlete
      const { data: relationships, error: findError } = await supabase
        .from('coach_athletes')
        .select('id')
        .eq('coach_id', profile.id)
        .eq('athlete_id', athleteId)
        .single();
      
      if (findError) {
        console.error('Error finding coach-athlete relationship:', findError);
        throw findError;
      }
      
      if (!relationships) {
        throw new Error('Relationship not found');
      }
      
      // Update the status
      const { error: updateError } = await supabase
        .from('coach_athletes')
        .update({ status: newStatus })
        .eq('id', relationships.id);
      
      if (updateError) {
        console.error(`Error changing athlete status to ${newStatus}:`, updateError);
        throw updateError;
      }
      
      console.log(`Successfully updated athlete status to ${newStatus}`);
      
      // Update the local state
      setAthletes(prev => 
        prev.map(athlete => 
          athlete.id === athleteId 
            ? { ...athlete, status: newStatus } 
            : athlete
        )
      );
    } catch (err) {
      console.error(`Error updating athlete status to ${newStatus}:`, err);
      setError(`Failed to update athlete status. Please try again.`);
    } finally {
      setUpdatingAthleteId(null);
      setShowStatusMenu(null);
    }
  };

  const toggleStatusMenu = (athleteId: string | null) => {
    setShowStatusMenu(prevId => prevId === athleteId ? null : athleteId);
  };

  const handleAddAthletes = () => {
    setShowAddAthlete(false);
    // Refresh the athletes list after adding
    if (profile) {
      setIsLoading(true);
      fetchAthletes();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Athletes
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your athletes and track their progress
          </p>
        </div>
        <button
          onClick={() => setShowAddAthlete(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Athlete
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Athletes
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                      {athletes.length}
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
                <BarChart2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Active Programs
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                      {/* This can be updated with actual program count */}
                      0
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="w-full sm:w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search athletes..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as AthleteLevel | 'all')}
            className="block rounded-md border border-gray-300 dark:border-gray-600 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Athletes List */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading athletes...</p>
          </div>
        ) : athletes.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No athletes found. Click "Add Athlete" to get started.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Athlete
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAthletes.map((athlete) => (
                <tr key={athlete.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        {athlete.avatar_url ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={athlete.avatar_url}
                            alt={athlete.full_name}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <span className="text-lg font-medium text-gray-600 dark:text-gray-300">
                              {athlete.full_name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {athlete.full_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {athlete.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {athlete.level || "Not set"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="relative">
                        <button 
                          onClick={() => toggleStatusMenu(athlete.id)}
                          className={`px-2 py-1 inline-flex items-center text-xs font-semibold rounded-full ${
                            athlete.status === 'active' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : athlete.status === 'inactive'
                              ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          } hover:ring-2 hover:ring-offset-1 hover:ring-opacity-50 ${
                            athlete.status === 'active' ? 'hover:ring-green-400' : 
                            athlete.status === 'inactive' ? 'hover:ring-gray-400' : 'hover:ring-yellow-400'
                          } transition-all`}
                        >
                          <span>
                            {athlete.status === 'active' ? 'Active' : 
                            athlete.status === 'inactive' ? 'Inactive' : 'Pending'}
                          </span>
                          <svg className="ml-1 h-3 w-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        
                        {/* Status change dropdown */}
                        {showStatusMenu === athlete.id && (
                          <div className="fixed mt-1 w-40 z-[1000] bg-white dark:bg-gray-800 rounded-md shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="py-1">
                              {athlete.status === 'active' && (
                                <button
                                  onClick={() => updateAthleteStatus(athlete.id, 'inactive')}
                                  className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 group flex items-center"
                                >
                                  <X className="h-4 w-4 mr-3 text-red-500 flex-shrink-0" />
                                  <span className="whitespace-nowrap">Set Inactive</span>
                                </button>
                              )}
                              {athlete.status === 'inactive' && (
                                <button
                                  onClick={() => updateAthleteStatus(athlete.id, 'active')}
                                  className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 group flex items-center"
                                >
                                  <CheckCircle className="h-4 w-4 mr-3 text-green-500 flex-shrink-0" />
                                  <span className="whitespace-nowrap">Set Active</span>
                                </button>
                              )}
                              {athlete.status === 'pending' && (
                                <button
                                  onClick={() => activateAthlete(athlete.id)}
                                  className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 group flex items-center"
                                >
                                  <CheckCircle className="h-4 w-4 mr-3 text-green-500 flex-shrink-0" />
                                  <span className="whitespace-nowrap">Activate</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Show loading indicator */}
                      {(activatingAthleteId === athlete.id || updatingAthleteId === athlete.id) && (
                        <div className="ml-2">
                          <div className="h-3 w-3 rounded-full border-2 border-t-transparent border-blue-500 animate-spin"></div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(athlete.joined_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAddAthlete && (
        <AddAthleteModal
          onClose={() => setShowAddAthlete(false)}
          onAdd={handleAddAthletes}
        />
      )}
    </div>
  );
}