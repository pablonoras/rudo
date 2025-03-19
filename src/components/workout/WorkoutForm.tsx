import { useState } from 'react';
import { X, Info } from 'lucide-react';
import type { WorkoutFormat } from '../../lib/workout';

const COLOR_TAGS = [
  { value: 'red', label: 'Red', class: 'bg-red-500' },
  { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { value: 'green', label: 'Green', class: 'bg-green-500' },
  { value: 'yellow', label: 'Yellow', class: 'bg-yellow-500' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-500' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
];

interface WorkoutFormProps {
  initialData?: {
    name?: string;
    color?: string;
    format?: WorkoutFormat;
    description?: string;
    timeLimit?: number;
    rounds?: number;
    interval?: number;
    scaling?: string;
    notes?: string;
  };
  onSave: (workout: {
    name: string;
    color: string;
    format?: WorkoutFormat;
    description: string;
    timeLimit?: number;
    rounds?: number;
    interval?: number;
    scaling?: string;
    notes?: string;
  }) => void;
  onClose: () => void;
  title: string;
}

export function WorkoutForm({ initialData, onSave, onClose, title }: WorkoutFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [color, setColor] = useState(initialData?.color ?? 'blue');
  const [format, setFormat] = useState<WorkoutFormat | undefined>(initialData?.format);
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [timeLimit, setTimeLimit] = useState<string>(initialData?.timeLimit?.toString() ?? '');
  const [rounds, setRounds] = useState<string>(initialData?.rounds?.toString() ?? '');
  const [interval, setInterval] = useState<string>(initialData?.interval?.toString() ?? '');
  const [scaling, setScaling] = useState(initialData?.scaling ?? '');
  const [notes, setNotes] = useState(initialData?.notes ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      color,
      format,
      description,
      timeLimit: timeLimit ? parseInt(timeLimit) : undefined,
      rounds: rounds ? parseInt(rounds) : undefined,
      interval: interval ? parseInt(interval) : undefined,
      scaling: scaling || undefined,
      notes: notes || undefined,
    });
    onClose();
  };

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
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Workout Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm px-3 py-2"
                  placeholder="e.g., Heavy Back Squats + AMRAP"
                  required
                />
              </div>
              
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
                  className={`absolute top-[2.1rem] left-[0.5rem] w-4 h-4 rounded-full pointer-events-none ${
                    COLOR_TAGS.find(t => t.value === color)?.class
                  }`} 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as WorkoutFormat)}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm px-3 py-2"
              >
                <option value="">Select format...</option>
                <option value="forTime">For Time</option>
                <option value="amrap">AMRAP</option>
                <option value="emom">EMOM</option>
                <option value="tabata">Tabata</option>
                <option value="rounds">Rounds</option>
                <option value="complex">Complex</option>
              </select>
            </div>

            {format && (
              <div className="grid grid-cols-2 gap-4">
                {(format === 'amrap' || format === 'forTime') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Time Cap (minutes)
                    </label>
                    <input
                      type="number"
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(e.target.value)}
                      min="0"
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm px-3 py-2"
                    />
                  </div>
                )}

                {(format === 'emom' || format === 'tabata') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Interval (seconds)
                      </label>
                      <input
                        type="number"
                        value={interval}
                        onChange={(e) => setInterval(e.target.value)}
                        min="0"
                        step="5"
                        className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Rounds
                      </label>
                      <input
                        type="number"
                        value={rounds}
                        onChange={(e) => setRounds(e.target.value)}
                        min="0"
                        className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm px-3 py-2"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

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
                Scaling Options
              </label>
              <textarea
                value={scaling}
                onChange={(e) => setScaling(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm px-3 py-2"
                placeholder="Enter scaling options for different skill levels..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Additional Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
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
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Save Workout
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}