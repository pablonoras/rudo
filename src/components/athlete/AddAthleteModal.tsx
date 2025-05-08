import { UserPlus, X } from 'lucide-react';
import { ManualAthleteForm } from './ManualAthleteForm';

interface AddAthleteModalProps {
  onClose: () => void;
  onAdd: () => void;
}

export function AddAthleteModal({ onClose, onAdd }: AddAthleteModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Add Athlete
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-center mb-4">
            <UserPlus className="h-5 w-5 text-blue-500 mr-2" />
            <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Add New Athlete
            </h3>
          </div>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Add an athlete to your coaching roster. They will receive an invite email to join your platform.
          </p>

          <ManualAthleteForm onAdd={onAdd} onCancel={onClose} />
        </div>
      </div>
    </div>
  );
}