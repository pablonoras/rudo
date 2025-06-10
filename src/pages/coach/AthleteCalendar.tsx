import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { addDays, endOfWeek, format, isSameMonth, isToday, startOfMonth, startOfWeek } from 'date-fns';
import {
    AlertCircle,
    ArrowLeft,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Dumbbell,
    Loader2,
    PlusCircle,
    Search,
    X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useModal } from '../../contexts/ModalContext';
import { useProfile } from '../../contexts/ProfileContext';
import { useI18n } from '../../lib/i18n/context';
import { supabase } from '../../lib/supabase';

type Athlete = {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
};

type Workout = {
  id: string;
  name: string;
  description: string;
  color: string;
  notes: string;
  programName?: string;
  assignmentType: 'program' | 'direct';
  date: string;
  workout_type?: {
    id: number;
    code: string;
  };
  // Activity fields for athlete completion and notes
  activity?: {
    is_completed: boolean;
    is_unscaled: boolean | null;
    athlete_notes: string | null;
    completed_at: string | null;
  };
};

type CalendarViewType = 'week' | 'month';

// Map workout types to colors from the new palette
const TYPE_COLORS: Record<string, string> = {
  'strength': '#FECACA', // Light red
  'powerlifting': '#FEE2E2', // Lighter red
  'olympic': '#FDE68A', // Light amber
  'metcon': '#BAE6FD', // Light blue
  'conditioning': '#A5F3FC', // Light cyan
  'endurance': '#BAE6FD', // Light blue
  'cardio': '#A5F3FC', // Light cyan
  'aerobic': '#A5F3FC', // Light cyan
  'anaerobic': '#C4B5FD', // Light purple
  'skill': '#DDD6FE', // Lighter purple
  'technique': '#DDD6FE', // Lighter purple
  'gymnastics': '#FBCFE8', // Light pink
  'mobility': '#FECDD3', // Light pink-red
  'flexibility': '#FECDD3', // Light pink-red
  'recovery': '#A7F3D0', // Light green
  'warmup': '#BBF7D0', // Lighter green
  'cooldown': '#BBF7D0', // Lighter green
  'hypertrophy': '#FCD34D', // Amber
  'accessory': '#FDE68A', // Light amber
  'core': '#FCD34D', // Amber
  'stability': '#FDE68A', // Light amber
  'balance': '#FDE68A', // Light amber
  'agility': '#FCD34D', // Amber
  'speed': '#FDE68A', // Light amber
  'plyometric': '#FCD34D', // Amber
  'interval': '#C4B5FD', // Light purple
  'circuit': '#BAE6FD', // Light blue
  'team': '#C4B5FD', // Light purple
  'partner': '#DDD6FE', // Lighter purple
  'benchmark': '#FBCFE8', // Light pink
  'hero': '#FECDD3', // Light pink-red
  'girl': '#FBCFE8', // Light pink
  'test': '#FECACA', // Light red
  'max': '#FEE2E2', // Lighter red
  'custom': '#E5E7EB', // Light gray
};

// Helper function to get color based on workout type
const getWorkoutColor = (workout: Workout): string => {
  // If the workout has a custom color, use that
  if (workout.color) return workout.color;
  
  // If it has a type, use the predefined color for that type
  if (workout.workout_type?.code) {
    return TYPE_COLORS[workout.workout_type.code] || '#BAE6FD'; // Default to light blue
  }
  
  // Default colors based on assignment type
  return workout.assignmentType === 'program' ? '#BAE6FD' : '#C4B5FD';
};

// Workout library type
interface WorkoutLibraryItem extends Workout {
  workout_id: string;
  type_code?: string;
}

