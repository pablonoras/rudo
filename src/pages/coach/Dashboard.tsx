import { useState } from 'react';
import {
  Calendar,
  Users,
  BarChart2,
  TrendingUp,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWorkoutStore } from '../../lib/workout';
import { format, parseISO } from 'date-fns';

export function CoachDashboard() {
  const { programs } = useWorkoutStore();
  const [timeRange] = useState<'week' | 'month'>('week');

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Calculate dashboard metrics
  const activePrograms = Object.values(programs).filter(
    (p) => p.status === 'published'
  );
  const totalAthletes = activePrograms.reduce(
    (sum, p) => sum + p.assignedTo.athletes.length,
    0
  );
  const totalTeams = activePrograms.reduce(
    (sum, p) => sum + p.assignedTo.teams.length,
    0
  );
  const totalWorkouts = activePrograms.reduce(
    (sum, p) => sum + Object.keys(p.days).length,
    0
  );

  // Get recent programs
  const recentPrograms = Object.values(programs)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {getGreeting()}, Coach 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Here's what's happening with your athletes and programs today
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          to="/coach/programs"
          className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Active Programs
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                      {activePrograms.length}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </Link>

        <Link
          to="/coach/athletes"
          className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Athletes
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                      {totalAthletes}
                    </div>
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      across {totalTeams} teams
                    </span>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </Link>

        <Link
          to="/coach/programs"
          className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
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
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      this {timeRange}
                    </span>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </Link>

        <Link
          to="/coach/athletes"
          className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Completion Rate
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                      92%
                    </div>
                    <span className="ml-2 text-sm text-emerald-600 dark:text-emerald-400">
                      +2.5%
                    </span>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Programs */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Recent Programs
            </h2>
            <Link
              to="/coach/programs"
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 flex items-center"
            >
              View all
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-4">
            {recentPrograms.map((program) => (
              <Link
                key={program.id}
                to={`/coach/program/${program.id}`}
                className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {program.name}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {format(parseISO(program.startDate), 'MMM d')} -{' '}
                      {format(parseISO(program.endDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{program.weekCount} weeks</span>
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
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}