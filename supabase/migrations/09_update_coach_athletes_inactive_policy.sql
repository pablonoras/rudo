-- Update policies to handle inactive coach status correctly

-- Update the athletes_can_request_coaches policy
DROP POLICY IF EXISTS "athletes_can_request_coaches" ON coach_athletes;
CREATE POLICY "athletes_can_request_coaches"
ON coach_athletes
FOR INSERT
WITH CHECK (
  athlete_id = auth.uid() AND
  status = 'pending' AND
  NOT EXISTS (
    SELECT 1 FROM coach_athletes
    WHERE athlete_id = auth.uid() 
    AND coach_id = coach_athletes.coach_id
    AND status IN ('pending', 'active')
  )
);

-- Add policy to allow athletes to update their own coach connections
DROP POLICY IF EXISTS "athletes_update_coach_status" ON coach_athletes;
CREATE POLICY "athletes_update_coach_status"
ON coach_athletes
FOR UPDATE
USING (athlete_id = auth.uid())
WITH CHECK (
  athlete_id = auth.uid() AND
  status = 'inactive'
);

-- Update policy to show active and pending connections for athletes
DROP POLICY IF EXISTS "athletes_view_coaches" ON coach_athletes;
CREATE POLICY "athletes_view_coaches"
ON coach_athletes
FOR SELECT
USING (
  athlete_id = auth.uid() AND
  status IN ('active', 'pending')
); 