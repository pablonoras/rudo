export type Language = 'es' | 'en';

export type Section = {
  id: string;
  name: string;
  content: string;
  order: number;
  type?: 'warmup' | 'strength' | 'skill' | 'metcon' | 'cooldown';
  intensity?: 'light' | 'moderate' | 'heavy';
  notes?: string;
};

export type Workout = {
  id: string;
  date: string;
  athleteId: string;
  sections: Section[];
  completed: boolean;
  results?: string;
  comments?: string;
};

export type Athlete = {
  id: string;
  name: string;
  avatar: string;
  level: string;
  lastActive: string;
  group: string;
  joinDate: string;
  completedWorkouts: number;
  attendance: number;
  personalBests: Record<string, string>;
  preferences?: {
    favoriteMovements: string[];
    limitedMovements: string[];
    goals: string[];
  };
  recentWorkouts?: {
    date: string;
    type: string;
    performance: 'good' | 'average' | 'poor';
  }[];
};

export interface Translations {
  addWorkout: string;
  sections: string;
  addSection: string;
  sectionName: string;
  content: string;
  save: string;
  athlete: string;
  selectAthlete: string;
  calendar: string;
  today: string;
  results: string;
  comments: string;
  submit: string;
  completed: string;
  searchAthletes: string;
  allAthletes: string;
  selectAthletePrompt: string;
  selectDayPrompt: string;
  joinDate: string;
  completedWorkouts: string;
  attendance: string;
  personalBests: string;
  hideAthletes: string;
  showAthletes: string;
  dashboard: string;
  totalAthletes: string;
  activeToday: string;
  averageAttendance: string;
  groupDistribution: string;
  recentActivity: string;
  completedWorkout: string;
  level: string;
  warmup: string;
  strength: string;
  skill: string;
  metcon: string;
  cooldown: string;
  useTemplate: string;
  templates: string;
  addCustomSection: string;
  copy: string;
  intensity: string;
  light: string;
  moderate: string;
  heavy: string;
  notes: string;
  recentPerformance: string;
  suggestedTemplates: string;
  quickAdd: string;
  athleteNotes: string;
  adaptToAthlete: string;
  saveAsTemplate: string;
  preview: string;
  backToCalendar: string;
  week: string;
  month: string;
}