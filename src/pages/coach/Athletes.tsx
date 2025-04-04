import { BarChart2, Plus, Search, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  const { profile, loading } = useProfile();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<AthleteLevel | 'all'>('all');
  const [teamFilter, setTeamFilter] = useState<TeamFilter>('all');
  const [showAddAthlete, setShowAddAthlete] = useState(false);

  // Fetch athletes for the current coach
  useEffect(() => {
    async function fetchAthletes() {
      if (!profile?.id) return;
      
      setIsLoading(true);
      try {
        // Get athletes linked to this coach through coach_athletes table
        const { data, error } = await supabase
          .from('coach_athletes')
          .select(`
            athlete_id,
            joined_at,
            status,
            profiles!athlete_id(id, full_name, email, avatar_url)
          `)
          .eq('coach_id', profile.id);

        if (error) throw error;
        
        if (!data) {
          setAthletes([]);
          return;
        }

        // Transform data to match the Athlete type
        const formattedAthletes = data.map((item: any) => ({
          id: item.profiles.id,
          full_name: item.profiles.full_name,
          email: item.profiles.email,
          avatar_url: item.profiles.avatar_url,
          joined_at: item.joined_at,
          status: item.status,
          level: 'beginner' as AthleteLevel, // Default value, can be updated later
        }));

        setAthletes(formattedAthletes);
      } catch (error) {
        console.error('Error fetching athletes:', error);
      } finally {
        setIsLoading(false);
      }
    }

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

  const handleAddAthletes = () => {
    setShowAddAthlete(false);
    // Refresh the athletes list after adding
    if (profile) {
      setIsLoading(true);
      fetchAthletes();
    }
  };

  // Function to fetch athletes (used for refreshing after adding new ones)
  async function fetchAthletes() {
    if (!profile?.id) return;
    
    try {
      // Get athletes linked to this coach through coach_athletes table
      const { data, error } = await supabase
        .from('coach_athletes')
        .select(`
          athlete_id,
          joined_at,
          status,
          profiles!athlete_id(id, full_name, email, avatar_url)
        `)
        .eq('coach_id', profile.id);

      if (error) throw error;
      
      if (!data) {
        setAthletes([]);
        return;
      }

      // Transform data to match the Athlete type
      const formattedAthletes = data.map((item: any) => ({
        id: item.profiles.id,
        full_name: item.profiles.full_name,
        email: item.profiles.email,
        avatar_url: item.profiles.avatar_url,
        joined_at: item.joined_at,
        status: item.status,
        level: 'beginner' as AthleteLevel, // Default value, can be updated later
      }));

      setAthletes(formattedAthletes);
    } catch (error) {
      console.error('Error fetching athletes:', error);
    } finally {
      setIsLoading(false);
    }
  }

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

      {/* Filters and Search */}
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

      {/* Athletes List */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center">Loading athletes...</div>
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
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
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
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      athlete.status === 'active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {athlete.status || "Active"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(athlete.joined_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/coach/athletes/${athlete.id}`}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                    >
                      View Profile
                    </Link>
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