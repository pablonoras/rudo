import { useState } from 'react';
import { format } from 'date-fns';
import { Copy, Trash2, Edit2, Share2, Calendar } from 'lucide-react';
import type { WorkoutBlock, WorkoutType } from '../../lib/workout';

interface WorkoutCardProps {
  workout: WorkoutBlock;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onCopyPattern?: () => void;
}

export function WorkoutCard({
  workout,
  onEdit,
  onDelete,
  onDuplicate,
  onCopyPattern,
}: WorkoutCardProps) {
  const [showActions, setShowActions] = useState(false);

  const getTypeColor = (type: WorkoutType) => {
    const colors = {
      warmup: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
      strength: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 border-red-200 dark:border-red-800',
      wod: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border-blue-200 dark:border-blue-800',
      cooldown: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 border-green-200 dark:border-green-800',
    };
    return colors[type];
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
    <div
      className={`relative p-4 rounded-lg border-l-4 ${getTypeColor(
        workout.type
      )} bg-white dark:bg-gray-800 shadow-sm group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {workout.name}
          </h3>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getTypeColor(
                workout.type
              )}`}
            >
              {workout.type}
            </span>
            {workout.stimulus && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200">
                {workout.stimulus}
              </span>
            )}
            {workout.format && (
              <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                {formatHeader()}
              </span>
            )}
          </div>
        </div>

        <div
          className={`flex items-center space-x-2 transition-opacity ${
            showActions ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {onCopyPattern && (
            <button
              onClick={onCopyPattern}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Copy to pattern (e.g., M/W/F)"
            >
              <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </button>
          )}
          <button
            onClick={onDuplicate}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Duplicate workout"
          >
            <Copy className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
          <button
            onClick={onEdit}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Edit workout"
          >
            <Edit2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Delete workout"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </button>
        </div>
      </div>

      {workout.goal && (
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">Goal: </span>
          {workout.goal}
        </div>
      )}

      <div className="mt-3 font-mono text-sm whitespace-pre-wrap text-gray-900 dark:text-gray-100">
        {workout.description}
      </div>

      {workout.scaling && (
        <div className="mt-2 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Scaling:{' '}
          </span>
          <span className="text-gray-600 dark:text-gray-400">{workout.scaling}</span>
        </div>
      )}

      {workout.notes && (
        <div className="mt-2 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Notes:{' '}
          </span>
          <span className="text-gray-600 dark:text-gray-400">{workout.notes}</span>
        </div>
      )}
    </div>
  );
}