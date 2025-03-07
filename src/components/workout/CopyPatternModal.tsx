import { useState } from 'react';
import { X } from 'lucide-react';

interface CopyPatternModalProps {
  onClose: () => void;
  onCopy: (pattern: {
    weekCount: number;
    days: ('M' | 'T' | 'W' | 'Th' | 'F' | 'Sa' | 'Su')[];
  }) => void;
}

const DAYS = ['M', 'T', 'W', 'Th', 'F', 'Sa', 'Su'] as const;

export function CopyPatternModal({ onClose, onCopy }: CopyPatternModalProps) {
  const [selectedDays, setSelectedDays] = useState<typeof DAYS[number][]>([]);
  const [weekCount, setWeekCount] = useState(4);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCopy({
      weekCount,
      days: selectedDays,
    });
    onClose();
  };

  const toggleDay = (day: typeof DAYS[number]) => {
    setSelectedDays((current) =>
      current.includes(day)
        ? current.filter((d) => d !== day)
        : [...current, day]
    );
  };

  // Preset patterns
  const applyPattern = (pattern: typeof DAYS[number][]) => {
    setSelectedDays(pattern);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Copy Workout Pattern
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quick Patterns
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyPattern(['M', 'W', 'F'])}
                className="px-3 py-1 text-sm rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                M/W/F
              </button>
              <button
                type="button"
                onClick={() => applyPattern(['T', 'Th'])}
                className="px-3 py-1 text-sm rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                T/Th
              </button>
              <button
                type="button"
                onClick={() => applyPattern(['M', 'T', 'W', 'Th', 'F'])}
                className="px-3 py-1 text-sm rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Weekdays
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Days
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    selectedDays.includes(day)
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="week-count"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Number of Weeks
            </label>
            <input
              type="number"
              id="week-count"
              value={weekCount}
              onChange={(e) => setWeekCount(Math.max(1, parseInt(e.target.value)))}
              min="1"
              className="block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm px-3 py-2"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedDays.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
            >
              Copy to Selected Days
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}