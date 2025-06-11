/**
 * src/pages/demo/Dashboard.tsx
 * 
 * Demo coach dashboard showing fake data for demonstration purposes
 * This gives potential users a feel for the full coach experience
 */

import { format, parseISO } from 'date-fns';
import { Calendar, Clock, TrendingUp, Trophy, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../lib/i18n/context';
import { useWorkoutStore } from '../../lib/workout';

export function DemoCoachDashboard() {
  const { programs } = useWorkoutStore();
  const { t } = useI18n();

  // Mock data for demo
  const totalAthletes = 24;
  const totalTeams = 3;
  const recentPrograms = programs.slice(0, 3);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('good-morning');
    if (hour < 17) return t('good-afternoon');
    return t('good-evening');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {getGreeting()}, Coach! 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('welcome-dashboard')} (Demo Mode)
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          to="/demo/athletes"
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
                    {t('total-athletes')}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                      {totalAthletes}
                    </div>
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      {t('across-teams').replace('{count}', totalTeams.toString())}
                    </span>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </Link>

        <div className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Programs
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                      {programs.length}
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
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Completion Rate
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                      87%
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
                <Trophy className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    PRs This Week
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                      15
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Programs */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Recent Programs
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {recentPrograms.map((program) => (
              <Link
                key={program.id}
                to={`/demo/program/${program.id}`}
                className="block p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
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
                  <div className="flex flex-col sm:flex-row items-end sm:items-center sm:space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center mb-1 sm:mb-0">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{program.weekCount} {t('weeks')}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      <span>
                        {program.assignedTo.athletes.length +
                          program.assignedTo.teams.length}{' '}
                        {t('assigned')}
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