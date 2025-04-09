-- Fix the policy to allow athletes to update inactive connections to pending

-- Modify the athlete update policy to allow changing from inactive to pending
DROP POLICY IF EXISTS "athletes_update_coach_status" ON coach_athletes;
CREATE POLICY "athletes_update_coach_status"
ON coach_athletes
FOR UPDATE
USING (
  athlete_id = auth.uid()
)
WITH CHECK (
  athlete_id = auth.uid() AND 
  (status = 'inactive' OR status = 'pending')
); 