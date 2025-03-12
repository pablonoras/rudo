import { Link } from 'react-router-dom';
import { Users, Dumbbell } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <div className="mb-4">
          <span className="text-6xl font-black tracking-wider text-gray-900 dark:text-gray-100">
            RUDO
          </span>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Program, track, and manage your workouts
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <Link
          to="/coach"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-6 text-center transition-colors group"
        >
          <Users className="h-8 w-8 mx-auto mb-3 group-hover:scale-110 transition-transform" />
          <h2 className="text-xl font-semibold mb-2">Enter as Coach</h2>
          <p className="text-sm text-blue-100">Create and manage programs</p>
        </Link>

        <Link
          to="/athlete"
          className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg p-6 text-center transition-colors group"
        >
          <Dumbbell className="h-8 w-8 mx-auto mb-3 group-hover:scale-110 transition-transform" />
          <h2 className="text-xl font-semibold mb-2">Enter as Athlete</h2>
          <p className="text-sm text-green-100">View and track workouts</p>
        </Link>
      </div>
    </div>
  );
}