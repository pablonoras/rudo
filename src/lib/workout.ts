import { create } from 'zustand';
import { samplePrograms } from './sampleData';

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
  type: SessionType;
  duration: number;
  startTime?: string;
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
  timeLimit?: number;
  rounds?: number;
  interval?: number;
  scaling?: string;
  stimulus?: string;
  goal?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DayProgram {
  id: string;
  date: string;
  sessions: Session[];
}

export interface ProgramAssignment {
  date: string;
  athletes: string[];
  teams: string[];
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
    teams: string[];
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
  createProgram: (program: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateProgram: (programId: string, updates: Partial<Program>) => void;
  deleteProgram: (programId: string) => void;
  selectProgram: (programId: string | null) => void;
  updateProgramStatus: (programId: string, status: ProgramStatus) => void;
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
    data: {
      athletes: string[];
      teams: string[];
      message?: string;
      replaceExisting: boolean;
    }
  ) => void;
}

export const useWorkoutStore = create<WorkoutStore>((set) => ({
  programs: {},
  selectedProgramId: null,
  programFilter: 'all',

  createProgram: (program) => {
    const id = `program-${Date.now()}`;
    const now = new Date().toISOString();
    
    set((state) => ({
      programs: {
        ...state.programs,
        [id]: {
          ...program,
          id,
          createdAt: now,
          updatedAt: now,
        },
      },
      selectedProgramId: id,
    }));

    return id;
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

  deleteProgram: (programId) =>
    set((state) => {
      const { [programId]: _, ...remainingPrograms } = state.programs;
      return {
        programs: remainingPrograms,
        selectedProgramId: state.selectedProgramId === programId ? null : state.selectedProgramId,
      };
    }),

  selectProgram: (programId) =>
    set({ selectedProgramId: programId }),

  updateProgramStatus: (programId, status) =>
    set((state) => ({
      programs: {
        ...state.programs,
        [programId]: {
          ...state.programs[programId],
          status,
          updatedAt: new Date().toISOString(),
        },
      },
    })),

  setProgramFilter: (filter) =>
    set({ programFilter: filter }),

  addWorkout: (programId, date, workout) =>
    set((state) => {
      const program = state.programs[programId];
      if (!program) return state;

      const now = new Date().toISOString();
      const workoutId = `workout-${Date.now()}`;
      const existingDay = program.days[date] || {
        id: date,
        date,
        sessions: [],
      };

      return {
        programs: {
          ...state.programs,
          [programId]: {
            ...program,
            days: {
              ...program.days,
              [date]: {
                ...existingDay,
                workouts: [
                  ...existingDay.workouts,
                  {
                    ...workout,
                    id: workoutId,
                    createdAt: now,
                    updatedAt: now,
                  },
                ],
              },
            },
            updatedAt: now,
          },
        },
      };
    }),

  updateWorkout: (programId, date, workoutId, updates) =>
    set((state) => {
      const program = state.programs[programId];
      if (!program) return state;

      const existingDay = program.days[date];
      if (!existingDay) return state;

      return {
        programs: {
          ...state.programs,
          [programId]: {
            ...program,
            days: {
              ...program.days,
              [date]: {
                ...existingDay,
                workouts: existingDay.workouts.map((workout) =>
                  workout.id === workoutId
                    ? { ...workout, ...updates, updatedAt: new Date().toISOString() }
                    : workout
                ),
              },
            },
            updatedAt: new Date().toISOString(),
          },
        },
      };
    }),

  deleteWorkout: (programId, date, workoutId) =>
    set((state) => {
      const program = state.programs[programId];
      if (!program) return state;

      const existingDay = program.days[date];
      if (!existingDay) return state;

      return {
        programs: {
          ...state.programs,
          [programId]: {
            ...program,
            days: {
              ...program.days,
              [date]: {
                ...existingDay,
                workouts: existingDay.workouts.filter(
                  (workout) => workout.id !== workoutId
                ),
              },
            },
            updatedAt: new Date().toISOString(),
          },
        },
      };
    }),

  duplicateWorkout: (programId, fromDate, toDate, workoutId) =>
    set((state) => {
      const program = state.programs[programId];
      if (!program) return state;

      const sourceDay = program.days[fromDate];
      if (!sourceDay) return state;

      const workout = sourceDay.workouts.find((w) => w.id === workoutId);
      if (!workout) return state;

      const now = new Date().toISOString();
      const newWorkoutId = `workout-${Date.now()}`;
      const targetDay = program.days[toDate] || {
        id: toDate,
        date: toDate,
        sessions: [],
      };

      return {
        programs: {
          ...state.programs,
          [programId]: {
            ...program,
            days: {
              ...program.days,
              [toDate]: {
                ...targetDay,
                workouts: [
                  ...targetDay.workouts,
                  {
                    ...workout,
                    id: newWorkoutId,
                    createdAt: now,
                    updatedAt: now,
                  },
                ],
              },
            },
            updatedAt: now,
          },
        },
      };
    }),

  duplicateDay: (programId, fromDate, toDate) =>
    set((state) => {
      const program = state.programs[programId];
      if (!program) return state;

      const sourceDay = program.days[fromDate];
      if (!sourceDay) return state;

      const now = new Date().toISOString();

      return {
        programs: {
          ...state.programs,
          [programId]: {
            ...program,
            days: {
              ...program.days,
              [toDate]: {
                id: toDate,
                date: toDate,
                sessions: sourceDay.sessions.map((session) => ({
                  ...session,
                  id: `session-${Date.now()}-${session.id}`,
                  createdAt: now,
                  updatedAt: now,
                })),
              },
            },
            updatedAt: now,
          },
        },
      };
    }),

  duplicateWeek: (programId, fromDate) =>
    set((state) => {
      const program = state.programs[programId];
      if (!program) return state;

      const now = new Date().toISOString();
      const startDate = new Date(fromDate);
      const newDays: Record<string, DayProgram> = {};

      // Copy 7 days starting from the fromDate
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + i);
        const sourceDate = currentDate.toISOString().split('T')[0];
        
        const targetDate = new Date(currentDate);
        targetDate.setDate(targetDate.getDate() + 7);
        const destDate = targetDate.toISOString().split('T')[0];

        const sourceDay = program.days[sourceDate];
        if (sourceDay) {
          newDays[destDate] = {
            id: destDate,
            date: destDate,
            sessions: sourceDay.sessions.map((session) => ({
              ...session,
              id: `session-${Date.now()}-${session.id}`,
              createdAt: now,
              updatedAt: now,
            })),
          };
        }
      }

      return {
        programs: {
          ...state.programs,
          [programId]: {
            ...program,
            days: {
              ...program.days,
              ...newDays,
            },
            updatedAt: now,
          },
        },
      };
    }),

  addSession: (programId, date, session) => 
    set((state) => {
      const program = state.programs[programId];
      if (!program) return state;

      const now = new Date().toISOString();
      const sessionId = `session-${Date.now()}`;
      const existingDay = program.days[date] || {
        id: date,
        date,
        sessions: [],
      };

      return {
        programs: {
          ...state.programs,
          [programId]: {
            ...program,
            days: {
              ...program.days,
              [date]: {
                ...existingDay,
                sessions: [
                  ...existingDay.sessions,
                  {
                    ...session,
                    id: sessionId,
                    createdAt: now,
                    updatedAt: now,
                  },
                ],
              },
            },
            updatedAt: now,
          },
        },
      };
    }),

  updateSession: (programId, date, sessionId, updates) =>
    set((state) => {
      const program = state.programs[programId];
      if (!program) return state;

      const existingDay = program.days[date];
      if (!existingDay) return state;

      return {
        programs: {
          ...state.programs,
          [programId]: {
            ...program,
            days: {
              ...program.days,
              [date]: {
                ...existingDay,
                sessions: existingDay.sessions.map((session) =>
                  session.id === sessionId
                    ? { ...session, ...updates, updatedAt: new Date().toISOString() }
                    : session
                ),
              },
            },
            updatedAt: new Date().toISOString(),
          },
        },
      };
    }),

  deleteSession: (programId, date, sessionId) =>
    set((state) => {
      const program = state.programs[programId];
      if (!program) return state;

      const existingDay = program.days[date];
      if (!existingDay) return state;

      return {
        programs: {
          ...state.programs,
          [programId]: {
            ...program,
            days: {
              ...program.days,
              [date]: {
                ...existingDay,
                sessions: existingDay.sessions.filter(
                  (session) => session.id !== sessionId
                ),
              },
            },
            updatedAt: new Date().toISOString(),
          },
        },
      };
    }),

  assignProgram: (programId, data) =>
    set((state) => {
      const program = state.programs[programId];
      if (!program) return state;

      return {
        programs: {
          ...state.programs,
          [programId]: {
            ...program,
            assignedTo: {
              athletes: data.athletes,
              teams: data.teams,
            },
            assignments: [
              ...(program.assignments || []),
              {
                date: new Date().toISOString(),
                athletes: data.athletes,
                teams: data.teams,
                message: data.message,
                replacedExisting: data.replaceExisting,
              },
            ],
            updatedAt: new Date().toISOString(),
          },
        },
      };
    }),
}));

export function initializeWithSampleData() {
  const store = useWorkoutStore.getState();
  
  samplePrograms.forEach((program) => {
    store.programs[program.id] = {
      ...program,
      status: 'published',
      weekCount: 6,
    };
  });
}