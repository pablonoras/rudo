-- 16_fix_athlete_deletion.sql
-- This migration fixes the athlete deletion issue by ensuring proper permissions
-- and creating a more reliable deletion mechanism

-- Drop the existing function first
DROP FUNCTION IF EXISTS public.delete_athlete_account(uuid, uuid);

-- Create an improved version with proper permissions to handle auth.users deletion
CREATE OR REPLACE FUNCTION public.delete_athlete_account(
  target_athlete_id uuid,
  requesting_user_id uuid DEFAULT auth.uid()
) 
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  athlete_profile record;
  coach_relationship record;
  deletion_summary json;
  coach_athletes_count integer := 0;
  program_assignments_count integer := 0;
  workout_assignments_count integer := 0;
  athlete_activity_count integer := 0;
BEGIN
  -- Verify the requesting user has permission to delete this athlete
  -- Either the athlete themselves or a coach who has the athlete
  IF requesting_user_id != target_athlete_id THEN
    -- Check if requesting user is a coach with this athlete
    SELECT ca.* INTO coach_relationship
    FROM coach_athletes ca
    WHERE ca.coach_id = requesting_user_id 
      AND ca.athlete_id = target_athlete_id;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Unauthorized: You do not have permission to delete this athlete account'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  -- Get athlete profile to verify it exists and is an athlete
  SELECT * INTO athlete_profile
  FROM profiles
  WHERE id = target_athlete_id AND role = 'athlete';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Athlete not found or not an athlete role'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  -- Count records before deletion for summary
  SELECT COUNT(*) INTO coach_athletes_count
  FROM coach_athletes
  WHERE athlete_id = target_athlete_id;

  SELECT COUNT(*) INTO program_assignments_count
  FROM program_assignments
  WHERE athlete_id = target_athlete_id;

  SELECT COUNT(*) INTO workout_assignments_count
  FROM workout_assignments
  WHERE athlete_id = target_athlete_id;

  SELECT COUNT(*) INTO athlete_activity_count
  FROM athlete_activity
  WHERE athlete_id = target_athlete_id;

  -- Delete related records in correct order
  -- 1. Delete athlete activity records
  DELETE FROM athlete_activity WHERE athlete_id = target_athlete_id;

  -- 2. Delete workout assignments
  DELETE FROM workout_assignments WHERE athlete_id = target_athlete_id;

  -- 3. Delete program assignments
  DELETE FROM program_assignments WHERE athlete_id = target_athlete_id;

  -- 4. Delete coach-athlete relationships
  DELETE FROM coach_athletes WHERE athlete_id = target_athlete_id;

  -- 5. Delete the profile (bypass RLS using security definer)
  DELETE FROM profiles WHERE id = target_athlete_id;

  -- 6. Delete the auth user (this requires special handling)
  -- We need to use the auth schema directly with proper permissions
  DELETE FROM auth.users WHERE id = target_athlete_id;

  -- Create deletion summary
  deletion_summary := json_build_object(
    'success', true,
    'athlete_id', target_athlete_id,
    'athlete_name', athlete_profile.full_name,
    'deleted_records', json_build_object(
      'athlete_activity', athlete_activity_count,
      'workout_assignments', workout_assignments_count,
      'program_assignments', program_assignments_count,
      'coach_athletes', coach_athletes_count,
      'profile', 1,
      'auth_user', 1
    ),
    'deleted_at', now()
  );

  RETURN deletion_summary;

EXCEPTION
  WHEN OTHERS THEN
    -- Return error details
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_athlete_account(uuid, uuid) TO authenticated;

-- Grant the function permission to access auth schema
-- This is needed for the function to delete from auth.users
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT DELETE ON auth.users TO postgres;

-- Alternative approach: Create a trigger that automatically deletes auth.users when profile is deleted
-- This will serve as a backup mechanism
CREATE OR REPLACE FUNCTION public.handle_profile_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When a profile is deleted, also delete the corresponding auth user
  -- This only applies to athlete profiles
  IF OLD.role = 'athlete' THEN
    -- Delete from auth.users
    DELETE FROM auth.users WHERE id = OLD.id;
  END IF;
  
  RETURN OLD;
END;
$$;

-- Create the trigger on profile deletion
DROP TRIGGER IF EXISTS on_profile_deleted ON public.profiles;
CREATE TRIGGER on_profile_deleted
  AFTER DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_deletion();

-- Grant necessary permissions for the trigger function
GRANT EXECUTE ON FUNCTION public.handle_profile_deletion() TO authenticated;

-- Ensure the deletion policies allow for proper deletion
-- Update the existing policies to be more permissive for SECURITY DEFINER functions

-- Drop and recreate the athlete profile deletion policy to be more permissive
DROP POLICY IF EXISTS "athletes_can_delete_own_profile" ON "public"."profiles";
CREATE POLICY "athletes_can_delete_own_profile" ON "public"."profiles"
  FOR DELETE USING (
    id = auth.uid() AND role = 'athlete'
  );

-- Drop and recreate the coach profile deletion policy to be more permissive  
DROP POLICY IF EXISTS "coaches_can_delete_athlete_profiles" ON "public"."profiles";
CREATE POLICY "coaches_can_delete_athlete_profiles" ON "public"."profiles"
  FOR DELETE USING (
    role = 'athlete' AND (
      -- Allow if the requesting user is a coach with this athlete
      EXISTS (
        SELECT 1 FROM coach_athletes ca
        WHERE ca.coach_id = auth.uid() AND ca.athlete_id = id
      )
      -- Also allow for SECURITY DEFINER functions (they run with elevated privileges)
      OR current_setting('role') = 'postgres'
    )
  );

-- Comment on the function
COMMENT ON FUNCTION public.delete_athlete_account(uuid, uuid) IS 
'Safely deletes an athlete account and all related data. Improved version with proper auth.users handling and trigger backup mechanism.';

COMMENT ON FUNCTION public.handle_profile_deletion() IS
'Trigger function that automatically deletes auth.users when an athlete profile is deleted.'; 