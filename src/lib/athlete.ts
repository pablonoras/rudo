import { create } from 'zustand';
import { sampleAthletes } from './sampleData';

export type AthleteLevel = 'beginner' | 'intermediate' | 'advanced';

export interface Athlete {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  level: AthleteLevel;
  team?: string;
  dateOfBirth?: string;
  phone?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  createdAt: string;
  updatedAt: string;
}

interface AthleteStore {
  athletes: Record<string, Athlete>;
  addAthlete: (athlete: Omit<Athlete, 'id' | 'createdAt' | 'updatedAt'>) => void;
  addAthletes: (athletes: Omit<Athlete, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
  updateAthlete: (id: string, updates: Partial<Athlete>) => void;
  deleteAthlete: (id: string) => void;
}

export const useAthleteStore = create<AthleteStore>((set) => ({
  athletes: sampleAthletes.reduce((acc, athlete) => {
    acc[athlete.id] = {
      ...athlete,
      firstName: athlete.name.split(' ')[0],
      lastName: athlete.name.split(' ')[1],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return acc;
  }, {} as Record<string, Athlete>),

  addAthlete: (athlete) => {
    const now = new Date().toISOString();
    const id = `athlete-${Date.now()}`;
    
    set((state) => ({
      athletes: {
        ...state.athletes,
        [id]: {
          ...athlete,
          id,
          createdAt: now,
          updatedAt: now,
        },
      },
    }));
  },

  addAthletes: (newAthletes) => {
    const now = new Date().toISOString();
    
    set((state) => ({
      athletes: {
        ...state.athletes,
        ...newAthletes.reduce((acc, athlete) => {
          const id = `athlete-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          acc[id] = {
            ...athlete,
            id,
            createdAt: now,
            updatedAt: now,
          };
          return acc;
        }, {} as Record<string, Athlete>),
      },
    }));
  },

  updateAthlete: (id, updates) =>
    set((state) => ({
      athletes: {
        ...state.athletes,
        [id]: {
          ...state.athletes[id],
          ...updates,
          updatedAt: new Date().toISOString(),
        },
      },
    })),

  deleteAthlete: (id) =>
    set((state) => {
      const { [id]: _, ...rest } = state.athletes;
      return { athletes: rest };
    }),
}));