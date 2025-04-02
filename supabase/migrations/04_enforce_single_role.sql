-- Enforce single role policy
-- This script prevents users from changing their role between coach and athlete

-- Create a function to validate role changes
CREATE OR REPLACE FUNCTION enforce_consistent_role()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a new record, allow it
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;
  
  -- If the role is changing from athlete to coach or vice versa, prevent it
  IF (OLD.role = 'athlete' AND NEW.role = 'coach') OR 
     (OLD.role = 'coach' AND NEW.role = 'athlete') THEN
    RAISE EXCEPTION 'Role change from % to % is not allowed. Users cannot switch between athlete and coach roles.', 
      OLD.role, NEW.role;
  END IF;
  
  -- Otherwise allow the update
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add the trigger to the profiles table
DROP TRIGGER IF EXISTS enforce_role_consistency ON profiles;
CREATE TRIGGER enforce_role_consistency
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION enforce_consistent_role();

-- Create a function to check role during team membership assignment
CREATE OR REPLACE FUNCTION enforce_athlete_role_for_team_members()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the user is a coach trying to become an athlete team member
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = NEW.athlete_id AND role = 'coach'
  ) THEN
    RAISE EXCEPTION 'A coach (%) cannot be added as an athlete to a team', NEW.athlete_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add the trigger to the team_members table
DROP TRIGGER IF EXISTS enforce_athlete_role_in_team_members ON team_members;
CREATE TRIGGER enforce_athlete_role_in_team_members
BEFORE INSERT OR UPDATE ON team_members
FOR EACH ROW
EXECUTE FUNCTION enforce_athlete_role_for_team_members();

-- Create a function to validate coach role for team creation
CREATE OR REPLACE FUNCTION enforce_coach_role_for_teams()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the user is an athlete trying to create a team
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = NEW.coach_id AND role = 'athlete'
  ) THEN
    RAISE EXCEPTION 'An athlete (%) cannot create or manage a team', NEW.coach_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add the trigger to the teams table
DROP TRIGGER IF EXISTS enforce_coach_role_in_teams ON teams;
CREATE TRIGGER enforce_coach_role_in_teams
BEFORE INSERT OR UPDATE ON teams
FOR EACH ROW
EXECUTE FUNCTION enforce_coach_role_for_teams(); 