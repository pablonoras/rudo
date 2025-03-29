/*
  # CrossFit Coach Platform Schema

  Sections:
  1. Types and Enums
  2. Core Tables (profiles, teams)
  3. Program Tables (programs, assignments, days)
  4. Workout Tables (blocks, exercises)
  5. Authentication Functions
  6. Security Policies
  7. Indexes and Constraints
*/

-- 1. Types and Enums
CREATE TYPE user_role AS ENUM ('coach', 'athlete');

-- 2. Core Tables
-- Profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Teams table
CREATE TABLE teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Team members junction table
CREATE TABLE team_members (
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  athlete_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, athlete_id)
);

-- 3. Program Tables
-- Programs table
CREATE TABLE programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  duration_weeks integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Program assignments table
CREATE TABLE program_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  athlete_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT team_or_athlete_check CHECK (
    (team_id IS NOT NULL AND athlete_id IS NULL) OR
    (team_id IS NULL AND athlete_id IS NOT NULL)
  )
);

-- Program days table
CREATE TABLE program_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  day_number integer NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (program_id, day_number)
);

-- 4. Workout Tables
-- Workout blocks table
CREATE TABLE workout_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_day_id uuid NOT NULL REFERENCES program_days(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  block_order integer NOT NULL,
  block_type text NOT NULL,
  time_cap_minutes integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Exercises table
CREATE TABLE exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Workout exercises junction table
CREATE TABLE workout_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_block_id uuid NOT NULL REFERENCES workout_blocks(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  exercise_order integer NOT NULL,
  sets integer,
  reps text,
  weight text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Completion logs table
CREATE TABLE completion_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_day_id uuid NOT NULL REFERENCES program_days(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  rating integer CHECK (rating >= 1 AND rating <= 5)
);

-- 5. Authentication Functions
-- Function to handle new user creation (including Google OAuth)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    role,
    full_name,
    email,
    avatar_url
  )
  VALUES (
    new.id,
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'athlete'::user_role),
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'user_name',
      'Anonymous'
    ),
    COALESCE(new.email, (new.raw_user_meta_data->>'email')),
    COALESCE(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to validate coach role
CREATE OR REPLACE FUNCTION validate_coach_role()
RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = NEW.coach_id AND role = 'coach'
  ) THEN
    RAISE EXCEPTION 'Only users with coach role can create or update teams';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate athlete role
CREATE OR REPLACE FUNCTION validate_athlete_role()
RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = NEW.athlete_id AND role = 'athlete'
  ) THEN
    RAISE EXCEPTION 'Only users with athlete role can be added to teams';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Security Policies
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE completion_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Team members can view each other's profiles"
  ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm1
      JOIN team_members tm2 ON tm1.team_id = tm2.team_id
      WHERE tm1.athlete_id = auth.uid()
      AND tm2.athlete_id = profiles.id
    )
  );

CREATE POLICY "Coaches can update their team members' profiles"
  ON profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE t.coach_id = auth.uid()
      AND tm.athlete_id = profiles.id
    )
  );

-- Teams policies
CREATE POLICY "Coaches can manage their teams"
  ON teams
  FOR ALL
  USING (coach_id = auth.uid());

CREATE POLICY "Athletes can view their teams"
  ON teams
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_id = teams.id AND athlete_id = auth.uid()
    )
  );

-- Team members policies
CREATE POLICY "Coaches can manage team members"
  ON team_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE id = team_members.team_id AND coach_id = auth.uid()
    )
  );

-- Programs policies
CREATE POLICY "Coaches can manage their programs"
  ON programs
  FOR ALL
  USING (coach_id = auth.uid());

CREATE POLICY "Athletes can view assigned programs"
  ON programs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM program_assignments pa
      WHERE pa.program_id = programs.id
      AND (
        pa.athlete_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM team_members tm
          WHERE tm.team_id = pa.team_id AND tm.athlete_id = auth.uid()
        )
      )
    )
  );

-- 7. Indexes and Constraints
-- Add indexes for common queries
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_team_members_athlete ON team_members(athlete_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_programs_coach ON programs(coach_id);

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_programs_updated_at
    BEFORE UPDATE ON programs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_program_days_updated_at
    BEFORE UPDATE ON program_days
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_blocks_updated_at
    BEFORE UPDATE ON workout_blocks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at
    BEFORE UPDATE ON exercises
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_exercises_updated_at
    BEFORE UPDATE ON workout_exercises
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add role validation triggers
CREATE TRIGGER validate_coach_role_trigger
    BEFORE INSERT OR UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION validate_coach_role();

CREATE TRIGGER validate_athlete_role_trigger
    BEFORE INSERT OR UPDATE ON team_members
    FOR EACH ROW
    EXECUTE FUNCTION validate_athlete_role();

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();