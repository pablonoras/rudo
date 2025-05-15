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
    ChevronLeft,
    ChevronRight,
    LayoutGrid,
    List,
    Plus,
    Save
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { WeekNavigation } from '../../components/coach/WeekNavigation';
import { SessionBlock } from '../../components/session/SessionBlock';
import { SessionForm } from '../../components/session/SessionForm';
import { useModal } from '../../contexts/ModalContext';
import { supabase } from '../../lib/supabase';
import { deleteWorkout, useWorkoutStore } from '../../lib/workout';

// View Mode type
type ViewMode = 'week' | 'day';

interface DeleteSessionInfo {
  id: string;
  date: string;
  name: string;
}

interface DeleteConfirmModalProps {
  sessionName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmModal({ sessionName, onConfirm, onCancel }: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Delete Session
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Are you sure you want to delete <span className="font-medium text-gray-900 dark:text-gray-100">{sessionName}</span>? This action cannot be undone.
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

export function ProgramCalendar() {
  const navigate = useNavigate();
  const { programId } = useParams<{ programId: string }>();
  const {
    programs,
    addSession,
    updateSession,
    deleteSession,
    updateProgram,
  } = useWorkoutStore();
  const { showSessionForm, showWorkoutForm } = useModal();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [addSessionDate, setAddSessionDate] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteSessionInfo, setDeleteSessionInfo] = useState<DeleteSessionInfo | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  // Track workout IDs to delete
  const [workoutsToDelete, setWorkoutsToDelete] = useState<string[]>([]);
  // Add view mode state (week or day)
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  // Add state for expanded workout preview
  const [expandedWorkout, setExpandedWorkout] = useState<ExpandedWorkout | null>(null);
  // Add state for tracking touch/swipe gestures
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  // Add state for tracking unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  // Add state for save confirmation modal
  const [showSaveConfirm, setShowSaveConfirm] = useState<boolean>(false);
  // Add state for storing navigation destination
  const [navigationDestination, setNavigationDestination] = useState<string | null>(null);

  const program = programId ? programs[programId] : null;

  useEffect(() => {
    if (programId) {
      fetchSessions();
    }
  }, [programId]);

  const fetchSessions = async () => {
    if (!programId) return;
    
    try {
      console.log(`Fetching sessions for program: ${programId}`);
      
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('program_id', programId);
      
      if (error) {
        console.error('Error fetching sessions:', error);
        return;
      }
      
      if (data) {
        console.log(`Found ${data.length} sessions`);
        setSessions(data);
        
        // Fetch workouts for each session
        const sessionIds = data.map(session => session.session_id);
        
        if (sessionIds.length > 0) {
          const { data: workoutsData, error: workoutsError } = await supabase
            .from('workouts')
            .select('*')
            .in('session_id', sessionIds);
            
          if (workoutsError) {
            console.error('Error fetching workouts:', workoutsError);
          } else {
            console.log(`Found ${workoutsData?.length || 0} workouts`);
            
            // Group workouts by session_id
            const workoutsBySession: Record<string, any[]> = {};
            workoutsData?.forEach(workout => {
              if (!workoutsBySession[workout.session_id]) {
                workoutsBySession[workout.session_id] = [];
              }
              workoutsBySession[workout.session_id].push({
                id: workout.workout_id,
                description: workout.description,
                color: workout.color,
                notes: workout.notes,
                createdAt: workout.created_at,
                updatedAt: workout.updated_at
              });
            });
            
            // Recreate program days from session data with workouts
            recreateProgramDaysFromSessions(data, workoutsBySession);
            return;
          }
        }
        
        // If no workouts or error fetching workouts, just recreate with sessions
        recreateProgramDaysFromSessions(data, {});
      }
    } catch (error) {
      console.error('Error in fetchSessions:', error);
    }
  };

  // Recreate the program days from the sessions fetched from Supabase
  const recreateProgramDaysFromSessions = (supabaseSessions: any[], workoutsBySession: Record<string, any[]> = {}) => {
    if (!programId || !programs[programId]) return;
    
    const newDays: Record<string, any> = {};
    
    // Group sessions by date
    supabaseSessions.forEach(session => {
      const date = session.session_date;
      
      if (!newDays[date]) {
        newDays[date] = {
          id: uuidv4(),
          date,
          sessions: []
        };
      }
      
      // Get workouts for this session
      const sessionWorkouts = workoutsBySession[session.session_id] || [];
      
      // Create session object compatible with our state
      newDays[date].sessions.push({
        id: session.session_id,
        name: session.name,
        description: session.description,
        workouts: sessionWorkouts,
        createdAt: session.created_at,
        updatedAt: session.updated_at
      });
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
    setIsSaving(true);
    
    try {
      const programData = programs[programId];
      if (programData) {
        // Collect all session data from all days
        const allSessions: Array<{
          program_id: string;
          name: string;
          description: string | null;
          session_id: string;
          session_date: string;
        }> = [];

        // Track sessions that need to be updated
        const sessionUpdates: Array<{
          program_id: string;
          name: string;
          description: string | null;
          session_id: string;
          session_date: string;
        }> = [];

        // Collect workouts that need to be saved
        const workoutsToSave: Array<{
          session_id: string;
          description: string;
          color: string;
          notes: string | null;
        }> = [];

        // Collect workouts that need to be updated
        const workoutsToUpdate: Array<{
          workout_id: string;
          description: string;
          color: string;
          notes: string | null;
        }> = [];

        // Iterate through program days and collect sessions
        Object.entries(programData.days).forEach(([dateStr, day]) => {
          day.sessions.forEach(session => {
            const existingSession = sessions.find(s => s.session_id === session.id);
            const sessionData = {
              program_id: programId,
              name: session.name,
              description: session.description || null,
              session_id: session.id,
              session_date: dateStr,
            };
            
            if (!existingSession) {
              // New session to insert
              allSessions.push({
                ...sessionData
              });
            } else if (
              existingSession.name !== session.name || 
              existingSession.description !== (session.description || null) ||
              existingSession.session_date !== dateStr
            ) {
              // Session exists but has been updated
              sessionUpdates.push(sessionData);
            }

            // Collect new workouts for this session
            session.workouts.forEach(workout => {
              console.log('Processing workout:', workout.id, workout.description, workout.isNew, workout.wasEdited);
              
              if (workout.isNew) {
                workoutsToSave.push({
                  session_id: session.id,
                  description: workout.description,
                  color: workout.color,
                  notes: workout.notes || null
                });
              } else if (workout.wasEdited) {
                console.log('Marking workout for update:', workout.id, workout.description);
                workoutsToUpdate.push({
                  workout_id: workout.id,
                  description: workout.description,
                  color: workout.color,
                  notes: workout.notes || null
                });
              }
            });
          });
        });

        console.log(`Saving ${allSessions.length} new sessions and updating ${sessionUpdates.length} existing sessions...`);
        
        // Handle inserts for new sessions
        if (allSessions.length > 0) {
          const { data, error } = await supabase
            .from('sessions')
            .insert(allSessions)
            .select();
          
          if (error) {
            console.error('Error saving sessions to Supabase:', error);
            throw new Error('Failed to save sessions');
          }
          
          console.log('Successfully saved new sessions:', data);
        }

        // Handle updates for existing sessions
        if (sessionUpdates.length > 0) {
          for (const update of sessionUpdates) {
            const { error } = await supabase
              .from('sessions')
              .update({ 
                name: update.name, 
                description: update.description,
                session_date: update.session_date
              })
              .eq('session_id', update.session_id);
            
            if (error) {
              console.error(`Error updating session ${update.session_id}:`, error);
            }
          }
          console.log('Successfully updated existing sessions');
        }

        // Save new workouts to the database
        if (workoutsToSave.length > 0) {
          console.log(`Saving ${workoutsToSave.length} new workouts to database...`);
          const { data, error } = await supabase
            .from('workouts')
            .insert(workoutsToSave)
            .select();

          if (error) {
            console.error('Error saving workouts to Supabase:', error);
            throw new Error('Failed to save workouts');
          }
          
          console.log('Successfully saved workouts:', data);
        }
        
        // Update existing workouts in the database
        if (workoutsToUpdate.length > 0) {
          console.log(`Updating ${workoutsToUpdate.length} existing workouts in database...`);
          console.log('Workouts to update:', workoutsToUpdate);
          
          for (const workout of workoutsToUpdate) {
            console.log(`Updating workout ${workout.workout_id} with:`, {
              description: workout.description,
              color: workout.color,
              notes: workout.notes
            });
            
            const { error } = await supabase
              .from('workouts')
              .update({ 
                description: workout.description, 
                color: workout.color,
                notes: workout.notes
              })
              .eq('workout_id', workout.workout_id);
            
            if (error) {
              console.error(`Error updating workout ${workout.workout_id}:`, error);
            } else {
              console.log(`Successfully updated workout ${workout.workout_id}`);
            }
          }
          console.log('Successfully updated existing workouts');
        }
        
        // Delete workouts from the database if any were marked for deletion
        if (workoutsToDelete.length > 0) {
          console.log(`Deleting ${workoutsToDelete.length} workouts from database...`);
          for (const workoutId of workoutsToDelete) {
            try {
              await deleteWorkout(workoutId);
            } catch (error) {
              console.error(`Error deleting workout ${workoutId}:`, error);
            }
          }
          // Clear the list after processing deletions
          setWorkoutsToDelete([]);
        }
        
        // Refresh the sessions list
        await fetchSessions();
      }
      
      alert('All sessions and workouts saved successfully!');
      // Clear unsaved changes flag after successful save
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving program:', error);
      alert('There was an error saving the program. Please try again.');
    } finally {
    setIsSaving(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!deleteSessionInfo || !programId) return;
    
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('session_id', deleteSessionInfo.id);
        
      if (error) {
        console.error('Error deleting session from Supabase:', error);
      } else {
        console.log('Successfully deleted session from Supabase');
      }
      
      deleteSession(programId, deleteSessionInfo.date, deleteSessionInfo.id);
      
      await fetchSessions();
      
    } catch (err) {
      console.error('Error in handleDeleteSession:', err);
      alert('There was an error deleting the session. Please try again.');
    } finally {
      setDeleteSessionInfo(null);
    }
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

  // Helper function to handle session deletion
  const confirmDeleteSession = (id: string, date: string, name: string) => {
    setDeleteSessionInfo({ id, date, name });
    // Set unsaved changes flag
    setHasUnsavedChanges(true);
  };

  // Handle deleting a workout
  const handleDeleteWorkout = (sessionId: string, dateStr: string, workoutId: string) => {
    try {
      const session = programs[programId].days[dateStr].sessions.find(s => s.id === sessionId);
      if (!session) return;

      // Find the workout to remove
      const workout = session.workouts.find(w => w.id === workoutId);
      if (!workout) return;
      
      // If this is not a new workout, mark it for deletion from the database
      if (!workout.isNew) {
        setWorkoutsToDelete(prev => [...prev, workoutId]);
      }
      
      // Remove the workout from local state
      updateSession(programId, dateStr, sessionId, {
        workouts: session.workouts.filter(w => w.id !== workoutId)
      });
      
      // Set unsaved changes flag
      setHasUnsavedChanges(true);
      
      console.log('Workout removed from local state!');
    } catch (error) {
      console.error('Error removing workout:', error);
      alert('There was an error removing the workout. Please try again.');
    }
  };

  // Handle adding a workout (only to local state)
  const handleAddWorkout = (sessionId: string, dateStr: string, workout: any) => {
    try {
      // First create a workout ID
      const workoutId = uuidv4();
      
      // Create the workout with additional properties
      const newWorkout = {
        id: workoutId,
        ...workout,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Add a flag to mark this as a new workout
        isNew: true
      };
      
      // Update the session in the local state
      updateSession(programId, dateStr, sessionId, {
        workouts: [...programs[programId].days[dateStr].sessions.find(s => s.id === sessionId).workouts, newWorkout],
      });
      
      // Set unsaved changes flag
      setHasUnsavedChanges(true);
      
      console.log('Workout added to local state!');
    } catch (error) {
      console.error('Error adding workout:', error);
      alert('There was an error adding the workout. Please try again.');
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
      const programData = programs[programId];
      if (programData) {
        // Collect all session data from all days
        const allSessions: Array<{
          program_id: string;
          name: string;
          description: string | null;
          session_id: string;
          session_date: string;
        }> = [];

        // Track sessions that need to be updated
        const sessionUpdates: Array<{
          program_id: string;
          name: string;
          description: string | null;
          session_id: string;
          session_date: string;
        }> = [];

        // Collect workouts that need to be saved
        const workoutsToSave: Array<{
          session_id: string;
          description: string;
          color: string;
          notes: string | null;
        }> = [];

        // Collect workouts that need to be updated
        const workoutsToUpdate: Array<{
          workout_id: string;
          description: string;
          color: string;
          notes: string | null;
        }> = [];

        // Iterate through program days and collect sessions
        Object.entries(programData.days).forEach(([dateStr, day]) => {
          day.sessions.forEach(session => {
            const existingSession = sessions.find(s => s.session_id === session.id);
            const sessionData = {
              program_id: programId,
              name: session.name,
              description: session.description || null,
              session_id: session.id,
              session_date: dateStr,
            };
            
            if (!existingSession) {
              // New session to insert
              allSessions.push({
                ...sessionData
              });
            } else if (
              existingSession.name !== session.name || 
              existingSession.description !== (session.description || null) ||
              existingSession.session_date !== dateStr
            ) {
              // Session exists but has been updated
              sessionUpdates.push(sessionData);
            }

            // Collect new workouts for this session
            session.workouts.forEach(workout => {
              console.log('Processing workout:', workout.id, workout.description, workout.isNew, workout.wasEdited);
              
              if (workout.isNew) {
                workoutsToSave.push({
                  session_id: session.id,
                  description: workout.description,
                  color: workout.color,
                  notes: workout.notes || null
                });
              } else if (workout.wasEdited) {
                console.log('Marking workout for update:', workout.id, workout.description);
                workoutsToUpdate.push({
                  workout_id: workout.id,
                  description: workout.description,
                  color: workout.color,
                  notes: workout.notes || null
                });
              }
            });
          });
        });

        console.log(`Saving ${allSessions.length} new sessions and updating ${sessionUpdates.length} existing sessions...`);
        
        // Handle inserts for new sessions
        if (allSessions.length > 0) {
          const { data, error } = await supabase
            .from('sessions')
            .insert(allSessions)
            .select();
          
          if (error) {
            console.error('Error saving sessions to Supabase:', error);
            throw new Error('Failed to save sessions');
          }
          
          console.log('Successfully saved new sessions:', data);
        }

        // Handle updates for existing sessions
        if (sessionUpdates.length > 0) {
          for (const update of sessionUpdates) {
            const { error } = await supabase
              .from('sessions')
              .update({ 
                name: update.name, 
                description: update.description,
                session_date: update.session_date
              })
              .eq('session_id', update.session_id);
            
            if (error) {
              console.error(`Error updating session ${update.session_id}:`, error);
            }
          }
          console.log('Successfully updated existing sessions');
        }

        // Save new workouts to the database
        if (workoutsToSave.length > 0) {
          console.log(`Saving ${workoutsToSave.length} new workouts to database...`);
          const { data, error } = await supabase
            .from('workouts')
            .insert(workoutsToSave)
            .select();

          if (error) {
            console.error('Error saving workouts to Supabase:', error);
            throw new Error('Failed to save workouts');
          }
          
          console.log('Successfully saved workouts:', data);
        }
        
        // Update existing workouts in the database
        if (workoutsToUpdate.length > 0) {
          console.log(`Updating ${workoutsToUpdate.length} existing workouts in database...`);
          console.log('Workouts to update:', workoutsToUpdate);
          
          for (const workout of workoutsToUpdate) {
            console.log(`Updating workout ${workout.workout_id} with:`, {
              description: workout.description,
              color: workout.color,
              notes: workout.notes
            });
            
            const { error } = await supabase
              .from('workouts')
              .update({ 
                description: workout.description, 
                color: workout.color,
                notes: workout.notes
              })
              .eq('workout_id', workout.workout_id);
            
            if (error) {
              console.error(`Error updating workout ${workout.workout_id}:`, error);
            } else {
              console.log(`Successfully updated workout ${workout.workout_id}`);
            }
          }
          console.log('Successfully updated existing workouts');
        }
        
        // Delete workouts from the database if any were marked for deletion
        if (workoutsToDelete.length > 0) {
          console.log(`Deleting ${workoutsToDelete.length} workouts from database...`);
          for (const workoutId of workoutsToDelete) {
            try {
              await deleteWorkout(workoutId);
            } catch (error) {
              console.error(`Error deleting workout ${workoutId}:`, error);
            }
          }
          // Clear the list after processing deletions
          setWorkoutsToDelete([]);
        }
        
        // Refresh the sessions list
        await fetchSessions();
      }
      
      alert('All sessions and workouts saved successfully!');
      // Clear unsaved changes flag after successful save
      setHasUnsavedChanges(false);
      
      // Navigate after successful save
      if (navigationDestination) {
        navigate(navigationDestination);
      }
    } catch (error) {
      console.error('Error saving before navigation:', error);
      alert('There was an error saving your changes. Please try again.');
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
    // Navigate to the stored destination
    if (navigationDestination) {
      navigate(navigationDestination);
    }
    setShowSaveConfirm(false);
    setNavigationDestination(null);
  };

  // Handle cancel navigation
  const handleCancelNavigation = () => {
    setShowSaveConfirm(false);
    setNavigationDestination(null);
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

              {/* Sessions */}
              <div className="p-3 space-y-3">
                {isInProgram && (
                  <>
                    {dayProgram?.sessions.map((session) => (
                      <SessionBlock
                        key={session.id}
                        session={session}
                        onUpdate={(updates) => {
                          updateSession(programId, dateStr, session.id, updates);
                          // Set unsaved changes flag
                          setHasUnsavedChanges(true);
                        }}
                          onDelete={() => confirmDeleteSession(session.id, dateStr, session.name)}
                          onAddWorkout={(workout) => {
                            handleAddWorkout(session.id, dateStr, workout);
                          }}
                          onEditWorkout={(workoutId, updates) => {
                            try {
                              // Use the session from the map function scope directly
                              // Get the current workouts and update the specific one
                              const workouts = [...session.workouts];
                              const workoutIndex = workouts.findIndex(w => w.id === workoutId);
                              
                              if (workoutIndex === -1) {
                                console.error("Workout not found:", workoutId);
                                return;
                              }
                              
                              workouts[workoutIndex] = {
                                ...workouts[workoutIndex],
                                ...updates,
                                updatedAt: new Date().toISOString(),
                                wasEdited: true // Mark as edited for database update
                              };
                              
                              // Update the session with the modified workouts array
                              updateSession(programId, dateStr, session.id, { workouts });
                              // Set unsaved changes flag
                              setHasUnsavedChanges(true);
                              console.log("Workout updated:", workoutId);
                            } catch (error) {
                              console.error("Error updating workout:", error);
                            }
                          }}
                          onDeleteWorkout={(workoutId) => {
                            handleDeleteWorkout(session.id, dateStr, workoutId);
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
            
            if (!dayProgram || !dayProgram.sessions || dayProgram.sessions.length === 0) {
              return (
                <div className="py-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400 mb-6">No sessions for this day yet.</p>
                  <button
                    onClick={() => setAddSessionDate(dateStr)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Session
                  </button>
                </div>
              );
            }
            
            return (
              <div className="space-y-8">
                {dayProgram.sessions.map((session) => (
                  <SessionBlock
                    key={session.id}
                    session={session}
                    onUpdate={(updates) => {
                      updateSession(programId, dateStr, session.id, updates);
                      // Set unsaved changes flag
                      setHasUnsavedChanges(true);
                    }}
                    onDelete={() => confirmDeleteSession(session.id, dateStr, session.name)}
                    onAddWorkout={(workout) => {
                      handleAddWorkout(session.id, dateStr, workout);
                    }}
                    onEditWorkout={(workoutId, updates) => {
                      try {
                        // Get the current workouts and update the specific one
                        const workouts = [...session.workouts];
                        const workoutIndex = workouts.findIndex(w => w.id === workoutId);
                        
                        if (workoutIndex === -1) {
                          console.error("Workout not found:", workoutId);
                          return;
                        }
                        
                        workouts[workoutIndex] = {
                          ...workouts[workoutIndex],
                          ...updates,
                          updatedAt: new Date().toISOString(),
                          wasEdited: true // Mark as edited for database update
                        };
                        
                        // Update the session with the modified workouts array
                        updateSession(programId, dateStr, session.id, { workouts });
                        // Set unsaved changes flag
                        setHasUnsavedChanges(true);
                        console.log("Workout updated:", workoutId);
                      } catch (error) {
                        console.error("Error updating workout:", error);
                      }
                    }}
                    onDeleteWorkout={(workoutId) => {
                      handleDeleteWorkout(session.id, dateStr, workoutId);
                    }}
                  />
                ))}
                
                <div className="text-center mt-8">
                  <button
                    onClick={() => setAddSessionDate(dateStr)}
                    className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border border-gray-300 dark:border-gray-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Session
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

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
            // Set unsaved changes flag
            setHasUnsavedChanges(true);
          }}
        />
      )}

      {deleteSessionInfo && (
        <DeleteConfirmModal
          sessionName={deleteSessionInfo.name}
          onConfirm={handleDeleteSession}
          onCancel={() => setDeleteSessionInfo(null)}
        />
      )}

      {showSaveConfirm && (
        <SaveConfirmModal
          onSave={handleSaveAndNavigate}
          onDiscard={handleDiscardAndNavigate}
          onCancel={handleCancelNavigation}
        />
      )}
    </div>
  );
}

export default ProgramCalendar;