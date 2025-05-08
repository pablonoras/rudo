-- Update the policy to view all coaches, including those with inactive relationships

-- Ensure visibility of all coaches in the coach search
DROP POLICY IF EXISTS "authenticated_can_view_coaches" ON profiles;
CREATE POLICY "authenticated_can_view_coaches"
ON profiles
FOR SELECT
USING (
  role = 'coach'
);

-- Update or create a policy to ensure the coach list includes coaches with inactive connections
DROP POLICY IF EXISTS "coach_search_includes_inactive" ON coach_athletes;
CREATE POLICY "coach_search_includes_inactive"
ON coach_athletes
FOR SELECT
USING (
  auth.uid() IS NOT NULL
); 