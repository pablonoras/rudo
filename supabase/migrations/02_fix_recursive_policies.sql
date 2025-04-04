-- Updated comprehensive fix for recursive policy issues
-- This script handles the case where policies might not be dropped correctly

-- 1. First, view all existing policies to identify what's currently in place
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
AND (tablename = 'profiles' OR tablename = 'team_members' OR tablename = 'teams')
ORDER BY tablename, policyname;

-- 2. Temporarily disable RLS on the problematic tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;

-- 3. Drop ALL existing policies for these tables (using a more thorough approach)
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  -- Drop all policies for profiles
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', policy_record.policyname);
    RAISE NOTICE 'Dropped policy % on profiles', policy_record.policyname;
  END LOOP;
  
  -- Drop all policies for teams
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'teams'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON teams', policy_record.policyname);
    RAISE NOTICE 'Dropped policy % on teams', policy_record.policyname;
  END LOOP;
  
  -- Drop all policies for team_members
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'team_members'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON team_members', policy_record.policyname);
    RAISE NOTICE 'Dropped policy % on team_members', policy_record.policyname;
  END LOOP;
END $$;

-- 4. Verify that all policies have been dropped
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
AND (tablename = 'profiles' OR tablename = 'team_members' OR tablename = 'teams')
ORDER BY tablename, policyname;

-- 5. Re-enable RLS on the tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- 6. Create new non-recursive policies with unique names
-- Profiles policies
CREATE POLICY "profiles_public_coach_view"
  ON profiles
  FOR SELECT
  USING (role = 'coach');

CREATE POLICY "profiles_own_access"
  ON profiles
  FOR ALL
  USING (auth.uid() = id);

-- Teams policies
CREATE POLICY "teams_coach_manage"
  ON teams
  FOR ALL
  USING (coach_id = auth.uid());

CREATE POLICY "teams_public_view"
  ON teams
  FOR SELECT
  USING (true);

-- Team members policies
CREATE POLICY "team_members_coach_manage"
  ON team_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE id = team_members.team_id AND coach_id = auth.uid()
    )
  );

CREATE POLICY "team_members_public_view"
  ON team_members
  FOR SELECT
  USING (true);

-- 7. Verify the new policies have been created
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
AND (tablename = 'profiles' OR tablename = 'team_members' OR tablename = 'teams')
ORDER BY tablename, policyname; 