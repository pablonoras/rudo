
-- Add policy for workouts table to allow athletes to view workouts from their assigned programs
CREATE POLICY "Athletes can view workouts for assigned programs" ON "public"."workouts" FOR SELECT TO "authenticated" USING ((EXISTS ( 
  SELECT 1
  FROM "public"."sessions" s
  JOIN "public"."program_assignments" pa ON pa.program_id = s.program_id
  WHERE s.session_id = workouts.session_id 
  AND pa.athlete_id = auth.uid()
)));

-- Enable RLS on workouts table
ALTER TABLE "public"."workouts" ENABLE ROW LEVEL SECURITY;