import { Info, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const COLOR_TAGS = [
  { value: '#FF9AA2', label: 'Red', class: 'bg-red-500' },
  { value: '#A2D2FF', label: 'Blue', class: 'bg-blue-500' },
  { value: '#B5EAD7', label: 'Green', class: 'bg-green-500' },
  { value: '#FFDAC1', label: 'Orange', class: 'bg-orange-500' },
  { value: '#FFE8B6', label: 'Yellow', class: 'bg-yellow-500' },
  { value: '#C7CEEA', label: 'Purple', class: 'bg-purple-500' },
];

interface WorkoutFormProps {
  initialData?: {
    description?: string;
    color?: string;
    notes?: string;
  };
  onSave: (workout: {
    description: string;
    color: string;
    notes?: string;
    wasEdited: boolean;
  }) => void;
  onClose: () => void;
  title: string;
}

export function WorkoutForm({ initialData, onSave, onClose, title }: WorkoutFormProps) {
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [color, setColor] = useState(initialData?.color ?? '#2196F3');
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  
  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description ?? '');
      setColor(initialData.color ?? '#2196F3');
      setNotes(initialData.notes ?? '');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      description,
      color,
      notes: notes || undefined,
      wasEdited: Boolean(initialData?.description)
    });
    onClose();
  };

  // Determine if we're editing an existing workout
  const isEditing = initialData?.description !== undefined;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            <div className="w-32 relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Color
              </label>
              <select
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm appearance-none pl-8 pr-2 py-2"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: `right 0.5rem center`,
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                }}
              >
                {COLOR_TAGS.map((tag) => (
                  <option 
                    key={tag.value} 
                    value={tag.value}
                    className="flex items-center gap-2"
                  >
                    {tag.label}
                  </option>
                ))}
              </select>
              <div 
                style={{
                  backgroundColor: color,
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '2.1rem',
                  left: '0.5rem',
                  pointerEvents: 'none'
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Workout Description
              </label>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center mb-2">
                <Info className="h-3 w-3 mr-1" />
                Use standard CrossFit notation (e.g., "21-15-9" or "5 rounds for time")
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm px-3 py-2 font-mono"
                placeholder="Enter workout description using CrossFit notation..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Additional Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm px-3 py-2"
                placeholder="Enter any additional notes, coaching cues, or instructions..."
              />
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                {isEditing ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}