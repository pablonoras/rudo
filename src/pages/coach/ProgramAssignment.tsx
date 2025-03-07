import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Check } from 'lucide-react';
import { useWorkoutStore } from '../../lib/workout';

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

export function ProgramAssignment() {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  const { programs, assignProgram } = useWorkoutStore();
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  const program = programId ? programs[programId] : null;

  const handleAssign = async () => {
    if (!programId) return;

    setIsAssigning(true);
    await assignProgram(programId, selectedAthletes, selectedTeams);
    setIsAssigning(false);
    navigate(`/coach/program/${programId}`);
  };

  if (!program) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500 dark:text-gray-400">Program not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Assign Program
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Select athletes or teams to assign to {program.name}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Teams
            </h2>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {MOCK_TEAMS.map((team) => {
                const isSelected = selectedTeams.includes(team.id);
                return (
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
                        isSelected
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-300 dark:border-gray-600'
                      } flex items-center justify-center`}
                      onClick={() =>
                        setSelectedTeams(
                          isSelected
                            ? selectedTeams.filter((id) => id !== team.id)
                            : [...selectedTeams, team.id]
                        )
                      }
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Individual Athletes
            </h2>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {MOCK_ATHLETES.map((athlete) => {
                const isSelected = selectedAthletes.includes(athlete.id);
                return (
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
                        isSelected
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-300 dark:border-gray-600'
                      } flex items-center justify-center`}
                      onClick={() =>
                        setSelectedAthletes(
                          isSelected
                            ? selectedAthletes.filter((id) => id !== athlete.id)
                            : [...selectedAthletes, athlete.id]
                        )
                      }
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          onClick={() => navigate(`/coach/program/${programId}`)}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600"
        >
          Cancel
        </button>
        <button
          onClick={handleAssign}
          disabled={
            isAssigning ||
            (selectedAthletes.length === 0 && selectedTeams.length === 0)
          }
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAssigning ? (
            'Assigning...'
          ) : (
            <>
              <Users className="h-4 w-4 mr-2" />
              Assign Program
            </>
          )}
        </button>
      </div>
    </div>
  );
}