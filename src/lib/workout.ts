import { create } from 'zustand';
import { supabase } from './supabase';

export type SessionType = 
  | 'CrossFit'
  | 'Olympic Weightlifting'
  | 'Powerlifting'
  | 'Endurance'
  | 'Gymnastics'
  | 'Recovery'
  | 'Competition Prep'
  | 'Skills & Drills'
  | 'Custom';

export type WorkoutType = 'warmup' | 'strength' | 'wod' | 'cooldown';
export type WorkoutFormat = 'forTime' | 'amrap' | 'emom' | 'tabata' | 'rounds' | 'complex' | 'benchmark';
export type ProgramStatus = 'draft' | 'published' | 'archived';

export interface Session {
  id: string;
  name: string;
  description?: string;
  workouts: WorkoutBlock[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutBlock {
  id: string;
  name: string;
  type: WorkoutType;
  format?: WorkoutFormat;
  description: string;
  color?: string;
  timeLimit?: number;
  rounds?: number;
  interval?: number;
  scaling?: string;
  stimulus?: string;
  goal?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  isNew?: boolean;
  wasEdited?: boolean;
}

export interface DayProgram {
  id: string;
  date: string;
  sessions: Session[];
}

export interface ProgramAssignment {
  date: string;
  athletes: string[];
  message?: string;
  replacedExisting: boolean;
}

export interface Program {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: ProgramStatus;
  weekCount: number;
  days: Record<string, DayProgram>;
  assignedTo: {
    athletes: string[];
  };
  assignments?: ProgramAssignment[];
  createdAt: string;
  updatedAt: string;
}

interface WorkoutStore {
  programs: Record<string, Program>;
  selectedProgramId: string | null;
  programFilter: ProgramStatus | 'all';
  
  // Program Management
  createProgram: (program: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateProgram: (programId: string, updates: Partial<Program>) => void;
  updateProgramDetails: (programId: string, updates: { name?: string, weekCount?: number, startDate?: string, endDate?: string }) => Promise<void>;
  updateProgramInDatabase: (programId: string, updates: { name?: string, weekCount?: number, startDate?: string, endDate?: string }) => Promise<void>;
  deleteProgram: (programId: string) => Promise<void>;
  selectProgram: (programId: string | null) => void;
  updateProgramStatus: (programId: string, status: ProgramStatus) => Promise<void>;
  fetchPrograms: () => Promise<void>;
  setProgramFilter: (filter: ProgramStatus | 'all') => void;
  
  // Workout Management
  addWorkout: (programId: string, date: string, workout: Omit<WorkoutBlock, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateWorkout: (programId: string, date: string, workoutId: string, updates: Partial<WorkoutBlock>) => void;
  deleteWorkout: (programId: string, date: string, workoutId: string) => void;
  duplicateWorkout: (programId: string, fromDate: string, toDate: string, workoutId: string) => void;
  duplicateDay: (programId: string, fromDate: string, toDate: string) => void;
  duplicateWeek: (programId: string, fromDate: string) => void;
  
  // Session Management
  addSession: (programId: string, date: string, session: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSession: (programId: string, date: string, sessionId: string, updates: Partial<Session>) => void;
  deleteSession: (programId: string, date: string, sessionId: string) => void;
  
  // Assignment Management
  assignProgram: (
    programId: string,
    athletes: string[],
    message?: string
  ) => void;
  unassignProgramAthlete: (programId: string, athleteId: string) => Promise<void>;
}

export const useWorkoutStore = create<WorkoutStore>((set) => ({
  programs: {},
  selectedProgramId: null,
  programFilter: 'all',

  createProgram: async (program) => {
    console.log('Creating program in Supabase...', program);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('No authenticated user found.', userError);
      return '';
    }
    const { data: inserted, error } = await supabase
      .from('programs')
      .insert([{ 
        coach_id: user.id,
        name: program.name,
        description: program.description ?? null,
        duration_weeks: program.weekCount,
        status: program.status,
        start_date: program.startDate,
        end_date: program.endDate,
      }])
      .select()
      .single();
    if (error || !inserted) {
      console.error('Error creating program:', error);
      return '';
    }
    const createdProgram: Program = {
      id: inserted.id,
      name: inserted.name,
      description: inserted.description ?? undefined,
      startDate: inserted.start_date,
      endDate: inserted.end_date,
      status: inserted.status as ProgramStatus,
      weekCount: inserted.duration_weeks,
      days: {},
      assignedTo: { athletes: [] },
      createdAt: inserted.created_at,
      updatedAt: inserted.updated_at,
    };
    set((state) => ({
      programs: {
        ...state.programs,
        [createdProgram.id]: createdProgram,
      },
      selectedProgramId: createdProgram.id,
    }));
    return createdProgram.id;
  },

  updateProgram: (programId, updates) =>
    set((state) => ({
      programs: {
        ...state.programs,
        [programId]: {
          ...state.programs[programId],
          ...updates,
          updatedAt: new Date().toISOString(),
        },
      },
    })),

  updateProgramDetails: async (programId, updates) => {
    console.log('Updating program details...', programId, updates);
    const { data: updated, error } = await supabase
      .from('programs')
      .update(updates)
      .eq('id', programId)
      .select()
      .single();
    if (error || !updated) {
      console.error('Error updating program details:', error);
      return;
    }
    set((state) => ({
      programs: {
        ...state.programs,
        [programId]: {
          ...state.programs[programId],
          ...updates,
          updatedAt: updated.updated_at,
        },
      },
    }));
  },

  updateProgramInDatabase: async (programId, updates) => {
    console.log('Updating program details in database...', programId, updates);
    
    // Map frontend field names to database field names
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.weekCount !== undefined) dbUpdates.duration_weeks = updates.weekCount;
    if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
    if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
    
    console.log('Mapped updates for database:', dbUpdates);
    
    const { data: updated, error } = await supabase
      .from('programs')
      .update(dbUpdates)
      .eq('id', programId)
      .select()
      .single();
      
    if (error || !updated) {
      console.error('Error updating program details in database:', error);
      return;
    }
    
    console.log('Program updated in database:', updated);
    
    // Update the local state with frontend field names
    set((state) => ({
      programs: {
        ...state.programs,
        [programId]: {
          ...state.programs[programId],
          name: updates.name ?? state.programs[programId].name,
          weekCount: updates.weekCount ?? state.programs[programId].weekCount,
          startDate: updates.startDate ?? state.programs[programId].startDate,
          endDate: updates.endDate ?? state.programs[programId].endDate,
          updatedAt: updated.updated_at,
        },
      },
    }));
  },

  deleteProgram: async (programId) => {
    console.log('Deleting program from Supabase...', programId);
    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', programId);
    
    if (error) {
      console.error('Error deleting program:', error);
      return;
    }
    
    set((state) => {
      const { [programId]: _, ...remainingPrograms } = state.programs;
      return {
        programs: remainingPrograms,
        selectedProgramId: state.selectedProgramId === programId ? null : state.selectedProgramId,
      };
    });
  },

  selectProgram: (programId) =>
    set({ selectedProgramId: programId }),

  updateProgramStatus: async (programId, status) => {
    console.log('Updating program status...', programId, status);
    const { data: updated, error } = await supabase
      .from('programs')
      .update({ status })
      .eq('id', programId)
      .select()
      .single();
    if (error || !updated) {
      console.error('Error updating program status:', error);
      return;
    }
    set((state) => ({
      programs: {
        ...state.programs,
        [programId]: {
          ...state.programs[programId],
          status: updated.status as ProgramStatus,
          updatedAt: updated.updated_at,
        },
      },
    }));
  },

  fetchPrograms: async () => {
    console.log('Fetching programs for current coach from Supabase...');
    try {
      // Get the current authenticated user to filter by coach_id
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('No authenticated user found for fetching programs.', userError);
        return;
      }
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('coach_id', user.id);
      if (error) {
        console.error('Error fetching programs:', error);
        return;
      }
      
      if (!data || data.length === 0) {
        console.log('No programs found for this coach');
        set({ programs: {} });
        return;
      }
      
      console.log(`Found ${data.length} programs for coach`);
      
      // Transform the programs
      const programsMap: Record<string, Program> = {};
      for (const row of data) {
        programsMap[row.id] = {
          id: row.id,
          name: row.name,
          description: row.description ?? undefined,
          startDate: row.start_date,
          endDate: row.end_date,
          status: row.status as ProgramStatus,
          weekCount: row.duration_weeks,
          days: {},
          assignedTo: { athletes: [] },
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      }
      
      // Fetch assigned athletes for each program
      try {
        const programIds = Object.keys(programsMap);
        
        if (programIds.length === 0) {
          console.log('No program IDs to fetch assignments for');
          set({ programs: programsMap });
          return;
        }
        
        console.log('Fetching program assignments for programs:', programIds);
        
        const { data: assignments, error: assignmentsError } = await supabase
          .from('program_assignments')
          .select('program_id, athlete_id')
          .in('program_id', programIds);
          
        if (assignmentsError) {
          console.error('Error fetching program assignments:', assignmentsError);
          // Continue without assignments rather than failing completely
        } else if (assignments && assignments.length > 0) {
          console.log(`Found ${assignments.length} program assignments`);
          
          // Group assignments by program
          assignments.forEach(assignment => {
            if (programsMap[assignment.program_id]) {
              programsMap[assignment.program_id].assignedTo.athletes.push(assignment.athlete_id);
            }
          });
          
          // Log programs with their assigned athletes
          Object.values(programsMap).forEach(program => {
            console.log(`Program ${program.name} has ${program.assignedTo.athletes.length} assigned athletes`);
          });
        } else {
          console.log('No program assignments found');
        }
      } catch (e) {
        console.error('Error processing program assignments:', e);
        // Continue with the programs without assignments rather than failing completely
      } finally {
        // Always set the programs even if fetching assignments fails
        set({ programs: programsMap });
      }
    } catch (error) {
      console.error('Unexpected error in fetchPrograms:', error);
      // Set an empty programs object to avoid UI issues
      set({ programs: {} });
    }
  },

  setProgramFilter: (filter) =>
    set({ programFilter: filter }),

  // Stub methods for workout/session/assignment management
  addWorkout: (_programId, _date, _workout) => {
    console.warn('addWorkout is not implemented yet.');
  },
  updateWorkout: (_programId, _date, _workoutId, _updates) => {
    console.warn('updateWorkout is not implemented yet.');
  },
  deleteWorkout: (_programId, _date, _workoutId) => {
    console.warn('deleteWorkout is not implemented yet.');
  },
  duplicateWorkout: (_programId, _fromDate, _toDate, _workoutId) => {
    console.warn('duplicateWorkout is not implemented yet.');
  },
  duplicateDay: (_programId, _fromDate, _toDate) => {
    console.warn('duplicateDay is not implemented yet.');
  },
  duplicateWeek: (_programId, _fromDate) => {
    console.warn('duplicateWeek is not implemented yet.');
  },
  addSession: (programId, date, session) => {
    set((state) => {
      // Get existing program data
      const program = state.programs[programId];
      if (!program) return state;
      
      // Check if this date already exists in the program's days
      const existingDay = program.days[date];
      const newSession = {
        ...session,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      if (existingDay) {
        // Add session to existing day
        return {
          programs: {
            ...state.programs,
            [programId]: {
              ...program,
              days: {
                ...program.days,
                [date]: {
                  ...existingDay,
                  sessions: [...existingDay.sessions, newSession],
                },
              },
            },
          },
        };
      } else {
        // Create new day with this session
        return {
          programs: {
            ...state.programs,
            [programId]: {
              ...program,
              days: {
                ...program.days,
                [date]: {
                  id: crypto.randomUUID(),
                  date,
                  sessions: [newSession],
                },
              },
            },
          },
        };
      }
    });
  },
  updateSession: (programId, date, sessionId, updates) => {
    set((state) => {
      // Get existing program and days data
      const program = state.programs[programId];
      if (!program) return state;
      
      // Check if the day exists in the program
      const day = program.days[date];
      if (!day) return state;
      
      // Find the session to update
      const sessionIndex = day.sessions.findIndex(s => s.id === sessionId);
      if (sessionIndex === -1) return state;
      
      // Create new array with updated session
      const updatedSessions = [...day.sessions];
      updatedSessions[sessionIndex] = {
        ...updatedSessions[sessionIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      // Return updated state
      return {
        programs: {
          ...state.programs,
          [programId]: {
            ...program,
            days: {
              ...program.days,
              [date]: {
                ...day,
                sessions: updatedSessions
              }
            }
          }
        }
      };
    });
  },
  deleteSession: (programId, date, sessionId) => {
    set((state) => {
      // Get existing program and days data
      const program = state.programs[programId];
      if (!program) return state;
      
      // Check if the day exists in the program
      const day = program.days[date];
      if (!day) return state;
      
      // Filter out the session to delete
      const filteredSessions = day.sessions.filter(s => s.id !== sessionId);
      
      // If no sessions left for this day, we could remove the day entirely
      // or keep an empty day (chosen to keep the day for simplicity)
      return {
        programs: {
          ...state.programs,
          [programId]: {
            ...program,
            days: {
              ...program.days,
              [date]: {
                ...day,
                sessions: filteredSessions
              }
            }
          }
        }
      };
    });
  },
  assignProgram: async (programId, athletes, message) => {
    console.log('Assigning program to athletes:', programId, athletes);
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('No authenticated user found.', userError);
        return;
      }
      
      console.log('Current user ID:', user.id);
      
      // Get the program dates to use for assignments
      const { data: program, error: programError } = await supabase
        .from('programs')
        .select('start_date, end_date')
        .eq('id', programId)
        .single();
        
      if (programError) {
        console.error('Error fetching program dates:', programError);
        return;
      }
      
      console.log('Program dates:', program.start_date, program.end_date);
      
      // Check for existing assignments to avoid duplicates
      const { data: existingAssignments, error: existingError } = await supabase
        .from('program_assignments')
        .select('athlete_id')
        .eq('program_id', programId);
        
      if (existingError) {
        console.error('Error checking existing assignments:', existingError);
      }
      
      console.log('Existing assignments:', existingAssignments);
      
      // Filter out athletes that are already assigned
      const existingAthleteIds = existingAssignments?.map(a => a.athlete_id) || [];
      const newAthletes = athletes.filter(id => !existingAthleteIds.includes(id));
      
      console.log('Filtered new athletes to assign:', newAthletes);
      
      if (newAthletes.length === 0) {
        console.log('No new athletes to assign');
        
        // Still update the local state for UI consistency
        set(state => {
          const updatedProgram = { 
            ...state.programs[programId],
            assignedTo: {
              athletes: [...new Set([...state.programs[programId].assignedTo.athletes, ...athletes])]
            }
          };
          
          return {
            programs: {
              ...state.programs,
              [programId]: updatedProgram
            }
          };
        });
        
        return;
      }
      
      // Create program assignments for each new athlete
      const assignments = newAthletes.map(athleteId => ({
        program_id: programId,
        athlete_id: athleteId,
        start_date: program.start_date,
        end_date: program.end_date,
      }));
      
      console.log('Inserting assignments:', assignments);
      
      const { data: inserted, error: assignError } = await supabase
        .from('program_assignments')
        .insert(assignments)
        .select();
        
      if (assignError) {
        console.error('Error creating program assignments:', assignError);
        return;
      }
      
      console.log('Successfully inserted assignments:', inserted);
      
      // Update local state to reflect the assignments
      set(state => {
        // Use Set to ensure we don't have duplicates
        const updatedProgram = { 
          ...state.programs[programId],
          assignedTo: {
            athletes: [...new Set([...state.programs[programId].assignedTo.athletes, ...athletes])]
          }
        };
        
        return {
          programs: {
            ...state.programs,
            [programId]: updatedProgram
          }
        };
      });
    } catch (error) {
      console.error('Error in assignProgram:', error);
      throw error; // Re-throw to allow the calling component to handle it
    }
  },
  unassignProgramAthlete: async (programId, athleteId) => {
    console.log('Unassigning athlete from program:', programId, athleteId);
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('No authenticated user found.', userError);
        return;
      }
      
      console.log('Current user ID:', user.id);
      
      // Remove the athlete from the program_assignments table
      const { error: removeError } = await supabase
        .from('program_assignments')
        .delete()
        .eq('program_id', programId)
        .eq('athlete_id', athleteId);
      
      if (removeError) {
        console.error('Error removing athlete from program:', removeError);
        return;
      }
      
      // Update local state to reflect the unassignment
      set(state => {
        const updatedProgram = { 
          ...state.programs[programId],
          assignedTo: {
            athletes: state.programs[programId].assignedTo.athletes.filter(id => id !== athleteId)
          }
        };
        
        return {
          programs: {
            ...state.programs,
            [programId]: updatedProgram
          }
        };
      });
    } catch (error) {
      console.error('Error in unassignProgramAthlete:', error);
      throw error; // Re-throw to allow the calling component to handle it
    }
  },
}));
// All unimplemented methods stubbed; store exports cleanly now.

// Add back the initializeWithSampleData function needed by DemoInitializer
export function initializeWithSampleData() {
  // No sample data initialization - demo data removed
  console.log('Sample data initialization skipped - demo data removed');
}

// Save a workout to the workouts table
export const saveWorkout = async (
  sessionId: string,
  workout: {
    description: string;
    color: string;
    notes?: string;
  }
) => {
  console.log('Saving workout to Supabase...', { sessionId, workout });
  
  try {
    const { data, error } = await supabase
      .from('workouts')
      .insert({
        session_id: sessionId,
        description: workout.description,
        color: workout.color,
        notes: workout.notes || null
      })
      .select();
    
    if (error) {
      console.error('Error saving workout:', error);
      throw new Error('Failed to save workout');
    }
    
    console.log('Successfully saved workout:', data);
    return data[0];
  } catch (error) {
    console.error('Error in saveWorkout:', error);
    throw error;
  }
};

// Delete a workout from the workouts table
export const deleteWorkout = async (workoutId: string) => {
  console.log('Deleting workout from Supabase...', workoutId);
  
  try {
    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('workout_id', workoutId);
    
    if (error) {
      console.error('Error deleting workout:', error);
      throw new Error('Failed to delete workout');
    }
    
    console.log('Successfully deleted workout');
    return true;
  } catch (error) {
    console.error('Error in deleteWorkout:', error);
    throw error;
  }
};