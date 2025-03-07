import { create } from 'zustand';
import { samplePrograms } from './sampleData';

export type WorkoutType = 'warmup' | 'strength' | 'wod' | 'cooldown';
export type WorkoutFormat = 'forTime' | 'amrap' | 'emom' | 'tabata' | 'rounds' | 'complex' | 'benchmark';
export type WorkoutStimulus = 'endurance' | 'strength' | 'power' | 'skill' | 'recovery';

export const BENCHMARK_WORKOUTS = {
  fran: {
    name: 'Fran',
    type: 'forTime',
    description: 'Thrusters (95/65 lb)\nPull-ups\n\n21-15-9 reps',
    scaling: 'Reduce weight, use ring rows or banded pull-ups',
    stimulus: 'power',
    goal: 'Fast glycolytic power output, sub-5 minutes for elite athletes',
  },
  murph: {
    name: 'Murph',
    type: 'forTime',
    description: '1 mile Run\n100 Pull-ups\n200 Push-ups\n300 Air Squats\n1 mile Run\n\nWear a Weight Vest (20/14 lb)',
    scaling: 'Partition the reps, scale pull-ups to ring rows, push-ups to knees',
    stimulus: 'endurance',
    goal: 'Long endurance chipper, test of overall work capacity',
  },
  grace: {
    name: 'Grace',
    type: 'forTime',
    description: '30 Clean & Jerks (135/95 lb)',
    scaling: 'Reduce weight, power clean and push press',
    stimulus: 'power',
    goal: 'Fast cycle Olympic lifting, sub-3 minutes for elite athletes',
  },
} as const;

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
  notes?: string;
  stimulus?: WorkoutStimulus;
  goal?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DayProgram {
  id: string;
  date: string;
  workouts: WorkoutBlock[];
}

export interface Program {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  days: Record<string, DayProgram>;
  assignedTo: {
    athletes: string[];
    teams: string[];
  };
  createdAt: string;
  updatedAt: string;
}

interface WorkoutStore {
  programs: Record<string, Program>;
  selectedProgramId: string | null;
  
  createProgram: (program: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateProgram: (programId: string, updates: Partial<Program>) => void;
  deleteProgram: (programId: string) => void;
  selectProgram: (programId: string | null) => void;
  
  addWorkout: (programId: string, date: string, workout: Omit<WorkoutBlock, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateWorkout: (programId: string, date: string, workoutId: string, updates: Partial<WorkoutBlock>) => void;
  deleteWorkout: (programId: string, date: string, workoutId: string) => void;
  duplicateWorkout: (programId: string, fromDate: string, toDate: string, workoutId: string) => void;
  duplicateWeek: (programId: string, fromDate: string) => void;
  copyWorkoutToPattern: (
    programId: string,
    fromDate: string,
    workoutId: string,
    pattern: {
      weekCount: number;
      days: ('M' | 'T' | 'W' | 'Th' | 'F' | 'Sa' | 'Su')[];
    }
  ) => void;
  
  assignProgram: (programId: string, athletes: string[], teams: string[]) => void;
}

export const useWorkoutStore = create<WorkoutStore>((set) => ({
  programs: {},
  selectedProgramId: null,

  createProgram: (program) => {
    const id = `program-${Date.now()}`;
    const now = new Date().toISOString();
    
    set((state) => ({
      programs: {
        ...state.programs,
        [id]: {
          ...program,
          id,
          days: {},
          assignedTo: { athletes: [], teams: [] },
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

  addWorkout: (programId, date, workout) =>
    set((state) => {
      const program = state.programs[programId];
      if (!program) return state;

      const now = new Date().toISOString();
      const workoutId = `workout-${Date.now()}`;
      const existingDay = program.days[date] || {
        id: date,
        date,
        workouts: [],
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
        workouts: [],
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
            workouts: sourceDay.workouts.map((workout) => ({
              ...workout,
              id: `workout-${Date.now()}-${workout.id}`,
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

  copyWorkoutToPattern: (programId, fromDate, workoutId, pattern) =>
    set((state) => {
      const program = state.programs[programId];
      if (!program) return state;

      const sourceDay = program.days[fromDate];
      if (!sourceDay) return state;

      const workout = sourceDay.workouts.find((w) => w.id === workoutId);
      if (!workout) return state;

      const now = new Date().toISOString();
      const startDate = new Date(fromDate);
      const newDays: Record<string, DayProgram> = {};

      // Map day names to numbers (0 = Sunday)
      const dayMap = {
        'Su': 0,
        'M': 1,
        'T': 2,
        'W': 3,
        'Th': 4,
        'F': 5,
        'Sa': 6,
      };

      // For each week in the pattern
      for (let week = 0; week < pattern.weekCount; week++) {
        // For each selected day in the pattern
        pattern.days.forEach((day) => {
          const targetDate = new Date(startDate);
          targetDate.setDate(targetDate.getDate() + (week * 7));
          
          // Adjust to the correct day of the week
          const currentDay = targetDate.getDay();
          const targetDay = dayMap[day];
          const diff = targetDay - currentDay;
          targetDate.setDate(targetDate.getDate() + diff);

          const dateStr = targetDate.toISOString().split('T')[0];
          const existingDay = program.days[dateStr] || {
            id: dateStr,
            date: dateStr,
            workouts: [],
          };

          newDays[dateStr] = {
            ...existingDay,
            workouts: [
              ...existingDay.workouts,
              {
                ...workout,
                id: `workout-${Date.now()}-${week}-${day}`,
                createdAt: now,
                updatedAt: now,
              },
            ],
          };
        });
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

  assignProgram: (programId, athletes, teams) =>
    set((state) => {
      const program = state.programs[programId];
      if (!program) return state;

      return {
        programs: {
          ...state.programs,
          [programId]: {
            ...program,
            assignedTo: {
              athletes,
              teams,
            },
            updatedAt: new Date().toISOString(),
          },
        },
      };
    }),
}));

// Add initialization with sample data
export const initializeWithSampleData = () => {
  const store = useWorkoutStore.getState();
  
  samplePrograms.forEach(program => {
    store.programs[program.id] = program;
  });
  
  // Select the competition program by default
  store.selectedProgramId = 'program-competition';
};