import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, Users, Trash2, ArrowRight } from 'lucide-react';
import { useWorkoutStore } from '../../lib/workout';
import { format, parseISO } from 'date-fns';

export function ProgramDashboard() {
  const { programs, createProgram, deleteProgram } = useWorkoutStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newProgramName, setNewProgramName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleCreateProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgramName || !startDate || !endDate) return;

    createProgram({
      name: newProgramName,
      startDate,
      endDate,
      days: {},
      assignedTo: { athletes: [], teams: [] },
    });

    setIsCreating(false);
    setNewProgramName('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Programs
        </h1>
        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Program
        </button>
      </div>

      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <form onSubmit={handleCreateProgram} className="p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Create New Program
              </h2>

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

              <div className="flex justify-end space-x-3 mt-6">
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
          </div>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Object.values(programs).map((program) => (
          <div
            key={program.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {program.name}
                </h3>
                <button
                  onClick={() => deleteProgram(program.id)}
                  className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {format(parseISO(program.startDate), 'MMM d')} -{' '}
                {format(parseISO(program.endDate), 'MMM d, yyyy')}
              </p>

              <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{Object.keys(program.days).length} workouts</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span>
                    {program.assignedTo.athletes.length +
                      program.assignedTo.teams.length}{' '}
                    assigned
                  </span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <Link
                  to={`/coach/program/${program.id}`}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm inline-flex items-center"
                >
                  View Program
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
                <Link
                  to={`/coach/program/${program.id}/assign`}
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 inline-flex items-center"
                >
                  <Users className="h-4 w-4 mr-1" />
                  Assign
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}