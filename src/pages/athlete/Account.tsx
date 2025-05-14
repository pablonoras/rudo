/**
 * src/pages/athlete/Account.tsx
 * 
 * Athlete account settings page that allows athletes to manage their profile and security settings.
 */

import UserProfile from '../../components/account/UserProfile';

export function AthleteAccount() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Account Settings
      </h1>
      
      <UserProfile role="athlete" />
    </div>
  );
} 