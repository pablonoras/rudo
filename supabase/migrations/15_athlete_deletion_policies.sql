-- 15_athlete_deletion_policies.sql
-- This migration adds policies and stored procedures for safely deleting athlete accounts
-- including all related data (coach_athletes, program_assignments, workout_assignments)

-- Create a stored procedure to safely delete an athlete account
-- This function will handle all the cascading deletes in the correct order
CREATE OR REPLACE FUNCTION public.delete_athlete_account(
  target_athlete_id uuid,
  requesting_user_id uuid DEFAULT auth.uid()
) 
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
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

  -- 5. Delete the profile
  DELETE FROM profiles WHERE id = target_athlete_id;

  -- 6. Delete the auth user (this is the most critical step)
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

-- Create RLS policies for deletion operations

-- Allow athletes to delete their own records
CREATE POLICY "athletes_can_delete_own_coach_relationships" ON "public"."coach_athletes"
  FOR DELETE USING (athlete_id = auth.uid());

CREATE POLICY "athletes_can_delete_own_program_assignments" ON "public"."program_assignments"
  FOR DELETE USING (athlete_id = auth.uid());

CREATE POLICY "athletes_can_delete_own_workout_assignments" ON "public"."workout_assignments"
  FOR DELETE USING (athlete_id = auth.uid());

-- Allow athletes to delete their own activity records (if the table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'athlete_activity') THEN
    EXECUTE 'CREATE POLICY "athletes_can_delete_own_activity" ON "public"."athlete_activity"
      FOR DELETE USING (athlete_id = auth.uid())';
  END IF;
END $$;

-- Allow athletes to delete their own profile
CREATE POLICY "athletes_can_delete_own_profile" ON "public"."profiles"
  FOR DELETE USING (id = auth.uid() AND role = 'athlete');

-- Allow coaches to delete athlete records for their athletes
CREATE POLICY "coaches_can_delete_athlete_relationships" ON "public"."coach_athletes"
  FOR DELETE USING (
    coach_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM coach_athletes ca2
      WHERE ca2.coach_id = auth.uid() AND ca2.athlete_id = athlete_id
    )
  );

CREATE POLICY "coaches_can_delete_athlete_program_assignments" ON "public"."program_assignments"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM coach_athletes ca
      WHERE ca.coach_id = auth.uid() AND ca.athlete_id = athlete_id
    )
  );

CREATE POLICY "coaches_can_delete_athlete_workout_assignments" ON "public"."workout_assignments"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM coach_athletes ca
      WHERE ca.coach_id = auth.uid() AND ca.athlete_id = athlete_id
    )
  );

-- Allow coaches to delete athlete activity records for their athletes (if the table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'athlete_activity') THEN
    EXECUTE 'CREATE POLICY "coaches_can_delete_athlete_activity" ON "public"."athlete_activity"
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM coach_athletes ca
          WHERE ca.coach_id = auth.uid() AND ca.athlete_id = athlete_id
        )
      )';
  END IF;
END $$;

-- Allow coaches to delete athlete profiles for their athletes
CREATE POLICY "coaches_can_delete_athlete_profiles" ON "public"."profiles"
  FOR DELETE USING (
    role = 'athlete' AND
    EXISTS (
      SELECT 1 FROM coach_athletes ca
      WHERE ca.coach_id = auth.uid() AND ca.athlete_id = id
    )
  );

-- Comment on the function
COMMENT ON FUNCTION public.delete_athlete_account(uuid, uuid) IS 
'Safely deletes an athlete account and all related data. Can be called by the athlete themselves or by a coach who has the athlete. Returns a JSON summary of the deletion operation.'; 