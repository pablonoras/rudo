import { useState } from 'react';
import { X, Clock } from 'lucide-react';
import type { SessionType } from '../../lib/workout';

interface SessionFormProps {
  onClose: () => void;
  onSave: (session: {
    name: string;
    type: SessionType;
    duration: number;
    startTime?: string;
  }) => void;
  title: string;
  initialData?: {
    name: string;
    type: SessionType;
    duration: number;
    startTime?: string;
  };
}

export function SessionForm({ onClose, onSave, title, initialData }: SessionFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState<SessionType>(initialData?.type || 'CrossFit');
  const [duration, setDuration] = useState(initialData?.duration || 60);
  const [startTime, setStartTime] = useState(initialData?.startTime || '');
  const [isCustom, setIsCustom] = useState(false);
  const [customType, setCustomType] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      type: isCustom ? customType as SessionType : type,
      duration,
      startTime: startTime || undefined,
    });
  };

  const handleTypeChange = (selectedType: string) => {
    if (selectedType === 'Custom') {
      setIsCustom(true);
    } else {
      setIsCustom(false);
      setType(selectedType as SessionType);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
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

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Session Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm px-3 py-2"
              placeholder="e.g., Morning CrossFit"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Session Type
            </label>
            <select
              value={isCustom ? 'Custom' : type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm px-3 py-2"
            >
              <option value="CrossFit">CrossFit</option>
              <option value="Olympic Weightlifting">Olympic Weightlifting</option>
              <option value="Powerlifting">Powerlifting</option>
              <option value="Endurance">Endurance</option>
              <option value="Gymnastics">Gymnastics</option>
              <option value="Recovery">Recovery</option>
              <option value="Competition Prep">Competition Prep</option>
              <option value="Skills & Drills">Skills & Drills</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          {isCustom && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Custom Type
              </label>
              <input
                type="text"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm px-3 py-2"
                placeholder="Enter custom session type"
                required={isCustom}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                min="15"
                step="15"
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Start Time (optional)
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:text-sm px-3 py-2"
              />
            </div>
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
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              {initialData ? 'Save Changes' : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}