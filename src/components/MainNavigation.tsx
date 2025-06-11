import {
    Calendar,
    Dumbbell,
    Home,
    Settings,
    Users
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useProfile } from '../contexts/ProfileContext';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

function NavItem({ to, icon, label }: NavItemProps) {
  return (
    <li>
      <NavLink
        to={to}
        className={({ isActive }) =>
          `flex items-center px-4 py-2 mt-2 text-sm rounded-lg ${
            isActive
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`
        }
      >
        <span className="flex items-center justify-center w-6 h-6 mr-2">
          {icon}
        </span>
        <span>{label}</span>
      </NavLink>
    </li>
  );
}

export function MainNavigation() {
  const { profile } = useProfile();
  const role = profile?.user_type || 'coach'; // Default to coach if not available
  
  const coachNavItems = [
    { to: '/coach', icon: <Home size={18} />, label: 'Dashboard' },
    { to: '/coach/programs', icon: <Calendar size={18} />, label: 'Programs' },
    { to: '/coach/workouts', icon: <Dumbbell size={18} />, label: 'Workouts' },
    { to: '/coach/athletes', icon: <Users size={18} />, label: 'Athletes' },
    { to: '/coach/account', icon: <Settings size={18} />, label: 'Account' }
  ];
  
  const athleteNavItems = [
    { to: '/athlete', icon: <Home size={18} />, label: 'Dashboard' },
    { to: '/athlete/account', icon: <Settings size={18} />, label: 'Account' }
  ];
  
  const navItems = role === 'athlete' ? athleteNavItems : coachNavItems;
  
  return (
    <nav className="mt-8">
      <ul className="space-y-1">
        {navItems.map((item) => (
          <NavItem
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label}
          />
        ))}
      </ul>
    </nav>
  );
} 