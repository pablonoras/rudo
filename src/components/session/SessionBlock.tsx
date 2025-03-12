import { useState } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Copy,
  MoreVertical,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { Session, WorkoutBlock } from '../../lib/workout';
import { useModal } from '../../contexts/ModalContext';

interface SessionBlockProps {
  session: Session;
  onUpdate: (updates: Partial<Session>) => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  onAddWorkout: (workout: WorkoutBlock) => void;
  onEditWorkout?: (workoutId: string, updates: Partial<WorkoutBlock>) => void;
  onDeleteWorkout?: (workoutId: string) => void;
  onDuplicateWorkout?: (workoutId: string) => void;
}

export function SessionBlock({
  session,
  onUpdate,
  onDelete,
  onDuplicate,
  onAddWorkout,
  onEditWorkout,
  onDeleteWorkout,
  onDuplicateWorkout,
}: SessionBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [activeWorkoutMenu, setActiveWorkoutMenu] = useState<string | null>(null);
  const { showSessionForm, showWorkoutForm } = useModal();

  const handleEditSession = () => {
    showSessionForm({
      title: "Edit Session",
      initialData: {
        name: session.name,
        type: session.type,
        duration: session.duration,
        startTime: session.startTime,
      },
      onSave: onUpdate
    });
    setShowMenu(false);
  };

  const handleAddWorkout = () => {
    showWorkoutForm({
      title: "Add Workout",
      onSave: onAddWorkout
    });
  };

  const handleEditWorkout = (workout: WorkoutBlock) => {
    if (!onEditWorkout) return;
    showWorkoutForm({
      title: "Edit Workout",
      initialData: workout,
      onSave: (updates) => onEditWorkout(workout.id, updates)
    });
    setActiveWorkoutMenu(null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
      <div 
        className="p-2 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {session.name}
          </h3>
        </div>
        
        <div className="relative" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <MoreVertical className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
              <button
                onClick={handleEditSession}
                className="w-full px-3 py-1.5 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              >
                <Edit2 className="h-3 w-3 mr-2" />
                Edit
              </button>
              {onDuplicate && (
                <button
                  onClick={() => {
                    onDuplicate();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <Copy className="h-3 w-3 mr-2" />
                  Duplicate
                </button>
              )}
              <button
                onClick={() => {
                  onDelete();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-1.5 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-2">
          <div className="space-y-2">
            {session.workouts.map((workout) => (
              <div
                key={workout.id}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-2 group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {workout.name}
                    </h4>
                  </div>
                  <div className="relative" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setActiveWorkoutMenu(activeWorkoutMenu === workout.id ? null : workout.id)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </button>

                    {activeWorkoutMenu === workout.id && (
                      <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                        {onEditWorkout && (
                          <button
                            onClick={() => handleEditWorkout(workout)}
                            className="w-full px-3 py-1.5 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                          >
                            <Edit2 className="h-3 w-3 mr-2" />
                            Edit
                          </button>
                        )}
                        {onDuplicateWorkout && (
                          <button
                            onClick={() => {
                              onDuplicateWorkout(workout.id);
                              setActiveWorkoutMenu(null);
                            }}
                            className="w-full px-3 py-1.5 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                          >
                            <Copy className="h-3 w-3 mr-2" />
                            Duplicate
                          </button>
                        )}
                        {onDeleteWorkout && (
                          <button
                            onClick={() => {
                              onDeleteWorkout(workout.id);
                              setActiveWorkoutMenu(null);
                            }}
                            className="w-full px-3 py-1.5 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
                          >
                            <Trash2 className="h-3 w-3 mr-2" />
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono">
                  {workout.description}
                </div>
                {workout.notes && (
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Notes: </span>
                    {workout.notes}
                  </div>
                )}
              </div>
            ))}

            <button
              onClick={handleAddWorkout}
              className="w-full flex items-center justify-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Workout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}