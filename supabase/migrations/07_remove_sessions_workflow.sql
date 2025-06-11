-- 07_remove_sessions_workflow.sql
-- This migration removes the sessions table and workflow, restructuring to allow
-- workouts to be directly created by coaches and assigned to programs or directly to athletes.

-- Step 1: Create new tables for workout_assignments and program_workouts
CREATE TABLE IF NOT EXISTS "public"."workout_assignments" (
    "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    "workout_id" uuid NOT NULL,
    "athlete_id" uuid NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("workout_id") ON DELETE CASCADE,
    FOREIGN KEY ("athlete_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    CONSTRAINT "workout_assignments_workout_athlete_key" UNIQUE ("workout_id", "athlete_id")
);

CREATE TABLE IF NOT EXISTS "public"."program_workouts" (
    "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    "program_id" uuid NOT NULL,
    "workout_id" uuid NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE CASCADE,
    FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("workout_id") ON DELETE CASCADE,
    CONSTRAINT "program_workouts_program_workout_key" UNIQUE ("program_id", "workout_id")
);

-- Step 2: Add the coach_id column to workouts table
ALTER TABLE "public"."workouts" ADD COLUMN "coach_id" uuid REFERENCES "public"."profiles"("id") ON DELETE CASCADE;

-- Step 3: Update existing workouts to set coach_id from sessions and programs
-- This will set the coach_id for each workout based on the coach who created the program
UPDATE "public"."workouts" w
SET coach_id = p.coach_id
FROM "public"."sessions" s
JOIN "public"."programs" p ON s.program_id = p.id
WHERE w.session_id = s.session_id;

-- Step 4: Make coach_id not null after populating it
ALTER TABLE "public"."workouts" ALTER COLUMN "coach_id" SET NOT NULL;

-- Step 5: Create trigger to update updated_at timestamp for the new tables
CREATE TRIGGER update_workout_assignments_updated_at BEFORE UPDATE ON "public"."workout_assignments"
FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

CREATE TRIGGER update_program_workouts_updated_at BEFORE UPDATE ON "public"."program_workouts" 
FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

-- Step 6: Remove session_id constraint from workouts before removing the sessions table
ALTER TABLE "public"."workouts" DROP CONSTRAINT IF EXISTS "workouts_session_id_fkey";

-- Step 7: Drop the sessions table
DROP TABLE IF EXISTS "public"."sessions" CASCADE;

-- Step 8: Drop the session_id column from workouts
ALTER TABLE "public"."workouts" DROP COLUMN "session_id";

-- Step 9: Add indexes for better performance
CREATE INDEX "idx_workouts_coach_id" ON "public"."workouts" USING btree ("coach_id");
CREATE INDEX "idx_workout_assignments_athlete_id" ON "public"."workout_assignments" USING btree ("athlete_id");
CREATE INDEX "idx_program_workouts_program_id" ON "public"."program_workouts" USING btree ("program_id");

-- Step 10: Add RLS policies
-- Coaches can manage their own workouts
CREATE POLICY "coaches_manage_own_workouts" ON "public"."workouts"
    USING (coach_id = auth.uid());

-- Athletes can view workouts assigned to them
CREATE POLICY "athletes_view_assigned_workouts" ON "public"."workouts"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "public"."workout_assignments" wa
            WHERE wa.workout_id = workout_id AND wa.athlete_id = auth.uid()
        )
    );

-- Coaches can manage workout assignments for their workouts
CREATE POLICY "coaches_manage_workout_assignments" ON "public"."workout_assignments"
    USING (
        EXISTS (
            SELECT 1 FROM "public"."workouts" w
            WHERE w.workout_id = workout_id AND w.coach_id = auth.uid()
        )
    );

-- Coaches can manage program_workouts for their programs
CREATE POLICY "coaches_manage_program_workouts" ON "public"."program_workouts"
    USING (
        EXISTS (
            SELECT 1 FROM "public"."programs" p
            WHERE p.id = program_id AND p.coach_id = auth.uid()
        )
    );

-- Athletes can view their workout assignments
CREATE POLICY "athletes_view_workout_assignments" ON "public"."workout_assignments"
    FOR SELECT USING (athlete_id = auth.uid());

COMMENT ON TABLE "public"."workout_assignments" IS 'Links workouts to athletes for direct assignment';
COMMENT ON TABLE "public"."program_workouts" IS 'Links workouts to programs';
COMMENT ON COLUMN "public"."workouts"."coach_id" IS 'The coach who created this workout'; 