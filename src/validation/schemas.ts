// src/validation/schemas.ts
import { z } from 'zod';

export const workoutSchema = z.object({
  name: z.string().min(2),
  equipment: z.enum(['kettlebell', 'cable', 'bodyweight', 'barbell', 'dumbbell', 'machine', 'other']),
  sets: z.union([z.number().int().positive(), z.string().min(1)]),
  recommendedReps: z.string().min(1),
  recommendedRest: z.string().min(1),
  primaryMuscles: z.array(z.string()).min(1),
  secondaryMuscles: z.array(z.string()),
  description: z.string().optional()
});

export const dayEntrySchema = z.object({
  name: z.string().min(2),
  sets: z.union([z.number().int().positive(), z.string().min(1)]),
  reps: z.string().min(1),
  rest: z.string().min(1),
  equipment: z.optional(z.enum(['kettlebell', 'cable', 'bodyweight', 'barbell', 'dumbbell', 'machine', 'other'])),
  primaryMuscles: z.array(z.string()).optional(),
  secondaryMuscles: z.array(z.string()).optional(),
  description: z.string().optional()
});

export type WorkoutInput = z.infer<typeof workoutSchema>;
export type DayEntryInput = z.infer<typeof dayEntrySchema>;
