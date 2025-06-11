-- Function to get coach information by invite code
CREATE OR REPLACE FUNCTION public.get_coach_by_invite_code(code TEXT)
RETURNS TABLE (
  coach_id UUID,
  coach_name TEXT,
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_coach_id UUID;
  found_coach_name TEXT;
BEGIN
  -- Find the coach with the given invite code
  SELECT id, full_name INTO found_coach_id, found_coach_name
  FROM profiles
  WHERE invite_code = code AND role = 'coach';
  
  -- Check if we found a coach
  IF found_coach_id IS NOT NULL THEN
    RETURN QUERY SELECT 
      found_coach_id, 
      found_coach_name, 
      TRUE, 
      'Coach found successfully'::TEXT;
  ELSE
    RETURN QUERY SELECT 
      NULL::UUID, 
      NULL::TEXT, 
      FALSE, 
      'No coach found with this invite code'::TEXT;
  END IF;
END;
$$; 