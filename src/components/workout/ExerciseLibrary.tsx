import { useState } from 'react';
import { Search, Filter, Plus } from 'lucide-react';
import type { Exercise } from '../../lib/workout';

const SAMPLE_EXERCISES: Exercise[] = [
  { id: '1', name: 'Back Squat', category: 'Strength' },
  { id: '2', name: 'Clean and Jerk', category: 'Olympic Lifting' },
  { id: '3', name: 'Pull-ups', category: 'Gymnastics' },
  { id: '4', name: 'Air Squat', category: 'Bodyweight' },
  { id: '5', name: 'Deadlift', category: 'Strength' },
  { id: '6', name: 'Snatch', category: 'Olympic Lifting' },
  { id: '7', name: 'Muscle-ups', category: 'Gymnastics' },
  { id: '8', name: 'Handstand Push-ups', category: 'Gymnastics' },
  { id: '9', name: 'Box Jumps', category: 'Plyometrics' },
  { id: '10', name: 'Double-unders', category: 'Cardio' },
];

const CATEGORIES = Array.from(
  new Set(SAMPLE_EXERCISES.map((e) => e.category))
).sort();

interface ExerciseLibraryProps {
  onAddExercise?: (exercise: Exercise) => void;
}

export function ExerciseLibrary({ onAddExercise }: ExerciseLibraryProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredExercises = SAMPLE_EXERCISES.filter((exercise) => {
    const matchesSearch = exercise.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory =
      !selectedCategory || exercise.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Exercise Library
        </h2>
        <div className="mt-4 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search exercises..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === category ? null : category
                  )
                }
                className={`px-3 py-1 text-sm rounded-full ${
                  selectedCategory === category
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="space-y-2">
          {filteredExercises.map((exercise) => (
            <div
              key={exercise.id}
              className="p-3 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {exercise.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {exercise.category}
                  </p>
                </div>
                {onAddExercise && (
                  <button
                    onClick={() => onAddExercise(exercise)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                  >
                    <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}