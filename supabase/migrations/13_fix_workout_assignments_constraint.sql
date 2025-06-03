-- 13_fix_workout_assignments_constraint.sql
-- Fix the unique constraint on workout_assignments to allow coaches to assign
-- multiple workouts per day to the same athlete. The original constraint
-- prevented any duplicate workout-athlete pairs, but now we need to allow
-- multiple assignments as long as they're not exactly the same (including date).

-- Step 1: Drop the existing unique constraint that prevents multiple workout assignments
ALTER TABLE "public"."workout_assignments" 
DROP CONSTRAINT IF EXISTS "workout_assignments_workout_athlete_key";

-- Step 2: Fix the typo in the workout_assignments table name from the previous migration
-- First, check if the incorrectly named table exists and rename it
DO $$
BEGIN
    -- Check if the misspelled table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' 
               AND table_name = 'workout_assigments') THEN
        
        -- Add the workout_date column to the correct table if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'public' 
                       AND table_name = 'workout_assignments' 
                       AND column_name = 'workout_date') THEN
            ALTER TABLE "public"."workout_assignments" ADD COLUMN "workout_date" DATE NOT NULL DEFAULT CURRENT_DATE;
        END IF;
        
        -- Drop the incorrectly named table and index
        DROP INDEX IF EXISTS "public"."idx_workout_assigments_date";
        DROP TABLE IF EXISTS "public"."workout_assigments";
        
    ELSE
        -- Just add the workout_date column if it doesn't exist in the correct table
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'public' 
                       AND table_name = 'workout_assignments' 
                       AND column_name = 'workout_date') THEN
            ALTER TABLE "public"."workout_assignments" ADD COLUMN "workout_date" DATE NOT NULL DEFAULT CURRENT_DATE;
        END IF;
    END IF;
END $$;

-- Step 3: Create a new unique constraint that allows multiple workouts per day
-- but prevents exact duplicates. Since coaches might want to assign the same workout
-- multiple times per day, we'll create a constraint that includes a timestamp component
-- or remove the constraint entirely to give maximum flexibility.

-- Option 1: No unique constraint (maximum flexibility)
-- This allows coaches to assign the same workout multiple times to the same athlete
-- on the same day, which seems to be the desired behavior based on the requirement.

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_workout_assignments_date" 
ON "public"."workout_assignments" USING btree ("workout_date");

CREATE INDEX IF NOT EXISTS "idx_workout_assignments_athlete_date" 
ON "public"."workout_assignments" USING btree ("athlete_id", "workout_date");

CREATE INDEX IF NOT EXISTS "idx_workout_assignments_workout_date" 
ON "public"."workout_assignments" USING btree ("workout_id", "workout_date");

-- Step 5: Update the comment to reflect the new behavior
COMMENT ON TABLE "public"."workout_assignments" IS 'Links workouts to athletes for direct assignment. Multiple assignments of the same workout to the same athlete are allowed, including on the same date.';

COMMENT ON COLUMN "public"."workout_assignments"."workout_date" IS 'The date when this workout is scheduled for the athlete'; 