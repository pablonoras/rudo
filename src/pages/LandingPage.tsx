import { Link } from 'react-router-dom';
import { Dumbbell, Users } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <Dumbbell className="h-16 w-16 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          CrossFit Coach Platform
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Program, track, and manage your CrossFit workouts
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