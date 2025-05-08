import { differenceInDays, format } from 'date-fns';
import { Calendar, Plus, Users } from 'lucide-react';
import { useState } from 'react';
import { useWorkoutStore } from '../../lib/workout';

export function ProgramSelector() {
  const { programs, selectedProgramId, selectProgram, createProgram } = useWorkoutStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newProgramName, setNewProgramName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgramName || !startDate || !endDate) return;

    // Compute number of weeks based on dates
    const daysDiff = differenceInDays(new Date(endDate), new Date(startDate));
    const weekCount = Math.ceil(daysDiff / 7);

    await createProgram({
      name: newProgramName,
      startDate,
      endDate,
      status: 'draft',
      weekCount,
      days: {},
      assignedTo: { athletes: [], teams: [] },
    });

    setIsCreating(false);
    setNewProgramName('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Programs
          </h2>
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Program
          </button>
        </div>

        {isCreating && (
          <form onSubmit={handleCreateProgram} className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="program-name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Program Name
              </label>
              <input
                type="text"
                id="program-name"
                value={newProgramName}
                onChange={(e) => setNewProgramName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm px-3 py-2"
                placeholder="e.g., March 2025 - Competition Team"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="start-date"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Start Date
                </label>
                <input
                  type="date"
                  id="start-date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm px-3 py-2"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="end-date"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  End Date
                </label>
                <input
                  type="date"
                  id="end-date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm px-3 py-2"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Create Program
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="p-4">
        <div className="space-y-2">
          {Object.values(programs).map((program) => (
            <button
              key={program.id}
              onClick={() => selectProgram(program.id)}
              className={`w-full text-left p-3 rounded-md transition-colors ${
                selectedProgramId === program.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {program.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {format(new Date(program.startDate), 'MMM d')} -{' '}
                    {format(new Date(program.endDate), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs">
                    {Object.keys(program.days).length} days
                  </span>
                  <Users className="h-4 w-4 ml-2" />
                  <span className="text-xs">
                    {program.assignedTo.athletes.length +
                      program.assignedTo.teams.length}{' '}
                    assigned
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}