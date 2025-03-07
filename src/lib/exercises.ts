// Common CrossFit exercises organized by category
export const exerciseLibrary = {
  gymnastics: [
    { name: 'Pull-up', category: 'gymnastics', scaling: ['Ring Rows', 'Banded Pull-ups', 'Jumping Pull-ups'] },
    { name: 'Push-up', category: 'gymnastics', scaling: ['Box Push-ups', 'Knee Push-ups'] },
    { name: 'Handstand Push-up', category: 'gymnastics', scaling: ['Pike Push-ups', 'Box Pike Push-ups'] },
    { name: 'Muscle-up', category: 'gymnastics', scaling: ['Pull-up + Dip', 'Banded Transitions'] },
    { name: 'Toes-to-Bar', category: 'gymnastics', scaling: ['Knee Raises', 'Hanging Leg Raises'] },
  ],
  weightlifting: [
    { name: 'Clean', category: 'weightlifting', scaling: ['Power Clean', 'Hang Clean'] },
    { name: 'Snatch', category: 'weightlifting', scaling: ['Power Snatch', 'Hang Snatch'] },
    { name: 'Clean & Jerk', category: 'weightlifting', scaling: ['Power Clean & Push Press'] },
    { name: 'Front Squat', category: 'weightlifting', scaling: ['Goblet Squat'] },
    { name: 'Back Squat', category: 'weightlifting', scaling: ['Air Squat', 'Box Squat'] },
  ],
  monostructural: [
    { name: 'Run', category: 'monostructural', scaling: ['Row', 'Bike'] },
    { name: 'Row', category: 'monostructural', scaling: ['Bike', 'Run'] },
    { name: 'Bike', category: 'monostructural', scaling: ['Row', 'Run'] },
    { name: 'Double-unders', category: 'monostructural', scaling: ['Single-unders'] },
    { name: 'Jump Rope', category: 'monostructural', scaling: ['Step-overs'] },
  ],
  powerlifting: [
    { name: 'Deadlift', category: 'powerlifting', scaling: ['Romanian Deadlift', 'Sumo Deadlift'] },
    { name: 'Bench Press', category: 'powerlifting', scaling: ['Dumbbell Press', 'Floor Press'] },
    { name: 'Overhead Press', category: 'powerlifting', scaling: ['Push Press', 'Dumbbell Press'] },
  ],
};

export const workoutPresets = {
  emom: {
    name: 'EMOM',
    description: 'Every Minute On the Minute',
    defaultDuration: 10,
    structure: {
      interval: 60, // seconds
      rounds: 10,
    },
  },
  amrap: {
    name: 'AMRAP',
    description: 'As Many Rounds/Reps As Possible',
    defaultDuration: 20,
    structure: {
      timeLimit: 20, // minutes
    },
  },
  forTime: {
    name: 'For Time',
    description: 'Complete the work as quickly as possible',
    defaultTimeLimit: 20,
    structure: {
      timeLimit: 20, // minutes (cap)
    },
  },
  tabata: {
    name: 'Tabata',
    description: '20 seconds work, 10 seconds rest',
    defaultRounds: 8,
    structure: {
      workInterval: 20, // seconds
      restInterval: 10, // seconds
      rounds: 8,
    },
  },
};

export type ExerciseCategory = keyof typeof exerciseLibrary;
export type WorkoutPreset = keyof typeof workoutPresets;