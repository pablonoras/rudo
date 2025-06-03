import { Calendar, Search, User, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAthleteStore } from '../lib/athlete';
import { useWorkoutStore } from '../lib/workout';

type SearchResult = {
  id: string;
  type: 'athlete' | 'program';
  title: string;
  subtitle?: string;
  url: string;
};

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const athletes = useAthleteStore((state) => state.athletes);
  const programs = useWorkoutStore((state) => state.programs);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const searchResults: SearchResult[] = [];

    // Search athletes
    Object.values(athletes).forEach((athlete) => {
      const fullName = `${athlete.firstName} ${athlete.lastName}`.toLowerCase();
      if (fullName.includes(lowerQuery) || athlete.email.toLowerCase().includes(lowerQuery)) {
        searchResults.push({
          id: athlete.id,
          type: 'athlete',
          title: `${athlete.firstName} ${athlete.lastName}`,
          subtitle: athlete.email,
          url: `/coach/athlete/${athlete.id}`,
        });
      }
    });

    // Search programs
    Object.values(programs).forEach((program) => {
      if (program.name.toLowerCase().includes(lowerQuery)) {
        searchResults.push({
          id: program.id,
          type: 'program',
          title: program.name,
          subtitle: `${program.weekCount} weeks`,
          url: `/coach/program/${program.id}`,
        });
      }
    });

    setResults(searchResults);
    setSelectedIndex(0);
  }, [query, athletes, programs]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  const handleSelect = (result: SearchResult) => {
    navigate(result.url);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center w-full max-w-xs px-3 py-1.5 text-sm text-gray-400 bg-gray-800 dark:bg-gray-700 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <Search className="h-4 w-4 mr-2" />
        <span>Search...</span>
        <span className="ml-auto text-xs bg-gray-700 dark:bg-gray-600 px-1.5 py-0.5 rounded">
          ⌘K
        </span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          
          <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-12 pr-4 py-4 text-gray-900 dark:text-gray-100 bg-transparent border-b border-gray-200 dark:border-gray-700 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
                  placeholder="Search athletes, programs..."
                  autoFocus
                />
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {results.length > 0 && (
                <div className="max-h-96 overflow-y-auto py-2">
                  {results.map((result, index) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelect(result)}
                      className={`w-full px-4 py-3 flex items-center gap-3 text-left ${
                        index === selectedIndex
                          ? 'bg-gray-100 dark:bg-gray-700'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <div className={`flex-shrink-0 rounded-full p-2 ${
                        result.type === 'athlete'
                          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                          : 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400'
                      }`}>
                        {result.type === 'athlete' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Calendar className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {result.title}
                        </div>
                        {result.subtitle && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {result.subtitle}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {query && results.length === 0 && (
                <div className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                  No results found for "{query}"
                </div>
              )}

              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center justify-between">
                  <div className="flex gap-3">
                    <span>↑↓ to navigate</span>
                    <span>↵ to select</span>
                    <span>esc to close</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}