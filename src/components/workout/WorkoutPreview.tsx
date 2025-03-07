import { X } from 'lucide-react';
import type { DayProgram } from '../../lib/workout';
import { format } from 'date-fns';

interface WorkoutPreviewProps {
  workout: DayProgram;
  onClose: () => void;
}

export function WorkoutPreview({ workout, onClose }: WorkoutPreviewProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Workout Preview - {format(new Date(workout.date), 'MMMM d, yyyy')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="prose dark:prose-invert max-w-none">
            {workout.blocks.map((block) => (
              <div key={block.id} className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold m-0">{block.title}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full capitalize
                      ${
                        block.type === 'warmup'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : block.type === 'skill'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          : block.type === 'strength'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : block.type === 'wod'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}
                  >
                    {block.type}
                  </span>
                </div>

                {block.notes && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                    {block.notes}
                  </p>
                )}

                {block.exercises.length > 0 && (
                  <ul className="mt-2 space-y-1 list-none pl-0">
                    {block.exercises.map((exercise) => (
                      <li
                        key={exercise.id}
                        className="flex items-center text-sm bg-gray-50 dark:bg-gray-700/50 p-2 rounded"
                      >
                        <span className="text-gray-700 dark:text-gray-300">
                          {exercise.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}