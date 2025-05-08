-- Migration 16: Remove Teams and team_members tables
-- This migration removes team functionality to simplify the application

-- Drop policies related to teams and team_members first
DROP POLICY IF EXISTS "Coaches can update their team members' profiles" ON profiles;
DROP POLICY IF EXISTS "Coaches can manage their teams" ON teams;
DROP POLICY IF EXISTS "Athletes can view their teams" ON teams;
DROP POLICY IF EXISTS "Coaches can manage team members" ON team_members;

-- Drop policy that depends on team_id in program_assignments
DROP POLICY IF EXISTS "Athletes can view assigned programs" ON programs;

-- Drop indexes and constraints
DROP INDEX IF EXISTS idx_team_members_athlete;
DROP INDEX IF EXISTS idx_team_members_team;

-- Drop triggers
DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
DROP TRIGGER IF EXISTS validate_coach_role_trigger ON teams;
DROP TRIGGER IF EXISTS validate_athlete_role_trigger ON team_members;

-- Remove references to teams from program_assignments
ALTER TABLE program_assignments
  DROP CONSTRAINT IF EXISTS team_or_athlete_check;

-- Update program_assignments to remove team references
ALTER TABLE program_assignments
  DROP COLUMN IF EXISTS team_id;

-- Create a new constraint to ensure athlete_id is not null
ALTER TABLE program_assignments
  ADD CONSTRAINT athlete_id_not_null CHECK (athlete_id IS NOT NULL);

-- Add back the athletes view assigned programs policy without team references
CREATE POLICY "Athletes can view assigned programs"
  ON programs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM program_assignments pa
      WHERE pa.program_id = programs.id
      AND pa.athlete_id = auth.uid()
    )
  );

-- Finally, drop the team_members and teams tables
DROP TABLE IF EXISTS team_members;
DROP TABLE IF EXISTS teams; 