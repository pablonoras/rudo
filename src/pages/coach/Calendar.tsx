import { useState } from 'react';
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  parseISO,
  isWithinInterval,
} from 'date-fns';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Copy,
  Eye,
  Share2,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { WorkoutBlock } from '../../components/workout/WorkoutBlock';
import { ExerciseLibrary } from '../../components/workout/ExerciseLibrary';
import { WorkoutPreview } from '../../components/workout/WorkoutPreview';
import { AssignWorkout } from '../../components/workout/AssignWorkout';
import { ProgramSelector } from '../../components/program/ProgramSelector';
import { useWorkoutStore, type BlockType } from '../../lib/workout';

export function Calendar() {
  const {
    programs,
    selectedProgramId,
    addBlock,
    updateBlock,
    removeBlock,
    moveBlock,
    duplicateDay,
  } = useWorkoutStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [previewDate, setPreviewDate] = useState<string | null>(null);
  const [assignDate, setAssignDate] = useState<string | null>(null);

  const selectedProgram = selectedProgramId ? programs[selectedProgramId] : null;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleAddBlock = (date: string) => {
    if (!selectedProgramId) return;

    const newBlock = {
      id: Date.now().toString(),
      type: 'warmup' as BlockType,
      title: 'New Block',
      exercises: [],
    };
    addBlock(selectedProgramId, date, newBlock);
  };

  const handleDragEnd = (event: any) => {
    if (!selectedProgramId) return;

    const { active, over } = event;
    if (active.id !== over.id) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const blocks = selectedProgram?.days[dateStr]?.blocks || [];
      const oldIndex = blocks.findIndex((block) => block.id === active.id);
      const newIndex = blocks.findIndex((block) => block.id === over.id);
      moveBlock(selectedProgramId, dateStr, oldIndex, newIndex);
    }
  };

  const handleDuplicateDay = (fromDate: string, toDate: string) => {
    if (!selectedProgramId) return;
    duplicateDay(selectedProgramId, fromDate, toDate);
  };

  const isDateInProgram = (date: Date) => {
    if (!selectedProgram) return false;
    return isWithinInterval(date, {
      start: parseISO(selectedProgram.startDate),
      end: parseISO(selectedProgram.endDate),
    });
  };

  return (
    <div className="space-y-6">
      <ProgramSelector />

      {!selectedProgram ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            No Program Selected
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Select or create a program to start programming workouts.
          </p>
        </div>
      ) : (
        <div className="h-full flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {selectedProgram.name}
                  </h2>
                </div>
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

              <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
                {weekDays.map((date) => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const dayProgram = selectedProgram.days[dateStr];
                  const isToday = isSameDay(date, new Date());
                  const isInProgram = isDateInProgram(date);

                  return (
                    <div
                      key={dateStr}
                      className={`bg-white dark:bg-gray-800 p-4 min-h-[300px] ${
                        isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      } ${
                        !isInProgram
                          ? 'opacity-50 pointer-events-none'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                            {format(date, 'EEE')}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {format(date, 'MMM d')}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {dayProgram?.blocks.length > 0 && (
                            <>
                              <button
                                onClick={() => setPreviewDate(dateStr)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                title="Preview workout"
                              >
                                <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              </button>
                              <button
                                onClick={() => setAssignDate(dateStr)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                title="Assign workout"
                              >
                                <Share2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDuplicateDay(
                                    dateStr,
                                    format(addDays(date, 1), 'yyyy-MM-dd')
                                  )
                                }
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                title="Duplicate to next day"
                              >
                                <Copy className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {isInProgram && (
                        <>
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                          >
                            <SortableContext
                              items={dayProgram?.blocks || []}
                              strategy={verticalListSortingStrategy}
                            >
                              <div className="space-y-2">
                                {dayProgram?.blocks.map((block) => (
                                  <WorkoutBlock
                                    key={block.id}
                                    block={block}
                                    onUpdate={(updatedBlock) =>
                                      updateBlock(selectedProgramId, dateStr, updatedBlock)
                                    }
                                    onRemove={() =>
                                      removeBlock(selectedProgramId, dateStr, block.id)
                                    }
                                    onDuplicate={() => {
                                      const newBlock = {
                                        ...block,
                                        id: `${block.id}-${Date.now()}`,
                                      };
                                      addBlock(selectedProgramId, dateStr, newBlock);
                                    }}
                                  />
                                ))}
                              </div>
                            </SortableContext>
                          </DndContext>

                          <button
                            onClick={() => handleAddBlock(dateStr)}
                            className="mt-4 w-full flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Block
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="w-full lg:w-96 flex-shrink-0">
            <ExerciseLibrary />
          </div>

          {previewDate && selectedProgram.days[previewDate] && (
            <WorkoutPreview
              workout={selectedProgram.days[previewDate]}
              onClose={() => setPreviewDate(null)}
            />
          )}

          {assignDate && selectedProgram.days[assignDate] && (
            <AssignWorkout
              workout={selectedProgram.days[assignDate]}
              onClose={() => setAssignDate(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}