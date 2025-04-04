import { useState } from 'react';
import { X, Upload, UserPlus, AlertCircle } from 'lucide-react';
import { ManualAthleteForm } from './ManualAthleteForm';
import { BulkImportForm } from './BulkImportForm';

interface AddAthleteModalProps {
  onClose: () => void;
  onAdd: (athletes: any[]) => void;
}

type AddMethod = 'manual' | 'bulk';

export function AddAthleteModal({ onClose, onAdd }: AddAthleteModalProps) {
  const [method, setMethod] = useState<AddMethod>('manual');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Add Athletes
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setMethod('manual')}
              className={`p-4 rounded-lg border-2 ${
                method === 'manual'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <UserPlus
                className={`h-6 w-6 mx-auto mb-2 ${
                  method === 'manual'
                    ? 'text-blue-500'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              />
              <div
                className={`text-sm font-medium ${
                  method === 'manual'
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-gray-900 dark:text-gray-100'
                }`}
              >
                Add Manually
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Add athletes one by one with detailed information
              </p>
            </button>

            <button
              onClick={() => setMethod('bulk')}
              className={`p-4 rounded-lg border-2 ${
                method === 'bulk'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <Upload
                className={`h-6 w-6 mx-auto mb-2 ${
                  method === 'bulk'
                    ? 'text-blue-500'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              />
              <div
                className={`text-sm font-medium ${
                  method === 'bulk'
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-gray-900 dark:text-gray-100'
                }`}
              >
                Bulk Import
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Import multiple athletes using CSV/Excel
              </p>
            </button>
          </div>

          {method === 'manual' ? (
            <ManualAthleteForm onAdd={onAdd} onCancel={onClose} />
          ) : (
            <BulkImportForm onImport={onAdd} onCancel={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}