import { format } from 'date-fns';
import type { WorkoutBlock } from '../../lib/workout';

interface WorkoutDisplayProps {
  workout: WorkoutBlock;
}

export function WorkoutDisplay({ workout }: WorkoutDisplayProps) {
  const getTypeColor = (type: string) => {
    const colors = {
      warmup: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      strength: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      wod: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      cooldown: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatHeader = () => {
    if (workout.format === 'amrap') {
      return `AMRAP ${workout.timeLimit}`;
    }
    if (workout.format === 'forTime') {
      return `For Time${workout.timeLimit ? ` (${workout.timeLimit} min cap)` : ''}`;
    }
    if (workout.format === 'emom') {
      return `EMOM ${workout.rounds}`;
    }
    if (workout.format === 'tabata') {
      return `Tabata (${workout.rounds} rounds)`;
    }
    return workout.format?.toUpperCase() || '';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {workout.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${getTypeColor(workout.type)}`}>
              {workout.type}
            </span>
            {workout.format && (
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {formatHeader()}
              </span>
            )}
          </div>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {format(new Date(workout.createdAt), 'MMM d, yyyy')}
        </div>
      </div>

      <div className="space-y-4">
        <div className="font-mono whitespace-pre-wrap text-gray-900 dark:text-gray-100">
          {workout.description}
        </div>

        {workout.scaling && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Scaling Options
            </h4>
            <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {workout.scaling}
            </div>
          </div>
        )}

        {workout.notes && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </h4>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {workout.notes}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}