-- Enable RLS on coach_athletes table
ALTER TABLE coach_athletes ENABLE ROW LEVEL SECURITY;

-- Create policy for coaches to see their athletes
CREATE POLICY "coaches_view_athletes"
ON coach_athletes
FOR SELECT
USING (coach_id = auth.uid());

-- Create policy for coaches to manage their athletes
CREATE POLICY "coaches_manage_athletes"
ON coach_athletes
FOR ALL
USING (coach_id = auth.uid());

-- Create policy for athletes to see coaches they're assigned to
CREATE POLICY "athletes_view_coaches"
ON coach_athletes
FOR SELECT
USING (athlete_id = auth.uid());

-- Add policy to allow coaches to view their athletes' profiles
CREATE POLICY "coaches_view_athlete_profiles"
ON profiles
FOR SELECT
USING (
  id IN (
    SELECT athlete_id FROM coach_athletes
    WHERE coach_id = auth.uid()
  )
); 