export function AthleteCalendar() {
  const { athleteId } = useParams<{ athleteId: string }>();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { showWorkoutForm } = useModal();
  const { t } = useI18n();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<CalendarViewType>('month');
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [showAssignWorkout, setShowAssignWorkout] = useState(false);
  const [assignmentDate, setAssignmentDate] = useState<string>('');
  
  // Workout library state
  const [workoutLibrary, setWorkoutLibrary] = useState<WorkoutLibraryItem[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [librarySearchQuery, setLibrarySearchQuery] = useState('');
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'library' | 'new'>('library');

  // Add state for confirmation modal
  const [showMoveConfirm, setShowMoveConfirm] = useState(false);
  const [workoutToMove, setWorkoutToMove] = useState<{
    workout: Workout;
    sourceDate: string;
    destinationDate: string;
  } | null>(null);

  // Add toast notification state for showing success/error messages
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' } | null>(null);

  // Fetch the athlete data directly from Supabase
  useEffect(() => {
    if (!athleteId) return;
    
    const fetchAthlete = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .eq('id', athleteId)
          .single();
          
        if (error) {
          throw error;
        }
        
        if (!data) {
          throw new Error('Athlete not found');
        }
        
        setAthlete(data);
      } catch (err) {
        console.error('Error fetching athlete data:', err);
        setError('Failed to load athlete data.');
      }
    };
    
    fetchAthlete();
  }, [athleteId]);

  // Get the calendar days based on the view mode
  const getDaysForCalendar = () => {
    if (calendarView === 'week') {
      // Week view: Get the current week (Monday to Sunday)
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    } else {
      // Month view: Get all days to display in the calendar grid (6 weeks)
      const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
      return Array.from({ length: 42 }, (_, i) => addDays(start, i));
    }
  };

  // Fetch workout data for the athlete
  const fetchWorkouts = async () => {
    if (!athleteId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Calculate date range based on view
      let startDate, endDate;
      
      if (calendarView === 'week') {
        startDate = format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        endDate = format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      } else {
        // For month view, we show 6 weeks to ensure we have complete weeks
        const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
        const end = addDays(start, 41); // 6 weeks (42 days), 0-indexed
        startDate = format(start, 'yyyy-MM-dd');
        endDate = format(end, 'yyyy-MM-dd');
      }
      
      console.log(`Fetching workouts for date range: ${startDate} to ${endDate}`);
      
      // 1. First fetch direct workout assignments
      const { data: directAssignments, error: directError } = await supabase
        .from('workout_assignments')
        .select(`
          id,
          workout_id,
          workout_date
        `)
        .eq('athlete_id', athleteId)
        .gte('workout_date', startDate)
        .lte('workout_date', endDate);
        
      if (directError) {
        throw directError;
      }
      
      console.log('Direct assignments:', directAssignments);
      
      // Get workout details for direct assignments
      const directWorkoutIds = directAssignments?.map(a => a.workout_id) || [];
      let directWorkouts: Workout[] = [];
      
      if (directWorkoutIds.length > 0) {
        const { data: workoutDetails, error: workoutsError } = await supabase
          .from('workouts')
          .select(`
            *,
            workout_type:type_id(id, code)
          `)
          .in('workout_id', directWorkoutIds);
          
        if (workoutsError) {
          throw workoutsError;
        }
        
        console.log('Workout details for direct assignments:', workoutDetails);
        
        directWorkouts = directAssignments.map(assignment => {
          const workout = workoutDetails?.find(w => w.workout_id === assignment.workout_id);
          return {
            id: assignment.workout_id,
            name: workout?.name || '',
            description: workout?.description || '',
            color: workout?.color || '#6366f1',
            notes: workout?.notes || '',
            assignmentType: 'direct',
            date: assignment.workout_date,
            workout_type: workout?.workout_type
          };
        });
      }
      
      // 2. Now fetch program assignments
      const { data: programAssignments, error: programAssignmentsError } = await supabase
        .from('program_assignments')
        .select(`
          id,
          program_id,
          start_date,
          end_date,
          programs:programs(name, description)
        `)
        .eq('athlete_id', athleteId)
        .lte('start_date', endDate)
        .gte('end_date', startDate);
        
      if (programAssignmentsError) {
        throw programAssignmentsError;
      }
      
      console.log('Program assignments:', programAssignments);
      
      // For each program assignment, find workouts within the date range
      let programWorkouts: Workout[] = [];
      
      for (const assignment of programAssignments || []) {
        const { data: programWorkoutsData, error: programWorkoutsError } = await supabase
          .from('program_workouts')
          .select(`
            id,
            workout_id,
            workout_date,
            program_id
          `)
          .eq('program_id', assignment.program_id)
          .gte('workout_date', startDate)
          .lte('workout_date', endDate);
          
        if (programWorkoutsError) {
          throw programWorkoutsError;
        }
        
        console.log(`Program workouts for program ${assignment.program_id}:`, programWorkoutsData);
        
        if (programWorkoutsData && programWorkoutsData.length > 0) {
          const workoutIds = programWorkoutsData.map(pw => pw.workout_id);
          
          const { data: workoutDetails, error: workoutsError } = await supabase
            .from('workouts')
            .select(`
              *,
              workout_type:type_id(id, code)
            `)
            .in('workout_id', workoutIds);
            
          if (workoutsError) {
            throw workoutsError;
          }
          
          console.log('Workout details for program workouts:', workoutDetails);
          
          const workoutsFromProgram = programWorkoutsData.map(pw => {
            const workout = workoutDetails?.find(w => w.workout_id === pw.workout_id);
            // Safely extract program name
            const programName = assignment.programs && 
              typeof assignment.programs === 'object' && 
              'name' in assignment.programs ? 
              (assignment.programs.name as string) : 
              undefined;
            
            return {
              id: pw.workout_id,
              name: workout?.name || '',
              description: workout?.description || '',
              color: workout?.color || '#3b82f6',
              notes: workout?.notes || '',
              programName: programName,
              assignmentType: 'program' as const,
              date: pw.workout_date,
              workout_type: workout?.workout_type
            };
          });
          
          programWorkouts = [...programWorkouts, ...workoutsFromProgram];
        }
      }
      
      // Combine all workouts
      const allWorkouts = [...directWorkouts, ...programWorkouts];
      console.log('All workouts:', allWorkouts);
      
      // Fetch activity data for all workouts
      const workoutsWithActivity: Workout[] = [];
      
      for (const workout of allWorkouts) {
        // Fetch activity data for this workout
        const { data: activityData, error: activityError } = await supabase
          .from('athlete_activity')
          .select('is_completed, is_unscaled, notes, completed_at')
          .eq('athlete_id', athleteId)
          .eq('workout_id', workout.id)
          .eq('scheduled_on', workout.date)
          .maybeSingle(); // Use maybeSingle since there might not be activity data
        
        if (activityError) {
          console.error('Error fetching activity for workout:', workout.id, activityError);
        }
        
        // Add activity data to workout
        workoutsWithActivity.push({
          ...workout,
          activity: activityData ? {
            is_completed: activityData.is_completed,
            is_unscaled: activityData.is_unscaled,
            athlete_notes: activityData.notes,
            completed_at: activityData.completed_at
          } : undefined
        });
      }
      
      setWorkouts(workoutsWithActivity);
    } catch (err: any) {
      console.error('Error fetching athlete workouts:', err);
      setError('Failed to load workouts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Call fetchWorkouts in the useEffect
  useEffect(() => {
    if (athleteId) {
      fetchWorkouts();
    }
  }, [athleteId, calendarView, currentDate]);

  // Update calendar days when view or date changes
  useEffect(() => {
    setCalendarDays(getDaysForCalendar());
  }, [currentDate, calendarView]);

  // Group workouts by date
  const workoutsByDate: Record<string, Workout[]> = {};
  
  calendarDays.forEach(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    workoutsByDate[dateStr] = workouts.filter(workout => workout.date === dateStr);
  });

  // Fetch coach's workout library
  const fetchWorkoutLibrary = async () => {
    if (!profile) return;
    
    setLoadingLibrary(true);
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          *,
          workout_type:type_id(id, code)
        `)
        .eq('coach_id', profile.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching workout library:', error);
        return;
      }
      
      // Transform data for the library view
      const transformedData = data?.map(workout => ({
        workout_id: workout.workout_id,
        id: workout.workout_id,
        name: workout.name || '',
        description: workout.description,
        color: workout.color,
        notes: workout.notes || '',
        type_code: workout.workout_type?.code,
        type_id: workout.type_id,
        assignmentType: 'direct' as const,
        date: '',
        workout_type: workout.workout_type
      })) || [];
      
      setWorkoutLibrary(transformedData);
    } catch (error) {
      console.error('Error fetching workout library:', error);
    } finally {
      setLoadingLibrary(false);
    }
  };

  // Filter library based on search
  const filteredLibrary = librarySearchQuery
    ? workoutLibrary.filter(workout => 
        (workout.name && workout.name.toLowerCase().includes(librarySearchQuery.toLowerCase())) ||
        workout.description.toLowerCase().includes(librarySearchQuery.toLowerCase()) ||
        (workout.type_code && workout.type_code.toLowerCase().includes(librarySearchQuery.toLowerCase()))
      )
    : workoutLibrary;

  // Handle assigning a workout to the athlete
  const handleAssignWorkout = async () => {
    if (!selectedWorkoutId || !assignmentDate || !athleteId) {
      alert('Please select a workout and date for assignment');
      return;
    }
    
    try {
      // Check if this workout is already assigned to the athlete on this date
      const { data: existingAssignments, error: checkError } = await supabase
        .from('workout_assignments')
        .select('id')
        .eq('athlete_id', athleteId)
        .eq('workout_id', selectedWorkoutId)
        .eq('workout_date', assignmentDate);
        
      if (checkError) {
        throw checkError;
      }
      
      if (existingAssignments && existingAssignments.length > 0) {
        alert('This workout is already assigned to this athlete on the selected date.');
        return;
      }
      
      // Create the assignment
      const { error: assignError } = await supabase
        .from('workout_assignments')
        .insert({
          athlete_id: athleteId,
          workout_id: selectedWorkoutId,
          workout_date: assignmentDate
        });
        
      if (assignError) {
        throw assignError;
      }
      
      // Refresh workouts and close modal
      fetchWorkouts();
      setShowAssignWorkout(false);
      setSelectedWorkoutId(null);
      setAssignmentDate('');
      
    } catch (error) {
      console.error('Error assigning workout:', error);
      alert('Failed to assign workout. Please try again.');
    }
  };

  // Update the useEffect to also load the workout library when the component mounts
  useEffect(() => {
    if (profile) {
      fetchWorkoutLibrary();
    }
  }, [profile]);

  // When opening the assign workout modal from a specific date
  const openAssignWorkoutModal = (date: string) => {
    setAssignmentDate(date);
    setShowAssignWorkout(true);
  };

  // Add function to handle workout date change
  const handleMoveWorkout = async () => {
    if (!workoutToMove || !athleteId) return;
    
    const { workout, sourceDate, destinationDate } = workoutToMove;
    
    try {
      if (workout.assignmentType === 'direct') {
        // Update direct assignment
        const { data: assignmentData, error: findError } = await supabase
          .from('workout_assignments')
          .select('id')
          .eq('athlete_id', athleteId)
          .eq('workout_id', workout.id)
          .eq('workout_date', sourceDate)
          .single();
          
        if (findError) {
          console.error('Error finding workout assignment:', findError);
          throw findError;
        }
        
        // Update the assignment date
        const { error: updateError } = await supabase
          .from('workout_assignments')
          .update({ workout_date: destinationDate })
          .eq('id', assignmentData.id);
          
        if (updateError) {
          console.error('Error updating workout assignment:', updateError);
          throw updateError;
        }
      } else if (workout.assignmentType === 'program') {
        // For program workouts, we need to find the program_workouts entry
        const { data: programWorkoutData, error: findError } = await supabase
          .from('program_workouts')
          .select('id')
          .eq('workout_id', workout.id)
          .eq('workout_date', sourceDate)
          .single();
          
        if (findError) {
          console.error('Error finding program workout:', findError);
          throw findError;
        }
        
        // Update the program workout date
        const { error: updateError } = await supabase
          .from('program_workouts')
          .update({ workout_date: destinationDate })
          .eq('id', programWorkoutData.id);
          
        if (updateError) {
          console.error('Error updating program workout:', updateError);
          throw updateError;
        }
      }
      
      // Refresh workouts after successful update
      fetchWorkouts();
      
      // Reset state
      setWorkoutToMove(null);
      setShowMoveConfirm(false);
    } catch (error) {
      console.error('Error moving workout:', error);
      alert('Failed to move workout. Please try again.');
      setWorkoutToMove(null);
      setShowMoveConfirm(false);
    }
  };

  // Add function to handle drag end
  const handleDragEnd = (result: any) => {
    const { source, destination, draggableId } = result;
    
    // Dropped outside a droppable area
    if (!destination) return;
    
    // Dropped in the same day, no change needed
    if (source.droppableId === destination.droppableId) return;
    
    // Find the workout that was moved
    const workout = workouts.find(w => `${w.id}-${w.assignmentType}` === draggableId);
    if (!workout) return;
    
    // Set up confirmation
    setWorkoutToMove({
      workout,
      sourceDate: source.droppableId,
      destinationDate: destination.droppableId
    });
    setShowMoveConfirm(true);
  };

  // Update renderMonthView to use drag and drop
  const renderMonthView = () => {
    // Create array of week rows
    const weeks = [];
    for (let i = 0; i < 6; i++) {
      weeks.push(calendarDays.slice(i * 7, (i + 1) * 7));
    }
    
    // This part will be used in the component JSX where workouts are rendered
    const renderWorkoutItem = (workout: Workout, isCompact: boolean = true, index: number) => (
      <Draggable 
        draggableId={`${workout.id}-${workout.assignmentType}`} 
        index={index}
        key={`${workout.id}-${workout.assignmentType}`}
      >
        {(provided) => (
          <div 
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`${isCompact ? 'text-xs' : 'text-sm'} rounded-md p-1.5 cursor-pointer hover:opacity-90 transition-colors shadow-sm border relative ${!workout.name ? 'py-1' : ''} ${
              workout.activity?.is_completed 
                ? 'border-green-400 ring-2 ring-green-200' 
                : 'border-white/20'
            }`}
            style={{
              backgroundColor: getWorkoutColor(workout),
              color: 'var(--workout-text-color, #1F2937)',
              ...provided.draggableProps.style
            }}
            title={workout.name || workout.workout_type?.code || ''}
            onClick={() => setSelectedWorkout(workout)}
          >
            {/* Completion status badge */}
            {workout.activity?.is_completed && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            )}
            
            {/* Show workout type as main title */}
            <div className="flex flex-col gap-0.5">
              <span className="font-normal uppercase tracking-wide text-center text-black font-poppins">
                {workout.workout_type?.code || 'Workout'}
              </span>
              
              {/* Only show name if it exists */}
              {workout.name && (
                <span className="text-[10px] opacity-90 text-center truncate text-black font-inter">
                  {workout.name}
                </span>
              )}
              
              {/* Completion status label */}
              {workout.activity?.is_completed && (
                <span className={`text-[9px] text-center font-medium ${
                  workout.activity.is_unscaled ? 'text-orange-700' : 'text-green-700'
                }`}>
                  {workout.activity.is_unscaled ? 'Scaled' : 'Done'}
                </span>
              )}
              
              {/* Athlete notes indicator */}
              {workout.activity?.athlete_notes && (
                <span className="text-[9px] text-center text-blue-700 font-medium">
                  {t('notes')}
                </span>
              )}
            </div>
          </div>
        )}
      </Draggable>
    );

    return (
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {/* Calendar Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-center">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
            </div>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            {[
              t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat'), t('sun')
            ].map((day) => (
              <div 
                key={day} 
                className="px-2 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="bg-white dark:bg-gray-800">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                {week.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const dayWorkouts = workoutsByDate[dateStr] || [];
                  const isTodays = isToday(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  
                  return (
                    <div 
                      key={dateStr} 
                      className={`min-h-[100px] p-1.5 border-r border-gray-200 dark:border-gray-700 last:border-r-0 relative
                        ${isTodays ? 'bg-blue-50 dark:bg-blue-900/10' : ''}
                        ${!isCurrentMonth ? 'bg-gray-50 dark:bg-gray-800/50 opacity-60' : ''}
                      `}
                    >
                      <div className={`text-right p-1 ${
                        isTodays 
                          ? 'font-bold text-blue-600 dark:text-blue-400' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {format(day, 'd')}
                      </div>
                      
                      <Droppable droppableId={dateStr}>
                        {(provided) => (
                          <div 
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="space-y-1.5 mt-1 min-h-[60px]"
                          >
                            {dayWorkouts.slice(0, 3).map((workout, index) => renderWorkoutItem(workout, true, index))}
                            
                            {dayWorkouts.length > 3 && (
                              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 pl-1 mt-1">
                                +{dayWorkouts.length - 3} more
                              </div>
                            )}
                            
                            {provided.placeholder}
                            
                            {isCurrentMonth && (
                              <div 
                                className="h-6 border border-dashed border-gray-200 dark:border-gray-700 rounded-md cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors mt-1"
                                onClick={() => openAssignWorkoutModal(dateStr)}
                              />
                            )}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </DragDropContext>
    );
  };

  // Update renderWeekView to use drag and drop
  const renderWeekView = () => {
    return (
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {/* Calendar Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {format(calendarDays[0], 'MMMM d')} - {format(calendarDays[6], 'MMMM d, yyyy')}
              </h2>
            </div>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
            {calendarDays.map((day) => (
              <div 
                key={day.toString()} 
                className={`px-4 py-3 text-center ${
                  isToday(day) 
                    ? 'bg-blue-50 dark:bg-blue-900/20' 
                    : 'bg-gray-50 dark:bg-gray-800/50'
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-gray-100">{format(day, 'EEE')}</div>
                <div className={`text-2xl ${
                  isToday(day) 
                    ? 'text-blue-600 dark:text-blue-400 font-bold' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          {/* Calendar Body */}
          <div className="grid grid-cols-7 min-h-[500px]">
            {calendarDays.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayWorkouts = workoutsByDate[dateStr] || [];
              
              return (
                <div 
                  key={dateStr} 
                  className={`border-r border-b border-gray-200 dark:border-gray-700 p-2 min-h-[100px] ${
                    isToday(day) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                  }`}
                >
                  <Droppable droppableId={dateStr}>
                    {(provided) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="space-y-2 min-h-[90%]"
                      >
                        {dayWorkouts.map((workout, index) => (
                          <Draggable 
                            draggableId={`${workout.id}-${workout.assignmentType}`} 
                            index={index}
                            key={`${workout.id}-${workout.assignmentType}`}
                          >
                            {(provided) => (
                              <div 
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`rounded-md p-2 cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-blue-500 transition-all shadow-sm border relative ${!workout.name ? 'py-1.5' : ''} ${
                                  workout.activity?.is_completed 
                                    ? 'border-green-400 ring-2 ring-green-200' 
                                    : 'border-white/20'
                                }`}
                                style={{
                                  backgroundColor: getWorkoutColor(workout),
                                  color: 'var(--workout-text-color, #1F2937)',
                                  ...provided.draggableProps.style
                                }}
                                onClick={() => setSelectedWorkout(workout)}
                              >
                                {/* Completion status badge */}
                                {workout.activity?.is_completed && (
                                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">✓</span>
                                  </div>
                                )}
                                
                                <div className="flex flex-col">
                                  <div className="flex items-center justify-center mb-1">
                                    <Dumbbell className="h-3 w-3 mr-1 text-black" />
                                    <span className="font-normal uppercase tracking-wide text-black">
                                      {workout.workout_type?.code || 'Workout'}
                                    </span>
                                  </div>
                                  {workout.name && (
                                    <div className="text-xs opacity-90 text-center truncate mb-1 text-black font-inter">
                                      {workout.name}
                                    </div>
                                  )}
                                  
                                  {/* Completion status label */}
                                  {workout.activity?.is_completed && (
                                    <div className={`text-xs text-center font-medium mb-1 ${
                                      workout.activity.is_unscaled ? 'text-orange-800' : 'text-green-800'
                                    }`}>
                                      {workout.activity.is_unscaled ? 'Scaled' : 'Done'}
                                    </div>
                                  )}
                                  
                                  {/* Athlete notes indicator */}
                                  {workout.activity?.athlete_notes && (
                                    <div className="text-xs text-center text-blue-800 font-medium mb-1">
                                      {t('notes')}
                                    </div>
                                  )}
                                  
                                  {workout.description && (
                                    <div className="text-xs opacity-80 line-clamp-2 mt-1 border-t border-white/20 pt-1 font-roboto text-black">
                                      {workout.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {dayWorkouts.length === 0 && (
                          <div 
                            className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-md cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                            onClick={() => openAssignWorkoutModal(dateStr)}
                          >
                            <div className="text-center p-4">
                              <PlusCircle className="h-6 w-6 text-gray-400 dark:text-gray-600 mx-auto" />
                              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                                Assign Workout
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </div>
      </DragDropContext>
    );
  };

  // Add confirmation modal for workout move
  const renderMoveConfirmModal = () => {
    if (!workoutToMove) return null;
    
    const { workout, sourceDate, destinationDate } = workoutToMove;
    const sourceDateFormatted = format(new Date(sourceDate), 'MMMM d, yyyy');
    const destinationDateFormatted = format(new Date(destinationDate), 'MMMM d, yyyy');
    
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
          <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                    Move Workout
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Are you sure you want to move this workout from {sourceDateFormatted} to {destinationDateFormatted}?
                    </p>
                    <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <p className="font-medium text-sm">
                        <span className="font-normal text-black">{workout.workout_type?.code || 'Workout'}</span>: {workout.name}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                onClick={handleMoveWorkout}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Move Workout
              </button>
              <button
                type="button"
                onClick={() => setShowMoveConfirm(false)}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add useEffect for auto-dismissing toast messages
  useEffect(() => {
    if (toast && toast.show) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000); // Dismiss after 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (loading && !athlete) {
    return (
      <div className="flex items-center justify-center h-80">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">{t('loading-workouts')}</span>
      </div>
    );
  }

  if (error && !athlete) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Athlete Not Found
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          The athlete you're looking for doesn't exist or you don't have permission to view their profile.
        </p>
        <button
          onClick={() => navigate('/coach/athletes')}
          className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('back-to-athletes')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate(`/coach/athletes`)}
            className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('back-to-athletes')}
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {t('today')}
          </button>
          <button
            onClick={() => {
              if (calendarView === 'week') {
                setCurrentDate(addDays(currentDate, -7));
              } else {
                setCurrentDate(addDays(currentDate, -30));
              }
            }}
            className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => {
              if (calendarView === 'week') {
                setCurrentDate(addDays(currentDate, 7));
              } else {
                setCurrentDate(addDays(currentDate, 30));
              }
            }}
            className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCalendarView(prev => prev === 'week' ? 'month' : 'week')}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            {calendarView === 'month' ? t('week-view') : t('month-view')}
          </button>
        </div>
        <button
          onClick={() => setShowAssignWorkout(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          {t('assign-workout')}
        </button>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {athlete?.full_name}'s Calendar
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('view-manage-workouts')}
        </p>
      </div>

      {/* Calendar */}
      {loading ? (
        <div className="flex items-center justify-center h-80">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">{t('loading-workouts')}</span>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-80">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">{error}</span>
        </div>
      ) : (
        calendarView === 'month' ? renderMonthView() : renderWeekView()
      )}
      
      {/* Workout move confirmation modal */}
      {showMoveConfirm && renderMoveConfirmModal()}

      {/* Assignment Modal */}
      {showAssignWorkout && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAssignWorkout(false)}></div>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                    {t('assign-workout-for')} {assignmentDate ? format(new Date(assignmentDate), 'MMMM d, yyyy') : t('selected-date')}
                  </h3>
                  <button
                    onClick={() => setShowAssignWorkout(false)}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                  <button
                    className={`px-4 py-2 text-sm font-medium ${
                      selectedTab === 'library'
                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                    onClick={() => setSelectedTab('library')}
                  >
                    {t('workout-library')}
                  </button>
                  <button
                    className={`px-4 py-2 text-sm font-medium ${
                      selectedTab === 'new'
                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                    onClick={() => setSelectedTab('new')}
                  >
                    {t('create-new-workout')}
                  </button>
                </div>

                {selectedTab === 'library' ? (
                  <div>
                    {/* Search Bar */}
                    <div className="mb-4">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder={t('search-workouts')}
                          value={librarySearchQuery}
                          onChange={(e) => setLibrarySearchQuery(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Workout Library List */}
                    {loadingLibrary ? (
                      <div className="py-6 flex justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                      </div>
                    ) : filteredLibrary.length > 0 ? (
                      <div className="h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
                        {filteredLibrary.map((workout) => (
                          <div
                            key={workout.workout_id}
                            className={`p-3 cursor-pointer border-b border-gray-200 dark:border-gray-700 ${
                              selectedWorkoutId === workout.workout_id
                                ? 'bg-blue-50 dark:bg-blue-900/20'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                            }`}
                            onClick={() => setSelectedWorkoutId(workout.workout_id)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                  {workout.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  {workout.workout_type && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                      {workout.workout_type.code}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div 
                                className="h-6 w-6 rounded-full"
                                style={{ backgroundColor: workout.color }}
                              />
                            </div>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2 font-mono">
                              {workout.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 border border-gray-200 dark:border-gray-700 rounded-md">
                        <p className="text-gray-500 dark:text-gray-400">
                          {librarySearchQuery ? t('no-matching-workouts-found') : t('no-workouts-in-library')}
                        </p>
                        <button
                          onClick={() => setSelectedTab('new')}
                          className="mt-4 inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                        >
                          <PlusCircle className="h-4 w-4 mr-1.5" />
                          {t('create-a-new-workout')}
                        </button>
                      </div>
                    )}

                  </div>
                ) : (
                  <div>
                    <button
                      onClick={() => {
                        showWorkoutForm({
                          title: t('create-new-workout'),
                          onSave: async (workout: {
                            description: string;
                            color: string;
                            notes?: string;
                            name?: string;
                            type_id: number;
                            wasEdited: boolean;
                            coach_id?: string;
                          }) => {
                            try {
                              // Save the workout to the database
                              const { data, error } = await supabase
                                .from('workouts')
                                .insert([{
                                  description: workout.description,
                                  color: workout.color,
                                  name: workout.name,
                                  notes: workout.notes,
                                  coach_id: profile?.id,
                                  type_id: workout.type_id
                                }])
                                .select();
                              
                              if (error) throw error;
                              
                              // Show success message
                              setToast({
                                show: true,
                                message: t('workout-created-successfully'),
                                type: 'success'
                              });
                              
                              // Set the newly created workout as selected
                              if (data && data.length > 0) {
                                setSelectedWorkoutId(data[0].workout_id);
                                // Refresh the workout library
                                await fetchWorkoutLibrary();
                                // Switch back to library tab to show the selected workout
                                setSelectedTab('library');
                                // Reopen the assign workout modal
                                setTimeout(() => {
                                  setShowAssignWorkout(true);
                                }, 100);
                              }
                            } catch (error) {
                              console.error('Error creating workout:', error);
                              setToast({
                                show: true,
                                message: t('failed-create-workout'),
                                type: 'error'
                              });
                              
                              // Reopen the assign workout modal
                              setTimeout(() => {
                                setShowAssignWorkout(true);
                              }, 100);
                            }
                          }
                        });
                        // Temporarily close the modal while creating workout
                        setShowAssignWorkout(false);
                      }}
                      className="w-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                    >
                      <PlusCircle className="h-8 w-8 text-blue-500 mb-2" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('create-new-workout')}
                      </span>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {t('opens-workout-form')}
                      </p>
                    </button>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleAssignWorkout}
                  disabled={!selectedWorkoutId}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('assign-workout')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssignWorkout(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Workout Details Modal */}
      {selectedWorkout && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setSelectedWorkout(null)}></div>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="relative">
                {/* Color bar at top */}
                <div 
                  className="h-2 w-full absolute top-0 left-0 right-0"
                  style={{ backgroundColor: getWorkoutColor(selectedWorkout) }}
                />
                
                <div className="px-4 pt-5 pb-4 sm:p-6 mt-2">
                  <div className="flex justify-between items-start">
                    <div>
                      {selectedWorkout.name ? (
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                          {selectedWorkout.name}
                        </h3>
                      ) : (
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 uppercase">
                          {selectedWorkout.workout_type?.code || 'Workout'}
                        </h3>
                      )}
                      <div className="mt-1 flex items-center">
                        <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full">
                          {selectedWorkout.workout_type?.code || 'No type'}
                        </span>
                        {selectedWorkout.programName && (
                          <span className="ml-2 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-0.5 rounded-full">
                            {selectedWorkout.programName}
                          </span>
                        )}
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(selectedWorkout.date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedWorkout(null)}
                      className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="mt-4">
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md font-roboto text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                      {selectedWorkout.description}
                    </div>
                    
                    {selectedWorkout.notes && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-inter">
                          Additional Notes:
                        </h4>
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md text-sm whitespace-pre-wrap text-gray-600 dark:text-gray-400 font-inter">
                          {selectedWorkout.notes}
                        </div>
                      </div>
                    )}
                    
                    {/* Athlete Activity Section */}
                    {selectedWorkout.activity && (
                      <div className="mt-4 border-t border-gray-200 dark:border-gray-600 pt-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 font-inter">
                          Athlete Activity:
                        </h4>
                        
                        {/* Completion Status */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            selectedWorkout.activity.is_completed 
                              ? selectedWorkout.activity.is_unscaled
                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                            {selectedWorkout.activity.is_completed ? (
                              <>
                                <span className="mr-1">✓</span>
                                {selectedWorkout.activity.is_unscaled ? 'Completed (Scaled)' : 'Completed (As Prescribed)'}
                              </>
                            ) : (
                              'Not Completed'
                            )}
                          </div>
                          
                          {selectedWorkout.activity.completed_at && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {format(new Date(selectedWorkout.activity.completed_at), 'MMM d, h:mm a')}
                            </span>
                          )}
                        </div>
                        
                        {/* Athlete Notes */}
                        {selectedWorkout.activity.athlete_notes && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-inter">
                              Athlete Notes:
                            </h5>
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-md text-sm whitespace-pre-wrap text-blue-900 dark:text-blue-200 font-inter">
                              {selectedWorkout.activity.athlete_notes}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={() => setSelectedWorkout(null)}
                    className="w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
                  >
                    {t('close')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && toast.show && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in-down max-w-md">
          <div className={`flex items-center p-4 rounded-lg shadow-lg ${
            toast.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
          }`}>
            <div className={`flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full ${
              toast.type === 'success' ? 'bg-green-100 dark:bg-green-800' : 'bg-red-100 dark:bg-red-800'
            }`}>
              {toast.type === 'success' ? (
                <svg className="h-6 w-6 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-6 w-6 text-red-600 dark:text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                toast.type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
              }`}>
                {toast.message}
              </p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setToast(null)}
                  className={`inline-flex rounded-md p-1.5 ${
                    toast.type === 'success' 
                      ? 'text-green-500 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-800' 
                      : 'text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800'
                  }`}
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}