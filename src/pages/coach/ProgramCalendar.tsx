import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  format,
  startOfWeek,
  addDays,
  parseISO,
  isWithinInterval,
} from 'date-fns';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Copy,
  Trash2,
  Edit2,
  Users,
  CopyCheck,
} from 'lucide-react';
import { useWorkoutStore, type WorkoutType, type WorkoutBlock } from '../../lib/workout';
import { WorkoutForm } from '../../components/workout/WorkoutForm';
import { Link } from 'react-router-dom';

function WorkoutCard({ workout, onDelete, onDuplicate, onEdit }: {
  workout: WorkoutBlock;
  onDelete: () => void;
  onDuplicate: () => void;
  onEdit: () => void;
}) {
  const getTypeColor = (type: WorkoutType) => {
    const colors = {
      warmup: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      strength: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      wod: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      cooldown: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    };
    return colors[type];
  };

  return (
    <div className="mb-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 group">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {workout.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${getTypeColor(workout.type)}`}>
              {workout.type}
            </span>
            {workout.format && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {workout.format === 'forTime' ? 'For Time' : workout.format.toUpperCase()}
                {workout.timeLimit ? ` (${workout.timeLimit} min)` : ''}
                {workout.rounds ? ` (${workout.rounds} rounds)` : ''}
                {workout.interval ? ` (${workout.interval}s intervals)` : ''}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Edit workout"
          >
            <Edit2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
          <button
            onClick={onDuplicate}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Duplicate workout"
          >
            <Copy className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Delete workout"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </button>
        </div>
      </div>

      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono">
        {workout.description}
      </div>

      {workout.scaling && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="font-medium">Scaling: </span>
          {workout.scaling}
        </div>
      )}

      {workout.notes && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="font-medium">Notes: </span>
          {workout.notes}
        </div>
      )}
    </div>
  );
}

function CopyWorkoutModal({ onClose, onCopy, dates }: {
  onClose: () => void;
  onCopy: (selectedDates: string[]) => void;
  dates: string[];
}) {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Copy Workout To Multiple Days
          </h2>
        </div>
        <div className="p-4 max-h-96 overflow-y-auto">
          <div className="space-y-2">
            {dates.map((date) => (
              <label
                key={date}
                className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedDates.includes(date)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedDates([...selectedDates, date]);
                    } else {
                      setSelectedDates(selectedDates.filter((d) => d !== date));
                    }
                  }}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {format(parseISO(date), 'EEEE, MMMM d')}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onCopy(selectedDates);
                onClose();
              }}
              disabled={selectedDates.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
            >
              Copy to Selected Days
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProgramCalendar() {
  const { programId } = useParams<{ programId: string }>();
  const {
    programs,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    duplicateWorkout,
    duplicateWeek,
  } = useWorkoutStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [addWorkoutDate, setAddWorkoutDate] = useState<string | null>(null);
  const [editWorkout, setEditWorkout] = useState<{
    date: string;
    workout: WorkoutBlock;
  } | null>(null);
  const [copyWorkout, setCopyWorkout] = useState<{
    date: string;
    workout: WorkoutBlock;
  } | null>(null);

  const program = programId ? programs[programId] : null;

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const start = startOfWeek(selectedDate);
    return addDays(start, i);
  });

  const handlePrevWeek = () => {
    setSelectedDate(addDays(selectedDate, -7));
  };

  const handleNextWeek = () => {
    setSelectedDate(addDays(selectedDate, 7));
  };

  const handleAddWorkout = (date: string, workout: Omit<WorkoutBlock, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!programId) return;
    addWorkout(programId, date, workout);
  };

  const handleUpdateWorkout = (date: string, workoutId: string, updates: Partial<WorkoutBlock>) => {
    if (!programId) return;
    updateWorkout(programId, date, workoutId, updates);
  };

  const handleDuplicateWorkout = (fromDate: string, toDate: string, workoutId: string) => {
    if (!programId) return;
    duplicateWorkout(programId, fromDate, toDate, workoutId);
  };

  const handleDuplicateWeek = () => {
    if (!programId) return;
    const startDate = format(startOfWeek(selectedDate), 'yyyy-MM-dd');
    duplicateWeek(programId, startDate);
  };

  const handleCopyToMultipleDays = (fromDate: string, workoutId: string, toDates: string[]) => {
    toDates.forEach((date) => {
      handleDuplicateWorkout(fromDate, date, workoutId);
    });
  };

  const isDateInProgram = (date: Date) => {
    if (!program) return false;
    return isWithinInterval(date, {
      start: parseISO(program.startDate),
      end: parseISO(program.endDate),
    });
  };

  // Get all available dates in the program for copying
  const getAvailableDates = () => {
    if (!program) return [];
    const start = parseISO(program.startDate);
    const end = parseISO(program.endDate);
    const dates: string[] = [];
    let current = start;
    while (current <= end) {
      dates.push(format(current, 'yyyy-MM-dd'));
      current = addDays(current, 1);
    }
    return dates;
  };

  if (!program) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500 dark:text-gray-400">Program not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {program.name}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {format(parseISO(program.startDate), 'MMMM d')} -{' '}
            {format(parseISO(program.endDate), 'MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            to={`/coach/program/${programId}/assign`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Users className="h-4 w-4 mr-2" />
            Assign Program
          </Link>
          <button
            onClick={handleDuplicateWeek}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <CopyCheck className="h-4 w-4 mr-2" />
            Copy Week Forward
          </button>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevWeek}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={handleNextWeek}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
          {weekDays.map((date) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const dayProgram = program.days[dateStr];
            const isInProgram = isDateInProgram(date);

            return (
              <div
                key={dateStr}
                className={`bg-white dark:bg-gray-800 p-4 min-h-[300px] ${
                  !isInProgram ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                  {format(date, 'EEEE')}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {format(date, 'MMM d')}
                </div>

                {isInProgram && (
                  <>
                    {dayProgram?.workouts.map((workout) => (
                      <WorkoutCard
                        key={workout.id}
                        workout={workout}
                        onDelete={() => {
                          if (!programId) return;
                          deleteWorkout(programId, dateStr, workout.id);
                        }}
                        onDuplicate={() => setCopyWorkout({ date: dateStr, workout })}
                        onEdit={() => setEditWorkout({ date: dateStr, workout })}
                      />
                    ))}

                    <button
                      onClick={() => setAddWorkoutDate(dateStr)}
                      className="mt-2 w-full flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Workout
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {addWorkoutDate && (
        <WorkoutForm
          title={`Add Workout for ${format(parseISO(addWorkoutDate), 'MMMM d, yyyy')}`}
          onClose={() => setAddWorkoutDate(null)}
          onSave={(workout) => {
            handleAddWorkout(addWorkoutDate, workout);
            setAddWorkoutDate(null);
          }}
        />
      )}

      {editWorkout && (
        <WorkoutForm
          title={`Edit Workout for ${format(parseISO(editWorkout.date), 'MMMM d, yyyy')}`}
          initialData={editWorkout.workout}
          onClose={() => setEditWorkout(null)}
          onSave={(updates) => {
            handleUpdateWorkout(editWorkout.date, editWorkout.workout.id, updates);
            setEditWorkout(null);
          }}
        />
      )}

      {copyWorkout && (
        <CopyWorkoutModal
          onClose={() => setCopyWorkout(null)}
          onCopy={(selectedDates) => {
            handleCopyToMultipleDays(
              copyWorkout.date,
              copyWorkout.workout.id,
              selectedDates
            );
          }}
          dates={getAvailableDates().filter((date) => date !== copyWorkout.date)}
        />
      )}
    </div>
  );
}