-- Fix the policy to allow athletes to update their coach connections and rejoin inactive coaches

-- Drop the existing policy
DROP POLICY IF EXISTS "athletes_update_coach_status" ON coach_athletes;

-- Create a new policy that allows athletes to update their connections to inactive
CREATE POLICY "athletes_update_coach_status"
ON coach_athletes
FOR UPDATE
USING (athlete_id = auth.uid())
WITH CHECK (
  athlete_id = auth.uid() AND
  status = 'inactive'
);

-- Add a policy to allow athletes to see all their connections (including inactive)
DROP POLICY IF EXISTS "athletes_view_all_coaches" ON coach_athletes;
CREATE POLICY "athletes_view_all_coaches"
ON coach_athletes
FOR SELECT
USING (athlete_id = auth.uid());

-- Update the athletes_can_request_coaches policy to allow rejoining inactive coaches
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
    -- Removed inactive from this check to allow rejoining
  )
); 