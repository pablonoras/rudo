import { addDays, format } from 'date-fns';
import type { Program, WorkoutBlock, Session } from './workout';

// Helper to generate dates
const getDateString = (daysFromNow: number) => {
  return format(addDays(new Date(), daysFromNow), 'yyyy-MM-dd');
};

// Sample warmups that can be reused
const commonWarmups: Omit<WorkoutBlock, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'General Warmup',
    type: 'warmup',
    description: '3 Rounds:\n- 1 min Row\n- 10 PVC Pass-throughs\n- 10 Air Squats\n- 10 Push-ups\n- World\'s Greatest Stretch (30s/side)',
    notes: 'Focus on mobility and gradually increasing heart rate',
  },
  {
    name: 'Barbell Complex Warmup',
    type: 'warmup',
    description: '3 rounds with empty barbell:\n- 5 Good Mornings\n- 5 Back Squats\n- 5 Behind Neck Press\n- 5 Front Squats',
    notes: 'Use this for days with heavy barbell work',
  },
];

// Sample cooldowns that can be reused
const commonCooldowns: Omit<WorkoutBlock, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Basic Cooldown',
    type: 'cooldown',
    description: '5-10 minutes:\n- Light row/bike\n- Basic stretching for areas worked',
    notes: 'Keep movement light and focus on breathing',
  },
];

// Sample strength progressions
const strengthBlocks: Omit<WorkoutBlock, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Back Squat - Heavy Singles',
    type: 'strength',
    description: 'Back Squat:\n5 sets of 1 rep @ 85-90% 1RM\nRest 2-3 min between sets',
    scaling: 'Scale weight to maintain perfect form. Newer athletes work on 3-5 reps at lower percentages.',
    stimulus: 'strength',
    goal: 'Build absolute strength and confidence under heavy loads',
  },
  {
    name: 'Clean & Jerk Technique',
    type: 'strength',
    description: 'Every 2 minutes for 16 minutes:\n1 Clean + 2 Jerks\nBuild to a heavy but smooth complex',
    scaling: 'Focus on form over weight. Use power clean variation if needed.',
    stimulus: 'skill',
    goal: 'Develop efficiency in the Olympic lifts',
  },
];

// Sample WODs
const wodBlocks: Omit<WorkoutBlock, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Engine Builder',
    type: 'wod',
    format: 'amrap',
    timeLimit: 20,
    description: 'AMRAP 20:\n- 400m Run\n- 15 Power Cleans (135/95)\n- 15 Bar-facing Burpees',
    scaling: '- Scale run to 200m or row/bike\n- Power clean: 95/65 or technique focused\n- Step-back burpees if needed',
    stimulus: 'endurance',
    goal: 'Steady-state cardio with moderate load. Target 6-8 rounds.',
  },
  {
    name: 'The Chipper',
    type: 'wod',
    format: 'forTime',
    timeLimit: 25,
    description: 'For Time (25 min cap):\n50-40-30-20-10\n- Wall Balls (20/14)\n- Calorie Row\n- Kettlebell Swings (53/35)',
    scaling: '- Wall balls: 14/10 lb or reduce reps\n- Row: maintain consistent pace\n- KB swings: 35/26 or Russian style',
    stimulus: 'endurance',
    goal: 'Large volume chipper. Break sets early to maintain steady pace.',
  },
];

// Create sample sessions with workouts
const createSampleSession = (
  name: string,
  type: 'crossfit' | 'strength' | 'conditioning' | 'skills',
  workouts: WorkoutBlock[]
): Session => {
  const now = new Date().toISOString();
  return {
    id: `session-${Date.now()}-${Math.random()}`,
    name,
    type,
    duration: 60,
    workouts,
    createdAt: now,
    updatedAt: now,
  };
};

// Sample Programs
export const samplePrograms: Program[] = [
  {
    id: 'program-competition',
    name: 'Competition Prep - Spring 2025',
    description: 'Focused strength and conditioning program for the upcoming competition season',
    startDate: getDateString(0), // Starts today
    endDate: getDateString(42), // 6 weeks
    status: 'published',
    weekCount: 6,
    days: {
      [getDateString(0)]: {
        id: getDateString(0),
        date: getDateString(0),
        sessions: [
          createSampleSession('Morning Session', 'crossfit', [
            {
              ...commonWarmups[0],
              id: 'warmup-1',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              ...strengthBlocks[0],
              id: 'strength-1',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              ...wodBlocks[0],
              id: 'wod-1',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]),
        ],
      },
      [getDateString(1)]: {
        id: getDateString(1),
        date: getDateString(1),
        sessions: [
          createSampleSession('Strength Focus', 'strength', [
            {
              ...commonWarmups[1],
              id: 'warmup-2',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              ...strengthBlocks[1],
              id: 'strength-2',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]),
          createSampleSession('Conditioning', 'conditioning', [
            {
              ...wodBlocks[1],
              id: 'wod-2',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]),
        ],
      },
    },
    assignedTo: {
      athletes: ['athlete-1', 'athlete-2'],
      teams: ['team-competition'],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'program-beginners',
    name: 'Fundamentals - March 2025',
    description: 'Progressive program focused on building foundational movement patterns and capacity',
    startDate: getDateString(7), // Starts in a week
    endDate: getDateString(35), // 4 weeks
    status: 'draft',
    weekCount: 4,
    days: {
      [getDateString(7)]: {
        id: getDateString(7),
        date: getDateString(7),
        sessions: [
          createSampleSession('Skills and Technique', 'skills', [
            {
              ...commonWarmups[0],
              id: 'warmup-3',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              ...wodBlocks[2],
              id: 'wod-3',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]),
        ],
      },
    },
    assignedTo: {
      athletes: ['athlete-3', 'athlete-4'],
      teams: ['team-beginners'],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Sample Athletes
export const sampleAthletes = [
  {
    id: 'athlete-1',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    level: 'advanced',
  },
  {
    id: 'athlete-2',
    name: 'Mike Chen',
    email: 'mike@example.com',
    level: 'advanced',
  },
  {
    id: 'athlete-3',
    name: 'Emma Wilson',
    email: 'emma@example.com',
    level: 'beginner',
  },
  {
    id: 'athlete-4',
    name: 'James Rodriguez',
    email: 'james@example.com',
    level: 'beginner',
  },
];

// Sample Teams
export const sampleTeams = [
  {
    id: 'team-competition',
    name: 'Competition Team',
    description: 'Athletes preparing for upcoming competitions',
    memberCount: 8,
  },
  {
    id: 'team-beginners',
    name: 'Fundamentals Group',
    description: 'New athletes learning the basics',
    memberCount: 12,
  },
];