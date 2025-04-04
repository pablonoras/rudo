/**
 * src/pages/coach/Dashboard.tsx
 * 
 * This file contains the actual Coach Dashboard that will display real data from Supabase.
 * Currently shows an empty state that will be populated as the user adds programs and athletes.
 */

import {
  BarChart2,
  Calendar,
  FilePlus,
  Plus,
  PlusCircle,
  UserPlus,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProfile } from '../../contexts/ProfileContext';

export function CoachDashboard() {
  const { profile } = useProfile();

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Get coach name from profile
  const coachName = profile?.full_name || 'Coach';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {getGreeting()}, {coachName} 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Welcome to your dashboard. Here you can manage your athletes and programs.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/coach/programs"
            className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <FilePlus className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Create Program</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Build workout templates</p>
            </div>
          </Link>
          <Link
            to="/coach/athletes"
            className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <UserPlus className="h-6 w-6 text-green-600 dark:text-green-400 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Add Athletes</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Invite people to join</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Empty State: Programs */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Your Programs
            </h2>
            <Link
              to="/coach/programs"
              className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              New Program
            </Link>
          </div>
        </div>
        <div className="p-6 flex flex-col items-center justify-center text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No programs yet</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
            Create your first workout program to start assigning to your athletes and teams.
          </p>
          <Link
            to="/coach/programs"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Program
          </Link>
        </div>
      </div>

      {/* Empty State: Athletes */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Your Athletes
            </h2>
            <Link
              to="/coach/athletes"
              className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              Add Athletes
            </Link>
          </div>
        </div>
        <div className="p-6 flex flex-col items-center justify-center text-center py-12">
          <Users className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No athletes yet</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
            Add athletes to your roster to start assigning programs and tracking their progress.
          </p>
          <Link
            to="/coach/athletes"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Athletes
          </Link>
        </div>
      </div>

      {/* Recent Activity - Will be implemented when data is available */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Recent Activity
          </h2>
        </div>
        <div className="p-6 flex flex-col items-center justify-center text-center py-12">
          <BarChart2 className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No activity yet</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md">
            Your recent activity will appear here once you start creating programs and adding athletes.
          </p>
        </div>
      </div>
    </div>
  );
}