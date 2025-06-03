-- 08_add_date_to_program_workouts.sql
-- This migration adds a date column to the program_workouts table
-- to track when each workout is scheduled in a program

-- Add the date column to program_workouts table
ALTER TABLE "public"."program_workouts" ADD COLUMN "workout_date" DATE NOT NULL;

-- Create an index for better query performance when filtering by date
CREATE INDEX "idx_program_workouts_date" ON "public"."program_workouts" USING btree ("workout_date");

-- Add a comment to explain the purpose of this column
COMMENT ON COLUMN "public"."program_workouts"."workout_date" IS 'The date when this workout is scheduled in the program'; 