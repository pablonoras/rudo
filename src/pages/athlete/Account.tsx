/**
 * src/pages/athlete/Account.tsx
 * 
 * Athlete account settings page that allows athletes to manage their profile and security settings.
 * Coach management is now integrated within the UserProfile component.
 */

import { ArrowLeft } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import UserProfile from '../../components/account/UserProfile';

export function AthleteAccount() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Account Settings
        </h1>
        <RouterLink
          to="/athlete"
          className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Calendar
        </RouterLink>
      </div>
      
      {/* User Profile Section - includes coaches for athletes */}
      <UserProfile role="athlete" />
    </div>
  );
} 