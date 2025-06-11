-- Add policy for workouts table to allow coaches to create and manage workouts
CREATE POLICY "Coaches can manage workouts for their programs" ON "public"."workouts" 
USING (
  EXISTS (
    SELECT 1
    FROM "public"."sessions" s
    JOIN "public"."programs" p ON p.id = s.program_id
    WHERE s.session_id = workouts.session_id 
    AND p.coach_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM "public"."sessions" s
    JOIN "public"."programs" p ON p.id = s.program_id
    WHERE s.session_id = workouts.session_id 
    AND p.coach_id = auth.uid()
  )
);

-- Make sure RLS is enabled on workouts table
ALTER TABLE "public"."workouts" ENABLE ROW LEVEL SECURITY; 