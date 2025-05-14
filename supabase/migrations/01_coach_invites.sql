-- Migration to add coach invite functionality

-- Add the invite_code column to the profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;

-- Set default invite codes for coaches only
UPDATE public.profiles 
SET invite_code = LOWER(SUBSTRING(MD5(gen_random_uuid()::text) FROM 1 FOR 10))
WHERE role = 'coach' AND invite_code IS NULL;

-- Create a function to resolve an invite code and add a pending coach-athlete relationship
CREATE OR REPLACE FUNCTION public.resolve_invite(
  code text,
  athlete_user_id uuid 
)
RETURNS jsonb AS $$
DECLARE
  coach_id_var uuid;
  coach_name_var text;
  result jsonb;
BEGIN
  -- Find the coach with this invite code
  SELECT id, full_name INTO coach_id_var, coach_name_var
  FROM profiles 
  WHERE invite_code = code AND role = 'coach';
  
  -- If no coach found with this code
  IF coach_id_var IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid invitation code');
  END IF;
  
  -- Check if a relationship already exists
  IF EXISTS (
    SELECT 1 FROM coach_athletes 
    WHERE coach_id = coach_id_var AND athlete_id = athlete_user_id
  ) THEN
    -- Update existing relationship to pending if inactive
    UPDATE coach_athletes
    SET status = 'pending'
    WHERE coach_id = coach_id_var AND athlete_id = athlete_user_id AND status = 'inactive';
  ELSE
    -- Create a new pending relationship
    INSERT INTO coach_athletes (coach_id, athlete_id, status)
    VALUES (coach_id_var, athlete_user_id, 'pending');
  END IF;
  
  -- Return success with coach name for display
  RETURN jsonb_build_object(
    'success', true, 
    'coach_name', coach_name_var,
    'coach_id', coach_id_var
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RPC access to the resolve_invite function
GRANT EXECUTE ON FUNCTION public.resolve_invite(text, uuid) TO authenticated; 