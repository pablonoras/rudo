import { Search } from 'lucide-react';

interface ProgramSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ProgramSearch({ value, onChange, placeholder = 'Search programs...' }: ProgramSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
      />
    </div>
  );
}