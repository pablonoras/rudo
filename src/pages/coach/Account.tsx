/**
 * src/pages/coach/Account.tsx
 * 
 * Coach account settings page that allows coaches to manage their profile and security settings.
 */

import UserProfile from '../../components/account/UserProfile';

export function CoachAccount() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Account Settings
      </h1>
      
      <UserProfile role="coach" />
    </div>
  );
} 