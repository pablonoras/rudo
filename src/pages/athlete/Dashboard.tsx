/**
 * src/pages/athlete/Dashboard.tsx
 * 
 * Athlete Dashboard main page showing workouts and program information.
 * Updated to include week navigation, assigned programs list, and display all assigned programs in the calendar.
 * Athletes can view all their assigned programs and navigate through days of the week.
 * Enhanced with athlete activity features for workout completion and notes.
 * Coach management has been moved to the Account Settings page.
 * Added inactive athlete functionality - shows message instead of workouts when athlete is inactive.
 */

import { addDays, format, isToday, startOfWeek, subDays } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, Info, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AssignedProgram, AssignedPrograms } from '../../components/athlete/AssignedPrograms';
import { WorkoutCard } from '../../components/athlete/WorkoutCard';
import { InstallBanner } from '../../components/InstallBanner';
import { useProfile } from '../../contexts/ProfileContext';
import { useI18n } from '../../lib/i18n/context';
import { supabase } from '../../lib/supabase';
import { useWorkoutStore } from '../../lib/workout';

// Define interface for assigned programs
// interface AssignedProgram {
//   id: string;
//   name: string;
//   description?: string;
//   startDate: string;
//   endDate: string;
//   coachName: string;
// }

export function AthleteDashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { programs } = useWorkoutStore();
  const { profile } = useProfile();
  const { t } = useI18n();
  
  // Assigned programs state
  const [assignedPrograms, setAssignedPrograms] = useState<AssignedProgram[]>([]);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [dayWorkouts, setDayWorkouts] = useState<any[]>([]);
  
  // Inactive status state
  const [isInactive, setIsInactive] = useState(false);
  const [coachNames, setCoachNames] = useState<string[]>([]);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  const navigateDay = (direction: 'prev' | 'next') => {
    setSelectedDate(direction === 'prev' ? subDays(selectedDate, 1) : addDays(selectedDate, 1));
  };

  // Function to refresh data when activity changes
  const handleActivityChange = () => {
    // Could potentially refresh statistics or program data here
    // For now, we'll keep it simple and let the WorkoutCard handle its own state
  };

  // Check if athlete is inactive
  const checkAthleteStatus = async () => {
    if (!profile?.id) return;
    
    try {
      setIsCheckingStatus(true);
      
      // Get all coach relationships for this athlete
      const { data: relationships, error } = await supabase
        .from('coach_athletes')
        .select(`
          status,
          coach:coach_id(full_name)
        `)
        .eq('athlete_id', profile.id);
      
      if (error) {
        console.error('Error checking athlete status:', error);
        return;
      }
      
      if (!relationships || relationships.length === 0) {
        // No coach relationships found
        setIsInactive(false);
        return;
      }
      
      // Check if all relationships are inactive
      const allInactive = relationships.every(rel => rel.status === 'inactive');
      const hasActiveOrPending = relationships.some(rel => rel.status === 'active' || rel.status === 'pending');
      
      if (allInactive && !hasActiveOrPending) {
        setIsInactive(true);
        // Get coach names for display
        const names = relationships
          .map(rel => 
            rel.coach && typeof rel.coach === 'object' && 'full_name' in rel.coach 
              ? (rel.coach.full_name as string)
              : 'Unknown Coach'
          )
          .filter((name): name is string => typeof name === 'string');
        setCoachNames(names);
      } else {
        setIsInactive(false);
      }
    } catch (err) {
      console.error('Error checking athlete status:', err);
      setIsInactive(false);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Fetch assigned programs (only if athlete is not inactive)
  const fetchAssignedPrograms = async () => {
    if (!profile?.id || isInactive) {
      setAssignedPrograms([]);
      setIsLoadingPrograms(false);
      return;
    }
    
    try {
      setIsLoadingPrograms(true);
      
      // Step 1: Get program assignments for this athlete
      const { data: assignments, error: assignmentError } = await supabase
        .from('program_assignments')
        .select('program_id, start_date, end_date')
        .eq('athlete_id', profile.id);
      
      if (assignmentError) {
        console.error('Error fetching program assignments:', assignmentError);
        return;
      }
      
      if (!assignments || assignments.length === 0) {
        setAssignedPrograms([]);
        setIsLoadingPrograms(false);
        return;
      }
      
      // Step 2: Get program details
      const programIds = assignments.map(a => a.program_id);
      const { data: programs, error: programsError } = await supabase
        .from('programs')
        .select('id, name, description, coach_id')
        .in('id', programIds);
      
      if (programsError) {
        console.error('Error fetching programs:', programsError);
        return;
      }
      
      // Step 3: Get coach details
      const coachIds = programs?.map(p => p.coach_id) || [];
      const uniqueCoachIds = [...new Set(coachIds)];
      
      const { data: coaches, error: coachesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', uniqueCoachIds);
      
      if (coachesError) {
        console.error('Error fetching coaches:', coachesError);
      }
      
      // Step 4: Combine all data
      const formattedPrograms: AssignedProgram[] = assignments.map(assignment => {
        const program = programs?.find(p => p.id === assignment.program_id);
        const coach = program ? coaches?.find(c => c.id === program.coach_id) : null;
        
        return {
          id: assignment.program_id,
          name: program?.name || 'Unknown Program',
          description: program?.description,
          startDate: assignment.start_date,
          endDate: assignment.end_date,
          coachName: coach?.full_name || 'Unknown Coach'
        };
      });
      
      setAssignedPrograms(formattedPrograms);
    } catch (err) {
      console.error('Error fetching assigned programs:', err);
    } finally {
      setIsLoadingPrograms(false);
    }
  };

  // Fetch workouts for the selected date and program (only if athlete is not inactive)
  const fetchDayWorkouts = async () => {
    if (!profile?.id || isInactive) {
      setDayWorkouts([]);
      return;
    }
    
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Initialize array to hold all workouts from different sources
      let allWorkouts: any[] = [];
      
      // 1. First, get all direct workout assignments for this athlete
      const { data: directAssignments, error: directError } = await supabase
        .from('workout_assignments')
        .select(`
          id, 
          workout_id,
          workout_date
        `)
        .eq('athlete_id', profile.id)
        .eq('workout_date', dateStr);
      
      if (directError) {
        console.error('Error fetching direct workout assignments:', directError);
      } else if (directAssignments && directAssignments.length > 0) {
        // Extract workout IDs for the query
        const workoutIds = directAssignments.map(a => a.workout_id);
        
        // Get the workout details using the workout_id
        const { data: workouts, error: workoutsError } = await supabase
          .from('workouts')
          .select('*')
          .in('workout_id', workoutIds);
        
        if (workoutsError) {
          console.error('Error fetching workout details:', workoutsError);
        } else if (workouts) {
          // Process direct workout assignments
          const directWorkouts = directAssignments.map(assignment => {
            const workout = workouts?.find(w => w.workout_id === assignment.workout_id);
            
            return {
              id: assignment.workout_id,
              name: workout?.name || '',
              description: workout?.description || '',
              color: workout?.color || '#6366f1',
              notes: workout?.notes || '',
              assignmentType: 'direct',
              assignmentId: assignment.id
            };
          });
          
          allWorkouts = [...allWorkouts, ...directWorkouts];
        }
      }
      
      // 2. Now get program assignments for this athlete within the date range
      const { data: programAssignments, error: programAssignmentError } = await supabase
        .from('program_assignments')
        .select(`
          id,
          program_id,
          start_date,
          end_date,
          programs:programs(name, description)
        `)
        .eq('athlete_id', profile.id)
        .lte('start_date', dateStr)
        .gte('end_date', dateStr);
      
      if (programAssignmentError) {
        console.error('Error fetching program assignments:', programAssignmentError);
      } else if (programAssignments && programAssignments.length > 0) {
        // For each program assignment, find program workouts scheduled for this day
        for (const assignment of programAssignments) {
          // Get workouts for this program on this date
          const { data: programWorkouts, error: programWorkoutsError } = await supabase
            .from('program_workouts')
            .select(`
              id,
              workout_id,
              workout_date,
              program_id
            `)
            .eq('program_id', assignment.program_id)
            .eq('workout_date', dateStr);
          
          if (programWorkoutsError) {
            console.error('Error fetching program workouts:', programWorkoutsError);
          } else if (programWorkouts && programWorkouts.length > 0) {
            // Extract workout IDs for the query
            const workoutIds = programWorkouts.map(pw => pw.workout_id).filter(id => id !== null && id !== undefined);
            
            if (workoutIds.length > 0) {
              // Get the workout details directly from the workouts table
              const { data: workouts, error: workoutsError } = await supabase
                .from('workouts')
                .select('*')
                .in('workout_id', workoutIds);
              
              if (workoutsError) {
                console.error('Error fetching workout details for program:', workoutsError);
              } else if (workouts && workouts.length > 0) {
                // Process program workouts
                const workoutsFromProgram = programWorkouts.map(pw => {
                  const workout = workouts?.find(w => w.workout_id === pw.workout_id);
                  
                  if (!workout) return null;
                  
                  // Extract program name safely
                  const programName = typeof assignment.programs === 'object' && 
                    assignment.programs !== null && 
                    'name' in assignment.programs ? 
                    assignment.programs.name : 'Unknown Program';
                  
                  return {
                    id: pw.workout_id,
                    name: workout.name || '',
                    description: workout.description || '',
                    color: workout.color || '#6366f1', // Default indigo color
                    notes: workout.notes || '',
                    programName: programName,
                    assignmentType: 'program',
                    programId: assignment.program_id
                  };
                }).filter(workout => workout !== null);
                
                allWorkouts = [...allWorkouts, ...workoutsFromProgram];
              }
            }
          }
        }
      }
      
      setDayWorkouts(allWorkouts);
      
    } catch (err) {
      console.error('Error fetching day workouts:', err);
      setDayWorkouts([]);
    }
  };

  // Check athlete status when profile is available
  useEffect(() => {
    if (profile) {
      checkAthleteStatus();
    }
  }, [profile]);

  // Fetch assigned programs when profile is available and not inactive
  useEffect(() => {
    if (profile && !isCheckingStatus) {
      fetchAssignedPrograms();
    }
  }, [profile, isInactive, isCheckingStatus]);

  // Fetch workouts when date or selected program changes and not inactive
  useEffect(() => {
    if (profile && !isCheckingStatus && !isInactive) {
      fetchDayWorkouts();
    }
  }, [selectedDate, selectedProgramId, assignedPrograms, isInactive, isCheckingStatus]);

  // Loading state while checking status
  if (isCheckingStatus) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading...</span>
      </div>
    );
  }

  // Inactive athlete view
  if (isInactive) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('your-training')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('welcome-athlete-dashboard')}
          </p>
        </div>

        {/* Inactive Status Message */}
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-orange-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                {t('inactive-account')}
              </h3>
              <div className="mt-2 text-sm text-orange-700 dark:text-orange-400">
                <p className="mb-3">
                  {t('inactive-account-desc')}
                </p>
                <p className="mb-3">
                  <strong>{t('what-this-means')}</strong>
                </p>
                <ul className="list-disc list-inside mb-3 space-y-1">
                  <li>{t('no-workouts-displayed')}</li>
                  <li>{t('no-programs-visible')}</li>
                  <li>{t('calendar-empty')}</li>
                </ul>
                <p className="mb-3">
                  <strong>{t('to-reactivate')}</strong>
                </p>
                <p>
                  {coachNames.length > 1 ? t('contact-coaches') : t('contact-coach')}
                  {coachNames.length > 0 && (
                    <span className="font-semibold">
                      {coachNames.length === 1 
                        ? ` (${coachNames[0]})` 
                        : ` (${coachNames.join(', ')})`
                      }
                    </span>
                  )} {t('request-reactivation')}
                </p>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 text-orange-400 mr-2" />
                  <span className="text-orange-700 dark:text-orange-400">
                    {t('contact-coach-directly')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Empty calendar placeholder */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">{t('no-workouts-today')}</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {t('check-other-days')}
          </p>
        </div>
      </div>
    );
  }

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  
  return (
    <div className="space-y-4 md:space-y-6 pb-4 md:pb-0">
      {/* Mobile Date Header with Navigation */}
      <div className="block md:hidden">
        <div className="flex items-center justify-between px-4 py-2">
          <button
            onClick={() => navigateDay('prev')}
            className="p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <div className="text-center">
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {format(selectedDate, 'EEEE, MMMM d')}
            </h1>
          </div>
          
          <button
            onClick={() => navigateDay('next')}
            className="p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {isToday(selectedDate) ? t('your-training') : format(selectedDate, 'MMMM d, yyyy')}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('welcome-athlete-dashboard')}
        </p>
      </div>

      {/* Smart Install Banner */}
      <InstallBanner />

      {/* Week Navigation - Compact for mobile */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mx-2 md:mx-0">
        <div className="flex justify-between">
          {Array.from({ length: 7 }, (_, i) => {
            const date = addDays(startOfWeek(selectedDate), i);
            const dayName = format(date, 'EEE');
            const dayNumber = format(date, 'd');
            const isSelectedDay = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
            const isTodayDay = isToday(date);
            
            return (
              <button
                key={dayName}
                onClick={() => setSelectedDate(date)}
                className={`flex-1 py-3 md:py-3 flex flex-col items-center transition-colors first:rounded-l-lg last:rounded-r-lg ${
                  isSelectedDay
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                    : isTodayDay
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {dayName}
                </span>
                <span className={`text-base md:text-lg font-semibold mt-1 ${
                  isSelectedDay
                    ? 'text-blue-800 dark:text-blue-200'
                    : isTodayDay
                    ? 'text-gray-800 dark:text-gray-200'
                    : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {dayNumber}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Assigned Programs - Hidden on mobile, visible on desktop */}
      {isLoadingPrograms ? (
        <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {t('assigned-programs')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {t('loading-programs')}
          </p>
        </div>
      ) : (
        <div className="hidden md:block">
        <AssignedPrograms 
          programs={assignedPrograms} 
          onSelectProgram={setSelectedProgramId} 
          selectedProgramId={selectedProgramId} 
        />
        </div>
      )}

      {/* Date Navigation - Hide on mobile */}
      <div className="hidden md:flex items-center justify-between">
        <button
          onClick={() => navigateDay('prev')}
          className="p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {format(selectedDate, 'MMMM d, yyyy')}
          </span>
        </div>
        
        <button
          onClick={() => navigateDay('next')}
          className="p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Workouts */}
      <div className="space-y-4 px-2 md:px-0">
        {dayWorkouts.length > 0 ? (
          dayWorkouts.map((workout: any, index: number) => (
            <WorkoutCard 
              key={`${workout.id}-${index}`}
              workout={workout} 
              scheduledDate={selectedDate}
              onActivityChange={handleActivityChange}
            />
          ))
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
            <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">{t('no-workouts-scheduled')}</h3>
          </div>
        )}
      </div>
    </div>
  );
}