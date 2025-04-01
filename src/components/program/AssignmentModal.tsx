import { useState, useMemo } from 'react';
import { Search, Users, X, AlertTriangle, MessageSquare } from 'lucide-react';
import type { Program } from '../../lib/workout';
import { useAthleteStore } from '../../lib/athlete';
import { sampleTeams } from '../../lib/sampleData';

interface AssignmentModalProps {
  program: Program;
  onClose: () => void;
  onAssign: (data: {
    athletes: string[];
    teams: string[];
    message?: string;
    replaceExisting: boolean;
  }) => void;
}

export function AssignmentModal({ program, onClose, onAssign }: AssignmentModalProps) {
  const athletes = useAthleteStore((state) => Object.values(state.athletes));
  const [search, setSearch] = useState('');
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>(program.assignedTo.athletes);
  const [selectedTeams, setSelectedTeams] = useState<string[]>(program.assignedTo.teams);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState<'all' | 'athletes' | 'teams'>('all');
  const [showConflictWarning, setShowConflictWarning] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(false);

  // Mock data for assignment history
  const assignmentHistory = {
    'athlete-1': {
      status: 'active',
      currentProgram: 'Competition Prep 2024',
      completedPrograms: ['Summer Strength 2023', 'Fall Conditioning 2023'],
    },
    'athlete-2': {
      status: 'completed',
      currentProgram: null,
      completedPrograms: ['Winter Program 2023'],
    },
  };

  // Filter athletes and teams based on search
  const filteredAthletes = useMemo(() => {
    return athletes.filter((athlete) =>
      (`${athlete.firstName} ${athlete.lastName}`.toLowerCase() + athlete.email.toLowerCase()).includes(
        search.toLowerCase()
      )
    );
  }, [athletes, search]);

  const filteredTeams = useMemo(() => {
    return sampleTeams.filter((team) =>
      (team.name.toLowerCase() + team.description.toLowerCase()).includes(
        search.toLowerCase()
      )
    );
  }, [search]);

  const handleAssign = () => {
    // Check for conflicts
    const hasConflicts = selectedAthletes.some(
      (id) => assignmentHistory[id as keyof typeof assignmentHistory]?.status === 'active'
    );

    if (hasConflicts && !replaceExisting) {
      setShowConflictWarning(true);
      return;
    }

    onAssign({
      athletes: selectedAthletes,
      teams: selectedTeams,
      message: message.trim() || undefined,
      replaceExisting,
    });
    onClose();
  };

  const toggleAthlete = (id: string) => {
    setSelectedAthletes((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const toggleTeam = (id: string) => {
    setSelectedTeams((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const getAssignmentStatus = (athleteId: string) => {
    const history = assignmentHistory[athleteId as keyof typeof assignmentHistory];
    if (!history) return null;

    if (history.status === 'active') {
      return (
        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
          Active: {history.currentProgram}
        </span>
      );
    }

    if (history.completedPrograms.length > 0) {
      return (
        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">
          {history.completedPrograms.length} completed
        </span>
      );
    }

    return null;
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
              placeholder="Search athletes or teams..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-sm rounded-full ${
                filter === 'all'
                  ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('athletes')}
              className={`px-3 py-1.5 text-sm rounded-full ${
                filter === 'athletes'
                  ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              Athletes
            </button>
            <button
              onClick={() => setFilter('teams')}
              className={`px-3 py-1.5 text-sm rounded-full ${
                filter === 'teams'
                  ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              Teams
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {(filter === 'all' || filter === 'teams') && (
            <div className="mb-6">
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
                        {team.memberCount} members · {team.description}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedTeams.includes(team.id)}
                      onChange={() => toggleTeam(team.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {(filter === 'all' || filter === 'athletes') && (
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
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {athlete.firstName} {athlete.lastName}
                        </div>
                        {getAssignmentStatus(athlete.id)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {athlete.email} · {athlete.level}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedAthletes.includes(athlete.id)}
                      onChange={() => toggleAthlete(athlete.id)}
                      className="ml-4 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </label>
                ))}
              </div>
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

          {showConflictWarning && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/50 rounded-md">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                <div className="ml-3">
                  <p className="text-sm text-yellow-700 dark:text-yellow-200">
                    Some selected athletes already have active programs assigned.
                  </p>
                  <div className="mt-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={replaceExisting}
                        onChange={(e) => setReplaceExisting(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-yellow-700 dark:text-yellow-200">
                        Replace existing assignments
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {selectedAthletes.length} athletes and {selectedTeams.length} teams selected
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
                disabled={selectedAthletes.length === 0 && selectedTeams.length === 0}
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