import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  format,
  startOfWeek,
  addDays,
  parseISO,
  isWithinInterval,
  isSameDay,
} from 'date-fns';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Send,
  Save,
  ArrowLeft,
} from 'lucide-react';
import { useWorkoutStore } from '../../lib/workout';
import { SessionForm } from '../../components/session/SessionForm';
import { SessionBlock } from '../../components/session/SessionBlock';

interface PublishConfirmModalProps {
  onConfirm: (shouldAssign: boolean) => void;
  onCancel: () => void;
}

function PublishConfirmModal({ onConfirm, onCancel }: PublishConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Publish Program
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Would you like to assign this program to athletes now?
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
          >
            Publish Only
          </button>
          <button
            onClick={() => onConfirm(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
          >
            Publish & Assign
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProgramCalendar() {
  const navigate = useNavigate();
  const { programId } = useParams<{ programId: string }>();
  const {
    programs,
    addSession,
    updateSession,
    deleteSession,
    updateProgramStatus,
  } = useWorkoutStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [addSessionDate, setAddSessionDate] = useState<string | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const program = programId ? programs[programId] : null;

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  const handlePublish = async (shouldAssign: boolean) => {
    if (!programId) return;
    updateProgramStatus(programId, 'published');
    if (shouldAssign) {
      navigate(`/coach/program/${programId}/assign`);
    }
    setShowPublishModal(false);
  };

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

  const isDateInProgram = (date: Date) => {
    if (!program) return false;
    return isWithinInterval(date, {
      start: parseISO(program.startDate),
      end: parseISO(program.endDate),
    });
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => navigate('/coach/programs')}
              className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Programs
            </button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {program.name}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {format(parseISO(program.startDate), 'MMMM d')} -{' '}
            {format(parseISO(program.endDate), 'MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          {program.status === 'draft' && (
            <button
              onClick={() => setShowPublishModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Publish
            </button>
          )}
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-t-lg p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {format(selectedDate, 'MMMM yyyy')}
          </span>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4 md:gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
        {weekDays.map((date) => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const dayProgram = program.days[dateStr];
          const isToday = isSameDay(date, new Date());
          const isInProgram = isDateInProgram(date);

          return (
            <div
              key={dateStr}
              className={`relative bg-white dark:bg-gray-800 min-h-[300px] md:min-h-[500px] ${
                !isInProgram ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              {/* Date Header */}
              <div 
                className={`sticky top-0 z-10 p-3 border-b border-gray-200 dark:border-gray-700 ${
                  isToday ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800'
                }`}
              >
                <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                  {format(date, 'EEEE')}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {format(date, 'MMM d')}
                </div>
              </div>

              {/* Sessions */}
              <div className="p-3 space-y-3">
                {isInProgram && (
                  <>
                    {dayProgram?.sessions.map((session) => (
                      <SessionBlock
                        key={session.id}
                        session={session}
                        onUpdate={(updates) =>
                          updateSession(programId, dateStr, session.id, updates)
                        }
                        onDelete={() =>
                          deleteSession(programId, dateStr, session.id)
                        }
                        onAddWorkout={(workout) => {
                          updateSession(programId, dateStr, session.id, {
                            workouts: [...session.workouts, workout],
                          });
                        }}
                      />
                    ))}

                    <button
                      onClick={() => setAddSessionDate(dateStr)}
                      className="w-full flex items-center justify-center px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Session
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {addSessionDate && (
        <SessionForm
          title={`Add Session for ${format(parseISO(addSessionDate), 'MMMM d, yyyy')}`}
          onClose={() => setAddSessionDate(null)}
          onSave={(session) => {
            addSession(programId, addSessionDate, {
              ...session,
              workouts: [],
            });
            setAddSessionDate(null);
          }}
        />
      )}

      {showPublishModal && (
        <PublishConfirmModal
          onConfirm={handlePublish}
          onCancel={() => setShowPublishModal(false)}
        />
      )}
    </div>
  );
}

export default ProgramCalendar;