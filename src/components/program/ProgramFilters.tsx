import type { ProgramStatus } from '../../lib/workout';

interface ProgramFiltersProps {
  currentFilter: ProgramStatus | 'all';
  onFilterChange: (filter: ProgramStatus | 'all') => void;
  counts: {
    all: number;
    draft: number;
    published: number;
    archived: number;
  };
}

export function ProgramFilters({
  currentFilter,
  onFilterChange,
  counts,
}: ProgramFiltersProps) {
  return (
    <div className="flex items-center space-x-2 mb-6">
      <button
        onClick={() => onFilterChange('all')}
        className={`px-3 py-1.5 text-sm rounded-full ${
          currentFilter === 'all'
            ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        All ({counts.all})
      </button>
      <button
        onClick={() => onFilterChange('draft')}
        className={`px-3 py-1.5 text-sm rounded-full ${
          currentFilter === 'draft'
            ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        Drafts ({counts.draft})
      </button>
      <button
        onClick={() => onFilterChange('published')}
        className={`px-3 py-1.5 text-sm rounded-full ${
          currentFilter === 'published'
            ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        Published ({counts.published})
      </button>
      <button
        onClick={() => onFilterChange('archived')}
        className={`px-3 py-1.5 text-sm rounded-full ${
          currentFilter === 'archived'
            ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        Archived ({counts.archived})
      </button>
    </div>
  );
}