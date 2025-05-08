import { MessageSquare, Search, Users, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAthleteStore } from '../../lib/athlete';
import { supabase } from '../../lib/supabase';
import type { Program } from '../../lib/workout';

interface AssignmentModalProps {
  program: Program;
  onClose: () => void;
  onAssign: (athletes: string[], message?: string) => void;
}

export function AssignmentModal({ program, onClose, onAssign }: AssignmentModalProps) {
  const athletes = useAthleteStore((state) => Object.values(state.athletes));
  const [search, setSearch] = useState('');
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>(program.assignedTo.athletes);
  const [message, setMessage] = useState('');
  const [coachAthletes, setCoachAthletes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch athletes assigned to the coach
  useEffect(() => {
    const fetchCoachAthletes = async () => {
      setLoading(true);
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('No authenticated user found');
          setLoading(false);
          return;
        }
        
        console.log('Current authenticated user ID:', user.id);
        
        // Get all athletes with active status for the current coach
        const { data, error } = await supabase
          .from('coach_athletes')
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
          .eq('coach_id', user.id)
          .eq('status', 'active');
        
        if (error) {
          console.error('Error fetching coach athletes:', error);
        } else {
          console.log('Fetched coach athletes:', data);
          if (!data || data.length === 0) {
            console.log('No active athletes found for this coach');
          }
          setCoachAthletes(data || []);
        }
      } catch (error) {
        console.error('Unexpected error in fetchCoachAthletes:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCoachAthletes();
  }, []);

  // Filter athletes based on search
  const filteredAthletes = useMemo(() => {
    return coachAthletes.filter((ca) => {
      const profile = ca.profiles;
      if (!profile) {
        console.warn('Coach athlete record missing profile data:', ca);
        return false;
      }
      return (profile.full_name?.toLowerCase().includes(search.toLowerCase()) || 
              profile.email?.toLowerCase().includes(search.toLowerCase()));
    });
  }, [coachAthletes, search]);

  const handleAssign = () => {
    if (selectedAthletes.length === 0) {
      alert('Please select at least one athlete to assign the program to.');
      return;
    }
    onAssign(selectedAthletes, message.trim() || undefined);
    onClose();
  };

  const toggleAthlete = (id: string) => {
    console.log('Toggling athlete with ID:', id);
    setSelectedAthletes((prev) => {
      const newSelection = prev.includes(id) 
        ? prev.filter((a) => a !== id) 
        : [...prev, id];
      console.log('Updated selection:', newSelection);
      return newSelection;
    });
  };

  const isAthleteAssigned = (athleteId: string) => {
    return program.assignedTo.athletes.includes(athleteId);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Assign Program: {program.name}
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
              placeholder="Search athletes..."
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
                Athletes ({filteredAthletes.length})
              </h3>
              {filteredAthletes.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  {search ? "No athletes match your search" : "No active athletes found. Make sure you have athletes with 'active' status."}
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredAthletes.map((ca) => {
                    const profile = ca.profiles;
                    const isAssigned = isAthleteAssigned(profile.id);
                    
                    return (
                      <div
                        key={profile.id}
                        className={`flex items-center justify-between p-2 rounded-md ${
                          isAssigned 
                            ? 'bg-blue-50 dark:bg-blue-900/20' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {profile.full_name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {profile.email}
                          </div>
                        </div>
                        {!isAssigned && (
                          <input
                            type="checkbox"
                            checked={selectedAthletes.includes(profile.id)}
                            onChange={() => toggleAthlete(profile.id)}
                            className="ml-4 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        )}
                        {isAssigned && (
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                            Assigned
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Assignment Message (optional)
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a message for the assigned athletes..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 min-h-[80px]"
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {selectedAthletes.length} athletes selected
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={selectedAthletes.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Users className="h-4 w-4 mr-2" />
                Assign Program
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}