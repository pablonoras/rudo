import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit2, Copy, Trash2, Plus } from 'lucide-react';
import type { WorkoutBlock as WorkoutBlockType } from '../../lib/workout';
import { useModal } from '../../contexts/ModalContext';
import { ExerciseLibrary } from './ExerciseLibrary';

interface WorkoutBlockProps {
  block: WorkoutBlockType;
  onUpdate: (block: WorkoutBlockType) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

export function WorkoutBlock({
  block,
  onUpdate,
  onRemove,
  onDuplicate,
}: WorkoutBlockProps) {
  const [showExercises, setShowExercises] = useState(false);
  const { showBlockEditor } = useModal();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleAddExercise = (exercise: { id: string; name: string; category: string }) => {
    onUpdate({
      ...block,
      exercises: [...block.exercises, exercise],
    });
  };

  const handleRemoveExercise = (exerciseId: string) => {
    onUpdate({
      ...block,
      exercises: block.exercises.filter((e) => e.id !== exerciseId),
    });
  };

  const getBlockTypeColor = (type: string) => {
    const colors = {
      warmup: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      skill: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      strength: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      wod: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      cooldown: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm group"
      >
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <button
                {...attributes}
                {...listeners}
                className="mr-2 cursor-grab active:cursor-grabbing"
              >
                <GripVertical className="h-4 w-4 text-gray-400" />
              </button>
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {block.title}
                </h3>
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${getBlockTypeColor(block.type)}`}>
                  {block.type}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => showBlockEditor({ block, onSave: onUpdate })}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Edit block"
              >
                <Edit2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
              <button
                onClick={onDuplicate}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Duplicate block"
              >
                <Copy className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
              <button
                onClick={onRemove}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Remove block"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </button>
            </div>
          </div>

          {block.notes && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {block.notes}
            </p>
          )}

          {block.exercises.length > 0 && (
            <div className="mt-2 space-y-1">
              {block.exercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-700/50 p-1.5 rounded"
                >
                  <span className="text-gray-700 dark:text-gray-300">
                    {exercise.name}
                  </span>
                  <button
                    onClick={() => handleRemoveExercise(exercise.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 p-0.5"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setShowExercises(true)}
            className="mt-2 flex items-center text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Exercise
          </button>
        </div>
      </div>

      {showExercises && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Add Exercise to {block.title}
                </h2>
                <button
                  onClick={() => setShowExercises(false)}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <ExerciseLibrary onAddExercise={(exercise) => {
                handleAddExercise(exercise);
                setShowExercises(false);
              }} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}