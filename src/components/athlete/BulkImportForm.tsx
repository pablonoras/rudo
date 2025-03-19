import { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, Check, X } from 'lucide-react';

interface BulkImportFormProps {
  onImport: (athletes: any[]) => void;
  onCancel: () => void;
}

export function BulkImportForm({ onImport, onCancel }: BulkImportFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      setError('Please upload a CSV or Excel file');
      return;
    }

    setFile(file);
    // In a real app, you would parse the file here
    // For demo purposes, we'll just show a preview
    setPreview([
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        level: 'intermediate',
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        level: 'beginner',
      },
    ]);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      setError('Please upload a CSV or Excel file');
      return;
    }

    setFile(file);
    // Same preview data as above
    setPreview([
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        level: 'intermediate',
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        level: 'beginner',
      },
    ]);
    setError(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const downloadTemplate = () => {
    // In a real app, you would generate and download a template file
    alert('Downloading template...');
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Before you start
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <ul className="list-disc pl-5 space-y-1">
                <li>Use our template to ensure correct formatting</li>
                <li>Required fields: First Name, Last Name, Email</li>
                <li>Maximum 100 athletes per import</li>
              </ul>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={downloadTemplate}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-200 dark:bg-blue-800/50 dark:hover:bg-blue-800"
              >
                <FileText className="h-4 w-4 mr-1" />
                Download Template
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className="border-2 border-dashed rounded-lg p-8 text-center"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv,.xlsx"
          className="hidden"
        />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-200 dark:bg-blue-800/50 dark:hover:bg-blue-800"
          >
            Choose File
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          or drag and drop your file here
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          CSV or Excel files only
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        </div>
      )}

      {preview.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Preview ({preview.length} athletes)
          </h4>
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Level
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {preview.map((athlete, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {athlete.firstName} {athlete.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {athlete.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {athlete.level}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onImport(preview)}
          disabled={!file || preview.length === 0}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Import Athletes
        </button>
      </div>
    </div>
  );
}