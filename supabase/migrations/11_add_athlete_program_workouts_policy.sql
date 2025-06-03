-- 11_add_athlete_program_workouts_policy.sql
-- This migration adds a policy allowing athletes to view workouts that are part of programs assigned to them

-- Create policy for athletes to view workouts from their assigned programs
CREATE POLICY "athletes_view_program_workouts" ON "public"."workouts"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 
            FROM "public"."program_assignments" pa
            JOIN "public"."program_workouts" pw ON pa.program_id = pw.program_id
            WHERE pw.workout_id = workout_id
            AND pa.athlete_id = auth.uid()
        )
    );

-- Add comment describing the policy
COMMENT ON POLICY "athletes_view_program_workouts" ON "public"."workouts" 
    IS 'Allows athletes to view workouts that are part of programs assigned to them'; 