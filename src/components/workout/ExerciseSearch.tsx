import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { exerciseLibrary, type ExerciseCategory } from '../../lib/exercises';

interface ExerciseSearchProps {
  onSelect: (exercise: { name: string; category: string; scaling?: string[] }) => void;
}

export function ExerciseSearch({ onSelect }: ExerciseSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | 'all'>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const categories = Object.keys(exerciseLibrary) as ExerciseCategory[];
  
  const filteredExercises = query
    ? Object.values(exerciseLibrary)
      .flat()
      .filter(
        (exercise) =>
          exercise.name.toLowerCase().includes(query.toLowerCase()) &&
          (selectedCategory === 'all' || exercise.category === selectedCategory)
      )
    : [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search exercises..."
          className="block w-full pl-9 pr-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm"
        />
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {['all', ...categories].map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category as ExerciseCategory | 'all')}
            className={`px-3 py-1 text-xs rounded-full capitalize ${
              selectedCategory === category
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {isOpen && filteredExercises.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto"
        >
          {filteredExercises.map((exercise) => (
            <div
              key={`${exercise.category}-${exercise.name}`}
              className="group"
            >
              <button
                onClick={() => {
                  onSelect(exercise);
                  setQuery('');
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {exercise.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {exercise.category}
                    </div>
                  </div>
                  {exercise.scaling && (
                    <ChevronDown className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100" />
                  )}
                </div>
              </button>
              {exercise.scaling && (
                <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 hidden group-hover:block">
                  <div className="font-medium mb-1">Scaling Options:</div>
                  <ul className="list-disc list-inside">
                    {exercise.scaling.map((option) => (
                      <li key={option}>{option}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}