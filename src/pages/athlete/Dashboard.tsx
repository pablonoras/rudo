import { useState } from 'react';
import { format, parseISO, isToday, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, CheckCircle } from 'lucide-react';
import { useWorkoutStore } from '../../lib/workout';

function WorkoutCard({ workout }: { workout: any }) {
  const [isCompleted, setIsCompleted] = useState(false);

  const getTypeColor = (type: string) => {
    const colors = {
      warmup: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      strength: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      wod: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      cooldown: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border ${
      isCompleted ? 'border-green-500 dark:border-green-400' : 'border-gray-200 dark:border-gray-700'
    }`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {workout.name}
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-full capitalize mt-1 inline-block ${getTypeColor(workout.type)}`}>
              {workout.type}
            </span>
          </div>
          <button
            onClick={() => setIsCompleted(!isCompleted)}
            className={`p-1 rounded-full transition-colors ${
              isCompleted
                ? 'text-green-500 dark:text-green-400'
                : 'text-gray-400 hover:text-gray-500 dark:hover:text-gray-300'
            }`}
          >
            <CheckCircle className="h-6 w-6" />
          </button>
        </div>
        
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
          {workout.description}
        </div>
      </div>
    </div>
  );
}

export function AthleteDashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { programs } = useWorkoutStore();

  // Mock assigned program for demonstration
  const assignedProgram = Object.values(programs)[0];

  const navigateDay = (direction: 'prev' | 'next') => {
    setSelectedDate(direction === 'prev' ? subDays(selectedDate, 1) : addDays(selectedDate, 1));
  };

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const dayWorkouts = assignedProgram?.days[dateStr]?.workouts || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {isToday(selectedDate) ? "Today's Workouts" : format(selectedDate, 'MMMM d, yyyy')}
        </h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateDay('prev')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            title="Go to today"
          >
            <Calendar className="h-5 w-5" />
          </button>
          <button
            onClick={() => navigateDay('next')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {assignedProgram ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {assignedProgram.name}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {format(parseISO(assignedProgram.startDate), 'MMM d')} -{' '}
            {format(parseISO(assignedProgram.endDate), 'MMM d, yyyy')}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            No Active Program
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            You don't have any assigned programs yet.
          </p>
        </div>
      )}

      {dayWorkouts.length > 0 ? (
        <div className="space-y-4">
          {dayWorkouts.map((workout) => (
            <WorkoutCard key={workout.id} workout={workout} />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No workouts scheduled for this day
          </p>
        </div>
      )}
    </div>
  );
}