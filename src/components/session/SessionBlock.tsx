import { useState, useRef } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Copy,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react';
import type { Session, WorkoutBlock } from '../../lib/workout';
import { useModal } from '../../contexts/ModalContext';
import { MenuPortal } from '../MenuPortal';

const getWorkoutTypeColor = (type?: string) => {
  if (!type) return 'border-gray-400 bg-gray-50 dark:bg-gray-900/20';
  
  const colors: Record<string, string> = {
    warmup: 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
    strength: 'border-red-400 bg-red-50 dark:bg-red-900/20',
    wod: 'border-blue-400 bg-blue-50 dark:bg-blue-900/20',
    skill: 'border-purple-400 bg-purple-50 dark:bg-purple-900/20',
    cooldown: 'border-green-400 bg-green-50 dark:bg-green-900/20',
  };

  return colors[type.toLowerCase()] || 'border-gray-400 bg-gray-50 dark:bg-gray-900/20';
};

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

interface WorkoutActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

function WorkoutActionButton({ icon, label, onClick, variant = 'default' }: WorkoutActionButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`p-1.5 rounded-full transition-all duration-150 group/button ${
        variant === 'danger' 
          ? 'hover:bg-red-100 dark:hover:bg-red-900/20' 
          : 'hover:bg-gray-200 dark:hover:bg-gray-600'
      }`}
      title={label}
    >
      <span className={`inline-flex items-center ${
        variant === 'danger'
          ? 'text-red-500 group-hover/button:text-red-600 dark:group-hover/button:text-red-400'
          : 'text-gray-500 dark:text-gray-400 group-hover/button:text-gray-700 dark:group-hover/button:text-gray-300'
      }`}>
        {icon}
      </span>
    </button>
  );
}

function WorkoutDetails({ workout }: { workout: WorkoutBlock }) {
  if (!workout.format && !workout.rounds && !workout.goal && !workout.scaling && !workout.notes) {
    return null;
  }

  return (
    <div className="mt-3 pl-4 space-y-3 text-sm">
      {workout.format && (
        <div>
          <span className="font-medium text-gray-700 dark:text-gray-300">Format: </span>
          <span className="text-gray-600 dark:text-gray-400 capitalize">{workout.format}</span>
          {workout.timeLimit && (
            <span className="text-gray-600 dark:text-gray-400"> ({workout.timeLimit} min)</span>
          )}
        </div>
      )}
      
      {workout.rounds && (
        <div>
          <span className="font-medium text-gray-700 dark:text-gray-300">Rounds: </span>
          <span className="text-gray-600 dark:text-gray-400">{workout.rounds}</span>
        </div>
      )}

      {workout.goal && (
        <div>
          <span className="font-medium text-gray-700 dark:text-gray-300">Goal: </span>
          <span className="text-gray-600 dark:text-gray-400">{workout.goal}</span>
        </div>
      )}

      {workout.scaling && (
        <div>
          <span className="font-medium text-gray-700 dark:text-gray-300">Scaling: </span>
          <span className="text-gray-600 dark:text-gray-400">{workout.scaling}</span>
        </div>
      )}

      {workout.notes && (
        <div>
          <span className="font-medium text-gray-700 dark:text-gray-300">Notes: </span>
          <span className="text-gray-600 dark:text-gray-400">{workout.notes}</span>
        </div>
      )}
    </div>
  );
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
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(new Set());
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
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
  };

  const toggleWorkout = (workoutId: string) => {
    setExpandedWorkouts((prev) => {
      const next = new Set(prev);
      if (next.has(workoutId)) {
        next.delete(workoutId);
      } else {
        next.add(workoutId);
      }
      return next;
    });
  };

  const menuItems = [
    {
      id: 'edit',
      label: 'Edit',
      icon: <Edit2 className="h-3.5 w-3.5 mr-2" />,
      onClick: handleEditSession,
      className: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
    },
    onDuplicate && {
      id: 'duplicate',
      label: 'Duplicate',
      icon: <Copy className="h-3.5 w-3.5 mr-2" />,
      onClick: () => {
        onDuplicate();
        setShowMenu(false);
      },
      className: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-3.5 w-3.5 mr-2" />,
      onClick: () => {
        onDelete();
        setShowMenu(false);
      },
      className: 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
    }
  ].filter(Boolean);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200/50 dark:border-gray-700/50">
      <div className="p-3 flex items-center justify-between">
        <div 
          className="flex-1 flex items-center gap-2 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
          )}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {session.name}
            </h3>
            <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="h-3 w-3 mr-1" />
              <span>{session.duration}min</span>
              {session.startTime && (
                <span className="ml-2">@ {session.startTime}</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="relative flex items-center">
          <button
            ref={menuTriggerRef}
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <MoreVertical className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>

          <MenuPortal
            isOpen={showMenu}
            onClose={() => setShowMenu(false)}
            triggerRef={menuTriggerRef}
          >
            <div>
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className={`w-full px-3 py-1.5 text-sm text-left flex items-center ${item.className}`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </MenuPortal>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="p-3 space-y-3">
            {session.workouts.map((workout) => (
              <div
                key={workout.id}
                onClick={() => toggleWorkout(workout.id)}
                className={`group relative rounded-lg border-l-4 ${getWorkoutTypeColor(workout.type)} p-3 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {workout.name}
                    </h4>
                    {workout.description && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono">
                        {workout.description}
                      </p>
                    )}
                    {expandedWorkouts.has(workout.id) && (
                      <WorkoutDetails workout={workout} />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEditWorkout && (
                      <WorkoutActionButton
                        key={`edit-${workout.id}`}
                        icon={<Edit2 className="h-4 w-4" />}
                        label="Edit workout"
                        onClick={() => handleEditWorkout(workout)}
                      />
                    )}
                    {onDeleteWorkout && (
                      <WorkoutActionButton
                        key={`delete-${workout.id}`}
                        icon={<Trash2 className="h-4 w-4" />}
                        label="Delete workout"
                        onClick={() => onDeleteWorkout(workout.id)}
                        variant="danger"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={handleAddWorkout}
              className="w-full flex items-center justify-center px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Workout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}