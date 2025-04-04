import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Users,
  BarChart,
  Clock,
  Share2,
  Trash2,
  Edit2,
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { useWorkoutStore } from '../../lib/workout';

export function ProgramOverview() {
  const navigate = useNavigate();
  const { programs, selectedProgramId, deleteProgram } = useWorkoutStore();
  const [isDeleting, setIsDeleting] = useState(false);

  const selectedProgram = selectedProgramId ? programs[selectedProgramId] : null;

  if (!selectedProgram) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
          No Program Selected
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Select or create a program to view details.
        </p>
      </div>
    );
  }

  const programDuration = differenceInDays(
    parseISO(selectedProgram.endDate),
    parseISO(selectedProgram.startDate)
  );

  const totalWorkouts = Object.keys(selectedProgram.days).length;
  const totalAssigned =
    selectedProgram.assignedTo.athletes.length +
    selectedProgram.assignedTo.teams.length;

  const handleDelete = async () => {
    setIsDeleting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    deleteProgram(selectedProgram.id);
    setIsDeleting(false);
    navigate('/coach/calendar');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {selectedProgram.name}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {format(parseISO(selectedProgram.startDate), 'MMMM d, yyyy')} -{' '}
                {format(parseISO(selectedProgram.endDate), 'MMMM d, yyyy')}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                <Share2 className="h-4 w-4 mr-2" />
                Share Program
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-600 text-sm font-medium rounded-md text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 overflow-hidden rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Duration
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                          {programDuration} days
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 overflow-hidden rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Total Workouts
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                          {totalWorkouts}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 overflow-hidden rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Assigned To
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                          {totalAssigned}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 overflow-hidden rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BarChart className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Completion Rate
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                          0%
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Recent Activity
          </h3>
          <div className="mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No recent activity
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}