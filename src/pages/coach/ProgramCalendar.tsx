import {
  addDays,
  format,
  isSameDay,
  isWithinInterval,
  parseISO,
  startOfWeek,
} from 'date-fns';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit2,
  LayoutGrid,
  List,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  X,
  XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { WeekNavigation } from '../../components/coach/WeekNavigation';
import { useModal } from '../../contexts/ModalContext';
import { supabase } from '../../lib/supabase';
import { useWorkoutStore } from '../../lib/workout';

// View Mode type
type ViewMode = 'week' | 'day';

interface DeleteWorkoutInfo {
  id: string;
  date: string;
}

interface DeleteConfirmModalProps {
  workoutName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmModal({ workoutName, onConfirm, onCancel }: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Delete Workout
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Are you sure you want to delete this workout? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

interface SaveConfirmModalProps {
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

function SaveConfirmModal({ onSave, onDiscard, onCancel }: SaveConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center mb-4">
          <AlertTriangle className="h-6 w-6 text-yellow-500 mr-3" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Unsaved Changes
          </h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          You have unsaved changes. Do you want to save your changes before leaving?
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onDiscard}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600"
          >
            Don't Save
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// Import or define the ExpandedWorkout interface
interface ExpandedWorkout {
  id: string;
  session: any;
  workout: any;
}

interface WorkoutSearchModalProps {
  onSelect: (workout: any) => void;
  onClose: () => void;
  dateStr: string;
}

function WorkoutSearchModal({ onSelect, onClose, dateStr }: WorkoutSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkouts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('workouts')
          .select(`
            *,
            workout_type:type_id(id, code)
          `)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching workouts:', error);
          return;
        }
        
        setWorkouts(data || []);
      } catch (error) {
        console.error('Error fetching workouts:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkouts();
  }, []);

  // Filter workouts based on search query
  const filteredWorkouts = searchQuery
    ? workouts.filter(workout => 
        (workout.name && workout.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (workout.description && workout.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (workout.workout_type?.code && workout.workout_type.code.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : workouts;

  const handleSelectWorkout = () => {
    if (!selectedWorkoutId) return;
    
    const selectedWorkout = workouts.find(w => w.workout_id === selectedWorkoutId);
    if (selectedWorkout) {
      onSelect({
        ...selectedWorkout,
        id: selectedWorkout.workout_id,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Select Workout for {format(new Date(dateStr), 'MMMM d, yyyy')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search workouts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : filteredWorkouts.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {filteredWorkouts.map((workout) => (
                <div 
                  key={workout.workout_id}
                  className={`p-3 border rounded-md cursor-pointer ${
                    selectedWorkoutId === workout.workout_id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                  onClick={() => setSelectedWorkoutId(workout.workout_id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 font-inter">
                        {workout.name || ''}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        {workout.workout_type && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-normal text-black dark:text-black bg-blue-100 dark:bg-blue-100 font-poppins">
                            {workout.workout_type.code}
                          </span>
                        )}
                      </div>
                    </div>
                    <div 
                      className="h-6 w-6 rounded-full"
                      style={{ backgroundColor: workout.color || '#BAE6FD' }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-black dark:text-black line-clamp-2 font-roboto">
                    {workout.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery ? 'No matching workouts found.' : 'No workouts available.'}
              </p>
            </div>
          )}
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            onClick={handleSelectWorkout}
            disabled={!selectedWorkoutId}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Select Workout
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Cancel
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
    updateProgram,
  } = useWorkoutStore();
  const { showWorkoutForm } = useModal();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isSaving, setIsSaving] = useState(false);
  const [deleteWorkoutInfo, setDeleteWorkoutInfo] = useState<DeleteWorkoutInfo | null>(null);
  const [workouts, setWorkouts] = useState<any[]>([]);
  // Track workout IDs to delete
  const [workoutsToDelete, setWorkoutsToDelete] = useState<string[]>([]);
  // Add view mode state (week or day)
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  // Add state for expanded workout preview
  const [expandedWorkout, setExpandedWorkout] = useState<any | null>(null);
  // Add state for tracking touch/swipe gestures
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  // Add state for tracking unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  // Add state for save confirmation modal
  const [showSaveConfirm, setShowSaveConfirm] = useState<boolean>(false);
  // Add state for storing navigation destination
  const [navigationDestination, setNavigationDestination] = useState<string | null>(null);
  // Add toast notification state
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' } | null>(null);
  // Add new state variables for workout search
  const [showWorkoutSearch, setShowWorkoutSearch] = useState(false);
  const [currentDateStr, setCurrentDateStr] = useState<string>('');

  const program = programId ? programs[programId] : null;

  useEffect(() => {
    if (programId) {
      fetchWorkouts();
    }
  }, [programId]);

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchWorkouts = async () => {
    if (!programId) return;
    
    try {
      console.log(`Fetching workouts for program: ${programId}`);
      
      // First, get all workout assignments for this program
      const { data: programWorkouts, error: programWorkoutsError } = await supabase
        .from('program_workouts')
        .select('workout_id, workout_date')
        .eq('program_id', programId);
      
      if (programWorkoutsError) {
        console.error('Error fetching program_workouts:', programWorkoutsError);
        return;
      }
      
      if (!programWorkouts || programWorkouts.length === 0) {
        console.log('No workouts found for this program');
        // Clear any existing days
        updateProgram(programId, { days: {} });
        return;
      }
      
      console.log(`Found ${programWorkouts.length} workout assignments`);
      
      // Get all workout IDs from the assignments
      const workoutIds = programWorkouts.map(pw => pw.workout_id);
      
      // Fetch the actual workout data
      const { data: workoutsData, error: workoutsError } = await supabase
        .from('workouts')
        .select('*')
        .in('workout_id', workoutIds);
        
      if (workoutsError) {
        console.error('Error fetching workouts:', workoutsError);
        return;
      }
      
      console.log(`Found ${workoutsData?.length || 0} workouts`);
      
      // Group workouts by date
      const workoutsByDate: Record<string, any[]> = {};
      
      // For each program_workout, find the corresponding workout data
      programWorkouts.forEach(pw => {
        const workout = workoutsData?.find(w => w.workout_id === pw.workout_id);
        if (workout) {
          const date = pw.workout_date;
          if (!workoutsByDate[date]) {
            workoutsByDate[date] = [];
          }
          
          workoutsByDate[date].push({
            id: workout.workout_id,
            description: workout.description,
            color: workout.color,
            notes: workout.notes,
            name: workout.name,
            coach_id: workout.coach_id,
            createdAt: workout.created_at,
            updatedAt: workout.updated_at
          });
        }
      });
      
      // Recreate program days from workout data
      recreateProgramDaysFromWorkouts(workoutsByDate);
    } catch (error) {
      console.error('Error in fetchWorkouts:', error);
    }
  };

  // Recreate the program days from the workouts fetched from Supabase
  const recreateProgramDaysFromWorkouts = (workoutsByDate: Record<string, any[]>) => {
    if (!programId || !programs[programId]) return;
    
    const newDays: Record<string, any> = {};
    
    // Create a day for each date with workouts
    Object.entries(workoutsByDate).forEach(([date, workouts]) => {
      newDays[date] = {
        id: uuidv4(),
        date,
        workouts: workouts
      };
    });
    
    // Only update if we have days to add
    if (Object.keys(newDays).length > 0 && programId) {
      // Update the local state to reflect the data from Supabase
      updateProgram(programId, {
        days: newDays
      });
    }
  };

  const handleSave = async () => {
    if (!programId || !program) return;
    
    setIsSaving(true);
    
    try {
      // Get the default 'custom' workout type for new workouts
      const { data: customType, error: typeError } = await supabase
        .from('workout_types')
        .select('id')
        .eq('code', 'custom')
        .single();
        
      if (typeError) {
        console.error('Error fetching custom workout type:', typeError);
        throw typeError;
      }
      
      if (!customType) {
        throw new Error("Could not find the 'custom' workout type");
      }
      
      const defaultTypeId = customType.id;
      
      console.log('Starting save operation');
      
      // Collect all workouts that need to be saved (new) or updated (existing)
      const workoutsToSave = [];
      const workoutsToUpdate = [];
      const programWorkoutAssignments = [];
      
      // Iterate through all days in the program
      for (const dateStr in program.days) {
        const day = program.days[dateStr];
        
        // Iterate through all workouts in each day
        if (day && day.workouts) {
          for (const workout of day.workouts) {
            if (workout.isNew) {
              // This is a new workout to save
              workoutsToSave.push({
                workout_id: workout.id,
                description: workout.description,
                color: workout.color,
                notes: workout.notes || null,
                name: workout.name || null,
                type_id: workout.type_id || defaultTypeId, // Use workout's type_id or default to custom
                coach_id: workout.coach_id,
                created_at: workout.createdAt,
                updated_at: workout.updatedAt
              });
              
              // Track this for program_workouts assignment
              programWorkoutAssignments.push({
                program_id: programId,
                workout_id: workout.id,
                workout_date: dateStr
              });
            } else if (workout.wasEdited) {
              // This is an existing workout that was edited
              const updateData = {
                workout_id: workout.id,
                description: workout.description,
                color: workout.color,
                notes: workout.notes || null,
                name: workout.name || null
              };
              
              // Only include type_id if it exists on the workout
              if (workout.type_id) {
                (updateData as any).type_id = workout.type_id;
              } else {
                // Use default type_id if none exists
                (updateData as any).type_id = defaultTypeId;
              }
              
              workoutsToUpdate.push(updateData);
            } else if (!workout.isNew) {
              // This is an existing workout that wasn't edited, but we still need to track its assignment
              programWorkoutAssignments.push({
                program_id: programId,
                workout_id: workout.id,
                workout_date: dateStr
              });
            }
          }
        }
      }
      
      console.log(`Found ${workoutsToSave.length} workouts to save and ${workoutsToUpdate.length} to update`);
      
      // First, save new workouts if any
      if (workoutsToSave.length > 0) {
        const { error: insertError } = await supabase
          .from('workouts')
          .insert(workoutsToSave);
          
        if (insertError) {
          console.error('Error inserting workouts:', insertError);
          throw insertError;
        }
        
        console.log('Successfully inserted workouts');
        
        // Now, create workout assignments in program_workouts table for new workouts
        const { error: assignmentError } = await supabase
          .from('program_workouts')
          .insert(programWorkoutAssignments);
          
        if (assignmentError) {
          console.error('Error creating workout assignments:', assignmentError);
          throw assignmentError;
        }
        
        console.log('Successfully created workout assignments');
      }
      
      // Then, update existing workouts if any
      if (workoutsToUpdate.length > 0) {
        for (const workout of workoutsToUpdate) {
          const { error: updateError } = await supabase
            .from('workouts')
            .update({
              description: workout.description,
              color: workout.color,
              notes: workout.notes,
              name: workout.name,
              type_id: (workout as any).type_id,
              updated_at: new Date().toISOString()
            })
            .eq('workout_id', workout.workout_id);
            
          if (updateError) {
            console.error(`Error updating workout ${workout.workout_id}:`, updateError);
            // Continue with other updates even if one fails
          }
        }
        
        console.log('Finished updating workouts');
      }
      
      // Delete workouts that were marked for deletion
      if (workoutsToDelete.length > 0) {
        // First delete from program_workouts
        const { error: deleteProgramWorkoutsError } = await supabase
          .from('program_workouts')
          .delete()
          .in('workout_id', workoutsToDelete);
          
        if (deleteProgramWorkoutsError) {
          console.error('Error deleting workout assignments:', deleteProgramWorkoutsError);
          // Continue with deletion of workouts even if assignments deletion fails
        }
        
        // Then delete the workouts themselves
        const { error: deleteError } = await supabase
          .from('workouts')
          .delete()
          .in('workout_id', workoutsToDelete);
          
        if (deleteError) {
          console.error('Error deleting workouts:', deleteError);
          throw deleteError;
        }
        
        console.log(`Successfully deleted ${workoutsToDelete.length} workouts`);
        
        // Clear the list of workouts to delete
        setWorkoutsToDelete([]);
      }
      
      // Update all workouts to remove isNew and wasEdited flags
      const updatedDays: any = {};
      for (const dateStr in program.days) {
        const day = program.days[dateStr];
        updatedDays[dateStr] = {
          ...day,
          workouts: day.workouts.map((w: any) => ({
            ...w,
            isNew: false,
            wasEdited: false
          }))
        };
      }
      
      updateProgram(programId, { days: updatedDays });
      
      setHasUnsavedChanges(false);
      setToast({
        show: true,
        message: 'Changes saved successfully!',
        type: 'success'
      });
      
      console.log('Save operation completed successfully');
      
      // If we have a navigation destination, navigate there
      if (showSaveConfirm && navigationDestination) {
        navigate(navigationDestination);
        setShowSaveConfirm(false);
        setNavigationDestination(null);
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      setToast({
        show: true,
        message: 'Error saving changes. Please try again.',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteWorkout = async () => {
    if (!deleteWorkoutInfo || !programId) return;
    
    try {
      // Add to workoutsToDelete array to delete on save
      setWorkoutsToDelete(prev => [...prev, deleteWorkoutInfo.id]);
      
      // Update local state
      const day = programs[programId].days[deleteWorkoutInfo.date];
      if (day) {
        const updatedWorkouts = day.workouts.filter(w => w.id !== deleteWorkoutInfo.id);
        
        // Update the day with filtered workouts
        updateProgram(programId, {
          days: {
            ...programs[programId].days,
            [deleteWorkoutInfo.date]: {
              ...day,
              workouts: updatedWorkouts
            }
          }
        });
      }
      
      // Set unsaved changes flag
      setHasUnsavedChanges(true);
      
    } catch (err) {
      console.error('Error in handleDeleteWorkout:', err);
      alert('There was an error deleting the workout. Please try again.');
    } finally {
      setDeleteWorkoutInfo(null);
    }
  };

  // Helper function to handle workout deletion
  const confirmDeleteWorkout = (id: string, date: string) => {
    setDeleteWorkoutInfo({ id, date });
    // Set unsaved changes flag
    setHasUnsavedChanges(true);
  };

  // Helper function to get color classes for workouts
  const getWorkoutColorClass = (color?: string) => {
    if (!color) return 'border-gray-400 bg-gray-50 dark:bg-gray-900/20';
    
    // Check if the color is a hex value, rgb or hsl
    if (color.startsWith('#') || color.startsWith('rgb') || color.startsWith('hsl')) {
      // For hex/rgb/hsl values, we'll use inline styles instead of classes
      return 'border-gray-400 text-[var(--workout-text-color,#1F2937)]'; // Use CSS variables for text color
    }
    
    // For named colors, map to our new palette
    const colors: Record<string, string> = {
      red: 'border-red-300 bg-[#FECACA] text-[var(--workout-text-color,#1F2937)]',
      blue: 'border-blue-300 bg-[#BAE6FD] text-[var(--workout-text-color,#1F2937)]',
      green: 'border-green-300 bg-[#A7F3D0] text-[var(--workout-text-color,#1F2937)]',
      yellow: 'border-yellow-300 bg-[#FDE68A] text-[var(--workout-text-color,#1F2937)]',
      purple: 'border-purple-300 bg-[#C4B5FD] text-[var(--workout-text-color,#1F2937)]',
      orange: 'border-orange-300 bg-[#FCD34D] text-[var(--workout-text-color,#1F2937)]',
      pink: 'border-pink-300 bg-[#FBCFE8] text-[var(--workout-text-color,#1F2937)]',
      cyan: 'border-cyan-300 bg-[#A5F3FC] text-[var(--workout-text-color,#1F2937)]',
      gray: 'border-gray-300 bg-[#E5E7EB] text-[var(--workout-text-color,#1F2937)]',
    };

    return colors[color.toLowerCase()] || 'border-gray-400 bg-[#E5E7EB] text-[var(--workout-text-color,#1F2937)]';
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

  const handlePrevDay = () => {
    setSelectedDate(addDays(selectedDate, -1));
  };

  const handleNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };

  const isDateInProgram = (date: Date) => {
    if (!program) return false;
    return isWithinInterval(date, {
      start: parseISO(program.startDate),
      end: parseISO(program.endDate),
    });
  };

  // Modify handleAddWorkout to show options for new workout or search existing
  const handleAddWorkout = (dateStr: string) => {
    setCurrentDateStr(dateStr);
    setShowWorkoutSearch(true);
  };

  // Add a new function to handle adding a selected workout from search
  const handleAddExistingWorkout = async (selectedWorkout: any) => {
    if (!programId || !program) return;
    
    try {
      // Create workout object from the selected workout
      const newWorkout = {
        id: uuidv4(), // Use proper UUID
        name: selectedWorkout.name || '',
        description: selectedWorkout.description,
        color: selectedWorkout.color,
        notes: selectedWorkout.notes || '',
        type_id: selectedWorkout.type_id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isNew: false,
        originalWorkoutId: selectedWorkout.workout_id // Keep reference to original workout
      };
      
      // Update local state
      if (program.days[currentDateStr]) {
        // Add to existing day
        updateProgram(programId, {
          days: {
            ...program.days,
            [currentDateStr]: {
              ...program.days[currentDateStr],
              workouts: [...program.days[currentDateStr].workouts, newWorkout]
            }
          }
        });
      } else {
        // Create new day
        updateProgram(programId, {
          days: {
            ...program.days,
            [currentDateStr]: {
              id: uuidv4(), // Use proper UUID for day ID
              date: currentDateStr,
              workouts: [newWorkout]
            }
          }
        });
      }
      
      // Set unsaved changes flag
      setHasUnsavedChanges(true);
      
      // Close the search modal
      setShowWorkoutSearch(false);
    } catch (error) {
      console.error('Error adding existing workout:', error);
      setToast({
        show: true,
        message: 'Failed to add workout. Please try again.',
        type: 'error'
      });
    }
  };

  // Add function to handle creating a new workout
  const handleCreateNewWorkout = async () => {
    if (!programId || !program) return;
    
    try {
      // Get the default "custom" workout type
      const { data: typeData, error: typeError } = await supabase
        .from('workout_types')
        .select('id')
        .eq('code', 'custom')
        .single();
        
      if (typeError) {
        console.error('Error fetching default workout type:', typeError);
        setToast({
          show: true,
          message: 'Failed to get workout type. Please try again.',
          type: 'error'
        });
        return;
      }
      
      const defaultTypeId = typeData?.id || 1; // Fallback to ID 1 if not found
      
      // Close the search modal first
      setShowWorkoutSearch(false);
      
      // Show the workout form
      showWorkoutForm({
        title: `Add Workout for ${format(new Date(currentDateStr), 'MMMM d, yyyy')}`,
        initialData: {
          type_id: defaultTypeId, // Ensure type_id is always provided
        },
        onSave: async (workout) => {
          try {
            // Generate proper UUID for new workout
            const newWorkoutId = uuidv4();
            
            // Create workout object
            const newWorkout = {
              id: newWorkoutId,
              name: workout.name || '',
              description: workout.description,
              color: workout.color,
              notes: workout.notes || '',
              type_id: workout.type_id,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isNew: true
            };
            
            // Update local state
            if (program.days[currentDateStr]) {
              // Add to existing day
              updateProgram(programId, {
                days: {
                  ...program.days,
                  [currentDateStr]: {
                    ...program.days[currentDateStr],
                    workouts: [...program.days[currentDateStr].workouts, newWorkout]
                  }
                }
              });
            } else {
              // Create new day
              updateProgram(programId, {
                days: {
                  ...program.days,
                  [currentDateStr]: {
                    id: uuidv4(), // Use proper UUID for day ID as well
                    date: currentDateStr,
                    workouts: [newWorkout]
                  }
                }
              });
            }
            
            // Set unsaved changes flag
            setHasUnsavedChanges(true);
          } catch (error) {
            console.error('Error adding workout:', error);
            setToast({
              show: true,
              message: 'Failed to add workout. Please try again.',
              type: 'error'
            });
          }
        }
      });
    } catch (error) {
      console.error('Error in handleCreateNewWorkout:', error);
      setToast({
        show: true,
        message: 'Failed to prepare workout form. Please try again.',
        type: 'error'
      });
    }
  };

  // Add a function to navigate to today
  const handleTodayClick = () => {
    setSelectedDate(new Date());
  };

  // Handle navigation with unsaved changes check
  const handleNavigation = (destination: string) => {
    if (hasUnsavedChanges) {
      // Store the destination and show the confirmation dialog
      setNavigationDestination(destination);
      setShowSaveConfirm(true);
    } else {
      // No unsaved changes, navigate directly
      navigate(destination);
    }
  };

  // Handle save and navigate
  const handleSaveAndNavigate = async () => {
    setIsSaving(true);
    try {
      // Call the same save function we use for normal saving
      await handleSave();
      
      // Navigate after successful save
      if (navigationDestination) {
        // Short delay to allow the toast to be seen before navigating
        setTimeout(() => {
          navigate(navigationDestination);
        }, 500);
      }
    } catch (error) {
      console.error('Error saving before navigation:', error);
      // Error toast will be shown by handleSave
    } finally {
      setIsSaving(false);
      setShowSaveConfirm(false);
      setNavigationDestination(null);
    }
  };

  // Handle discard and navigate
  const handleDiscardAndNavigate = () => {
    // Clear unsaved changes flag
    setHasUnsavedChanges(false);
    
    // Show discard toast
    setToast({
      show: true,
      message: 'Changes discarded',
      type: 'error'
    });
    
    // Navigate to the stored destination after a short delay
    if (navigationDestination) {
      setTimeout(() => {
        navigate(navigationDestination);
      }, 500);
    }
    
    setShowSaveConfirm(false);
    setNavigationDestination(null);
  };

  // Handle cancel navigation
  const handleCancelNavigation = () => {
    setShowSaveConfirm(false);
    setNavigationDestination(null);
  };

  // Update the handleEditWorkout function to handle null program
  const handleEditWorkout = (workout: any, dateStr: string, dayProgram: any) => {
    if (!programId || !program) return;
    
    showWorkoutForm({
      title: "Edit Workout",
      initialData: workout,
      onSave: (updates) => {
        // Get the current workouts and update the specific one
        const workouts = [...dayProgram.workouts];
        const workoutIndex = workouts.findIndex(w => w.id === workout.id);
        
        if (workoutIndex === -1) {
          console.error("Workout not found:", workout.id);
          return;
        }
        
        workouts[workoutIndex] = {
          ...workouts[workoutIndex],
          ...updates,
          updatedAt: new Date().toISOString(),
          wasEdited: true // Mark as edited for database update
        };
        
        // Update the day with the modified workouts array
        updateProgram(programId, {
          days: {
            ...program.days,
            [dateStr]: {
              ...dayProgram,
              workouts
            }
          }
        });
        // Set unsaved changes flag
        setHasUnsavedChanges(true);
      }
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
              onClick={() => handleNavigation('/coach/programs')}
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
        </div>
      </div>

      {/* Toast Notification above Calendar */}
      {toast && (
        <div className="flex justify-center animate-fade-in-down">
          <div className={`flex items-center p-3 px-4 rounded-lg shadow-md max-w-md ${
            toast.type === 'success' ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800' 
                               : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400 mr-3 flex-shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500 dark:text-red-400 mr-3 flex-shrink-0" />
            )}
            <span className={`text-sm font-medium ${
              toast.type === 'success' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
            }`}>
              {toast.message}
            </span>
            <button 
              onClick={() => setToast(null)}
              className="ml-4 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Calendar Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-t-lg border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {viewMode === 'week' 
                ? format(selectedDate, 'MMMM yyyy')
                : format(selectedDate, 'MMMM d, yyyy')}
          </span>
            
            {/* Date picker for easily jumping to a date */}
            <input 
              type="date" 
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => {
                const date = new Date(e.target.value);
                if (!isNaN(date.getTime())) {
                  setSelectedDate(date);
                }
              }}
              className="ml-2 text-sm border-gray-300 dark:border-gray-600 rounded-md bg-transparent dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            />
          </div>
          
          <div className="flex items-center">
            {/* View Mode Switcher */}
            <div className="mr-4 flex rounded-md shadow-sm overflow-hidden border border-gray-300 dark:border-gray-600">
              <button
                onClick={() => setViewMode('week')}
                className={`flex items-center justify-center p-2 text-sm ${
                  viewMode === 'week'
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                title="Week View"
                data-testid="week-view-btn"
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">Week</span>
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={`flex items-center justify-center p-2 text-sm ${
                  viewMode === 'day'
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                title="Day View"
                data-testid="day-view-btn"
              >
                <List className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">Day</span>
              </button>
        </div>
            
            {/* Today button */}
            <button
              onClick={handleTodayClick}
              className="mr-2 flex items-center justify-center p-2 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-800/30 rounded-md"
              title="Go to Today"
            >
              <CalendarDays className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Today</span>
            </button>
          
            {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
                onClick={viewMode === 'week' ? handlePrevWeek : handlePrevDay}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                title={viewMode === 'week' ? "Previous Week" : "Previous Day"}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
                onClick={viewMode === 'week' ? handleNextWeek : handleNextDay}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                title={viewMode === 'week' ? "Next Week" : "Next Day"}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        </div>
      </div>

        {viewMode === 'day' && (
          <WeekNavigation 
            selectedDate={selectedDate} 
            onSelectDate={setSelectedDate} 
          />
        )}
      </div>

      {/* Calendar Grid - Conditionally render based on view mode */}
      {viewMode === 'week' ? (
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

              {/* Workouts */}
              <div className="p-3 space-y-3">
                {isInProgram && (
                  <>
                    {dayProgram?.workouts && dayProgram.workouts.length > 0 ? (
                      // Display workouts directly
                      <>
                        {dayProgram.workouts.map((workout) => (
                          <div
                            key={workout.id}
                            className={`group relative rounded-lg border-l-4 p-3 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 shadow-sm border border-gray-200/50 dark:border-gray-700/50 
                              ${workout.color ? getWorkoutColorClass(workout.color) : 'border-gray-400 bg-gray-50 dark:bg-gray-900/20'}`}
                            style={workout.color && (workout.color.startsWith('#') || workout.color.startsWith('rgb') || workout.color.startsWith('hsl')) ? 
                              { backgroundColor: workout.color, color: 'var(--workout-text-color, #1F2937)' } : undefined}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                {workout.name && (
                                  <p className="text-sm font-medium text-black dark:text-black mb-1 font-inter">
                                    {workout.name}
                                  </p>
                                )}
                                <p className="text-sm text-black dark:text-black whitespace-pre-wrap font-roboto">
                                  {workout.description}
                                </p>
                                {workout.notes && (
                                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <p className="text-xs text-black dark:text-black whitespace-pre-wrap font-inter">
                                      {workout.notes}
                                    </p>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditWorkout(workout, dateStr, dayProgram);
                                  }}
                                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                                >
                                  <Edit2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    confirmDeleteWorkout(workout.id, dateStr);
                                  }}
                                  className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 rounded-full"
                                >
                                  <Trash2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        <button
                          onClick={() => handleAddWorkout(dateStr)}
                          className="w-full flex items-center justify-center px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <Plus className="h-4 w-4 mr-1.5 text-gray-500 dark:text-gray-400" />
                          Add Workout
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleAddWorkout(dateStr)}
                        className="w-full flex items-center justify-center px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <Plus className="h-4 w-4 mr-1.5 text-gray-500 dark:text-gray-400" />
                        Add Workout
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      ) : (
        // Day view - shows a single day with wider layout
        <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden p-6">
          {(() => {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const dayProgram = program.days[dateStr];
            const isInProgram = isDateInProgram(selectedDate);
            
            if (!isInProgram) {
              return (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <p>This date is outside the program date range.</p>
                </div>
              );
            }
            
            if (!dayProgram || !dayProgram.workouts || dayProgram.workouts.length === 0) {
              return (
                <div className="py-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400 mb-6">No workouts for this day yet.</p>
                  <button
                    onClick={() => handleAddWorkout(dateStr)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Workout
                  </button>
                </div>
              );
            }
            
            return (
              <div className="space-y-8">
                <div className="space-y-3">
                  {dayProgram.workouts.map((workout) => (
                    <div
                      key={workout.id}
                      className={`group relative rounded-lg border-l-4 p-3 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 shadow-sm border border-gray-200/50 dark:border-gray-700/50 
                        ${workout.color ? getWorkoutColorClass(workout.color) : 'border-gray-400 bg-gray-50 dark:bg-gray-900/20'}`}
                      style={workout.color && (workout.color.startsWith('#') || workout.color.startsWith('rgb') || workout.color.startsWith('hsl')) ? 
                        { backgroundColor: workout.color, color: 'var(--workout-text-color, #1F2937)' } : undefined}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          {workout.name && (
                            <p className="text-sm font-medium text-black dark:text-black mb-1 font-inter">
                              {workout.name}
                            </p>
                          )}
                          <p className="text-sm text-black dark:text-black whitespace-pre-wrap font-roboto">
                            {workout.description}
                          </p>
                          {workout.notes && (
                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                              <p className="text-xs text-black dark:text-black whitespace-pre-wrap font-inter">
                                {workout.notes}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditWorkout(workout, dateStr, dayProgram);
                            }}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                          >
                            <Edit2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDeleteWorkout(workout.id, dateStr);
                            }}
                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 rounded-full"
                          >
                            <Trash2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button
                    onClick={() => handleAddWorkout(dateStr)}
                    className="w-full flex items-center justify-center px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-1.5 text-gray-500 dark:text-gray-400" />
                    Add Workout
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Modals */}
      {deleteWorkoutInfo && (
        <DeleteConfirmModal
          workoutName="this workout"
          onConfirm={handleDeleteWorkout}
          onCancel={() => setDeleteWorkoutInfo(null)}
        />
      )}

      {showSaveConfirm && (
        <SaveConfirmModal
          onSave={handleSaveAndNavigate}
          onDiscard={handleDiscardAndNavigate}
          onCancel={handleCancelNavigation}
        />
      )}

      {/* Add workout search modal */}
      {showWorkoutSearch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Add Workout
              </h2>
              <button
                onClick={() => setShowWorkoutSearch(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <button
                onClick={handleCreateNewWorkout}
                className="w-full flex items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
              >
                <div className="text-center">
                  <Plus className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Create New Workout
                  </span>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Design a new workout from scratch
                  </p>
                </div>
              </button>

              <div className="relative py-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-2 bg-white dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400">
                    or
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowWorkoutSearch(false);
                  setTimeout(() => {
                    const searchModal = document.getElementById('workout-search-modal');
                    if (searchModal) {
                      searchModal.classList.remove('hidden');
                    }
                  }, 100);
                }}
                className="w-full flex items-center justify-center p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
              >
                <div className="text-center">
                  <Search className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Search Existing Workouts
                  </span>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Choose from your workout library
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workout search modal */}
      <div id="workout-search-modal" className="hidden">
        {currentDateStr && (
          <WorkoutSearchModal
            dateStr={currentDateStr}
            onSelect={handleAddExistingWorkout}
            onClose={() => {
              const searchModal = document.getElementById('workout-search-modal');
              if (searchModal) {
                searchModal.classList.add('hidden');
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

export default ProgramCalendar;