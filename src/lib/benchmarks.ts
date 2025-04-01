import type { WorkoutFormat } from './workout';

export const BENCHMARK_WORKOUTS = {
  fran: {
    name: 'Fran',
    type: 'forTime' as WorkoutFormat,
    description: 'Thrusters (95/65 lb)\nPull-ups\n\n21-15-9 reps',
    scaling: 'Reduce weight, use ring rows or banded pull-ups',
  },
  murph: {
    name: 'Murph',
    type: 'forTime' as WorkoutFormat,
    description: '1 mile Run\n100 Pull-ups\n200 Push-ups\n300 Air Squats\n1 mile Run\n\nWear a Weight Vest (20/14 lb)',
    scaling: 'Partition the reps, scale pull-ups to ring rows, push-ups to knees',
  },
  grace: {
    name: 'Grace',
    type: 'forTime' as WorkoutFormat,
    description: '30 Clean & Jerks (135/95 lb)',
    scaling: 'Reduce weight, power clean and push press',
  },
  // Add more benchmark workouts as needed
} as const;