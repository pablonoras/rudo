/**
 * src/components/athlete/WeekNavigation.tsx
 * 
 * Week navigation component that displays days of the week with clickable dates.
 * Used in the athlete dashboard to navigate between days.
 */

import { addDays, format, isToday, startOfWeek } from 'date-fns';

interface WeekNavigationProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export function WeekNavigation({ selectedDate, onSelectDate }: WeekNavigationProps) {
  // Get the start of the week (Sunday) for the selected date
  const startDate = startOfWeek(selectedDate);
  
  // Generate an array of the 7 days of the week
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(startDate, i);
    return {
      date,
      dayName: format(date, 'EEE'), // Mon, Tue, etc.
      dayNumber: format(date, 'd'), // 1, 2, etc.
      isToday: isToday(date),
      isSelected: format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'),
    };
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-4">
      <div className="flex justify-between">
        {weekDays.map((day) => (
          <button
            key={day.dayName}
            onClick={() => onSelectDate(day.date)}
            className={`flex-1 py-3 flex flex-col items-center transition-colors ${
              day.isSelected
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200'
                : day.isToday
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {day.dayName}
            </span>
            <span className={`text-lg font-semibold mt-1 ${
              day.isSelected
                ? 'text-purple-800 dark:text-purple-200'
                : day.isToday
                ? 'text-blue-800 dark:text-blue-200'
                : 'text-gray-900 dark:text-gray-100'
            }`}>
              {day.dayNumber}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
} 