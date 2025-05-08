import {
    ChevronDown,
    ChevronUp,
    Copy,
    Edit2,
    MoreVertical,
    Plus,
    Trash2
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useModal } from '../../contexts/ModalContext';
import type { Session, WorkoutBlock } from '../../lib/workout';
import { MenuPortal } from '../MenuPortal';

const getWorkoutColorClass = (color?: string) => {
  if (!color) return 'border-gray-400 bg-gray-50 dark:bg-gray-900/20';
  
  const colors: Record<string, string> = {
    red: 'border-red-400 bg-red-50 dark:bg-red-900/20',
    blue: 'border-blue-400 bg-blue-50 dark:bg-blue-900/20',
    green: 'border-green-400 bg-green-50 dark:bg-green-900/20',
    yellow: 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
    purple: 'border-purple-400 bg-purple-50 dark:bg-purple-900/20',
    orange: 'border-orange-400 bg-orange-50 dark:bg-orange-900/20',
  };

  return colors[color.toLowerCase()] || 'border-gray-400 bg-gray-50 dark:bg-gray-900/20';
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
  if (!workout.notes) {
    return null;
  }

  return (
    <div className="mt-3 pl-4 space-y-3 text-sm">
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
  const [activeWorkoutMenu, setActiveWorkoutMenu] = useState<string | null>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const workoutMenuRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const { showSessionForm, showWorkoutForm } = useModal();

  useEffect(() => {
    if (activeWorkoutMenu === null) return;

    const handleClickOutside = (event: MouseEvent) => {
      const clickedElement = event.target as Node;
      const activeMenuButton = workoutMenuRefs.current[activeWorkoutMenu];
      
      const menuElement = document.querySelector(`[data-workout-menu="${activeWorkoutMenu}"]`);
      
      if (
        activeMenuButton && 
        !activeMenuButton.contains(clickedElement) && 
        (!menuElement || !menuElement.contains(clickedElement))
      ) {
        setTimeout(() => {
          setActiveWorkoutMenu(null);
        }, 100);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeWorkoutMenu]);

  const handleEditSession = () => {
    showSessionForm({
      title: "Edit Session",
      initialData: {
        name: session.name,
        description: session.description,
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
    console.log("Opening workout edit form with initial data:", workout);
    showWorkoutForm({
      title: "Edit Workout",
      initialData: workout,
      onSave: (updates) => {
        console.log("Workout form submitted with updates:", updates);
        onEditWorkout(workout.id, updates);
      }
    });
    setActiveWorkoutMenu(null);
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

  const handleWorkoutMenuClick = (e: React.MouseEvent, workoutId: string) => {
    e.stopPropagation();
    setActiveWorkoutMenu(activeWorkoutMenu === workoutId ? null : workoutId);
  };

  const getWorkoutMenuItems = (workout: WorkoutBlock) => [
    {
      id: 'edit',
      label: 'Edit',
      icon: <Edit2 className="h-3 w-3" />,
      onClick: () => {
        handleEditWorkout(workout);
      },
      className: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
    },
    onDuplicateWorkout && {
      id: 'duplicate',
      label: 'Duplicate',
      icon: <Copy className="h-3 w-3" />,
      onClick: () => {
        if (onDuplicateWorkout) {
          onDuplicateWorkout(workout.id);
          setActiveWorkoutMenu(null);
        }
      },
      className: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
    },
    onDeleteWorkout && {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-3 w-3" />,
      onClick: () => {
        if (onDeleteWorkout) {
          onDeleteWorkout(workout.id);
          setActiveWorkoutMenu(null);
        }
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
            {session.description && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {session.description}
              </p>
            )}
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
                className={`group relative rounded-lg border-l-4 ${getWorkoutColorClass(workout.color)} p-3 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono">
                      {workout.description}
                    </p>
                    {expandedWorkouts.has(workout.id) && (
                      <WorkoutDetails workout={workout} />
                    )}
                  </div>
                  
                  <div className="relative flex items-center">
                    <button
                      ref={el => workoutMenuRefs.current[workout.id] = el}
                      onClick={(e) => handleWorkoutMenuClick(e, workout.id)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full opacity-100 transition-opacity bg-gray-50 dark:bg-gray-700/50"
                    >
                      <MoreVertical className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </button>

                    {activeWorkoutMenu === workout.id && createPortal(
                      <div 
                        className="fixed z-[9999] shadow-xl border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 py-0.5 text-xs w-24"
                        onClick={(e) => e.stopPropagation()}
                        data-workout-menu={workout.id}
                        style={{ 
                          position: 'absolute',
                          top: `${workoutMenuRefs.current[workout.id]?.getBoundingClientRect().bottom + window.scrollY + 5}px`,
                          left: `${workoutMenuRefs.current[workout.id]?.getBoundingClientRect().left + window.scrollX - 10}px`,
                          filter: 'drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06))'
                        }}
                      >
                        {getWorkoutMenuItems(workout).map((item) => (
                          <button
                            key={item.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              item.onClick();
                            }}
                            className={`w-full px-1.5 py-0.5 text-xs text-left flex items-center ${item.className}`}
                          >
                            {item.icon}
                            <span className="ml-1">{item.label}</span>
                          </button>
                        ))}
                      </div>,
                      document.body
                    )}
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddWorkout();
              }}
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