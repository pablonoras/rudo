/**
 * src/components/athlete/AssignedPrograms.tsx
 * 
 * Component to display all programs assigned to the athlete.
 * Shows a list of programs with their details and allows selection.
 */

import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import { useState } from 'react';

export interface AssignedProgram {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  coachName: string;
}

interface AssignedProgramsProps {
  programs: AssignedProgram[];
  onSelectProgram: (programId: string | null) => void;
  selectedProgramId: string | null;
}

export function AssignedPrograms({ 
  programs, 
  onSelectProgram, 
  selectedProgramId 
}: AssignedProgramsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (programs.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Assigned Programs
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          You don't have any programs assigned yet.
        </p>
      </div>
    );
  }

  // Show only 2 programs when collapsed, all when expanded
  const displayedPrograms = isExpanded ? programs : programs.slice(0, 2);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4">
      <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
        Assigned Programs
      </h2>
      
      <div className="space-y-3">
        {displayedPrograms.map((program) => (
          <div 
            key={program.id}
            className={`p-3 rounded-lg cursor-pointer transition-colors ${
              selectedProgramId === program.id
                ? 'bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
                : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent'
            }`}
            onClick={() => onSelectProgram(selectedProgramId === program.id ? null : program.id)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  {program.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Coach: {program.coachName}
                </p>
              </div>
            </div>
            
            <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
              <Calendar className="h-3.5 w-3.5 mr-1" />
              <span>
                {format(new Date(program.startDate), 'MMM d')} - {format(new Date(program.endDate), 'MMM d, yyyy')}
              </span>
            </div>
            
            {program.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                {program.description}
              </p>
            )}
          </div>
        ))}
      </div>
      
      {programs.length > 2 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-3 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          {isExpanded ? 'Show less' : `Show ${programs.length - 2} more programs`}
        </button>
      )}
    </div>
  );
} 