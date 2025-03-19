import { useState } from 'react';
import { X, Search, Check } from 'lucide-react';
import type { DayProgram } from '../../lib/workout';
import { format } from 'date-fns';

interface AssignWorkoutProps {
  workout: DayProgram;
  onClose: () => void;
}

// Mock data for demonstration
const MOCK_ATHLETES = [
  { id: '1', name: 'John Doe', email: 'john@example.com' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
  { id: '3', name: 'Mike Johnson', email: 'mike@example.com' },
];

const MOCK_TEAMS = [
  { id: '1', name: 'Competition Team', memberCount: 8 },
  { id: '2', name: 'Masters Group', memberCount: 12 },
  { id: '3', name: 'Beginners', memberCount: 15 },
];

export function AssignWorkout({ workout, onClose }: AssignWorkoutProps) {
  const [search, setSearch] = useState('');
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  const filteredAthletes = MOCK_ATHLETES.filter((athlete) =>
    athlete.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTeams = MOCK_TEAMS.filter((team) =>
    team.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAssign = async () => {
    setIsAssigning(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsAssigning(false);
    onClose();
  };

  const toggleAthlete = (id: string) => {
    setSelectedAthletes((prev) =>
      prev.includes(id)
        ? prev.filter((athleteId) => athleteId !== id)
        : [...prev, id]
    );
  };

  const toggleTeam = (id: string) => {
    setSelectedTeams((prev) =>
      prev.includes(id) ? prev.filter((teamId) => teamId !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Assign Workout - {format(new Date(workout.date), 'MMMM d, yyyy')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search athletes or teams..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Teams
              </h3>
              <div className="space-y-2">
                {filteredTeams.map((team) => (
                  <label
                    key={team.id}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {team.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {team.memberCount} members
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded border ${
                        selectedTeams.includes(team.id)
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-300 dark:border-gray-600'
                      } flex items-center justify-center`}
                      onClick={() => toggleTeam(team.id)}
                    >
                      {selectedTeams.includes(team.id) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Individual Athletes
              </h3>
              <div className="space-y-2">
                {filteredAthletes.map((athlete) => (
                  <label
                    key={athlete.id}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {athlete.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {athlete.email}
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded border ${
                        selectedAthletes.includes(athlete.id)
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-300 dark:border-gray-600'
                      } flex items-center justify-center`}
                      onClick={() => toggleAthlete(athlete.id)}
                    >
                      {selectedAthletes.includes(athlete.id) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleAssign}
            disabled={
              isAssigning ||
              (selectedAthletes.length === 0 && selectedTeams.length === 0)
            }
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAssigning ? 'Assigning...' : 'Assign Workout'}
          </button>
        </div>
      </div>
    </div>
  );
}