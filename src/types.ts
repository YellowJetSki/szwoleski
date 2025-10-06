export type Workout = {
  name: string;
  equipment: 'kettlebell'|'cable'|'bodyweight'|'barbell'|'dumbbell'|'machine'|'other';
  sets: number | string;
  recommendedReps: string;
  recommendedRest: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  description: string;  // added description optionally
};

export type MuscleGroup = {
  group: string;
  workouts: Workout[];
};

export type ApiData = {
  version: string;
  updatedAt: string;
  catalog: { muscleGroups: MuscleGroup[] };
};

export type DayEntry = {
  name: string;
  sets: number | string;   // snapshot for the day
  reps: string;            // e.g., "6-10" actual plan for the day
  rest: string;            // e.g., "2-3 min"
  equipment?: Workout['equipment'];
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  description: string;    // added description optionally
  // runtime tracking
  completedSets?: number;
};

export type WeekPlan = Record<'Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat'|'Sun', DayEntry[]>;
