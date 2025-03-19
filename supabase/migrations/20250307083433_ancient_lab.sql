/*
  # Initial Schema Setup for CrossFit Coach Platform

  1. New Tables
    - profiles
      - Stores user profile information and role (coach/athlete)
      - Links to Supabase auth.users
    - teams
      - Groups athletes under a coach
      - Enables team-based program assignment
    - team_members
      - Junction table for team membership
    - programs
      - Workout programs created by coaches
    - program_assignments
      - Links programs to athletes/teams
    - program_days
      - Individual days within a program
    - workout_blocks
      - Components of a workout day (e.g., warmup, strength, metcon)
    - exercises
      - Exercise library
    - workout_exercises
      - Exercises within a workout block
    - completion_logs
      - Tracks athlete workout completion

  2. Security
    - RLS policies for each table
    - Role-based access control
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('coach', 'athlete');

-- Profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
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

-- RLS Policies

-- Profiles: Users can read their own profile and coaches can read their athletes' profiles
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Coaches can read their athletes' profiles"
  ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      WHERE t.coach_id = auth.uid() AND tm.athlete_id = profiles.id
    )
  );

-- Teams: Coaches can manage their teams, athletes can read teams they belong to
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

-- Team members: Coaches can manage their team members
CREATE POLICY "Coaches can manage team members"
  ON team_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE id = team_members.team_id AND coach_id = auth.uid()
    )
  );

-- Programs: Coaches can manage their programs
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

-- Create functions for user management
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, role, full_name, email)
  VALUES (
    new.id,
    CASE 
      WHEN new.raw_user_meta_data->>'role' = 'coach' THEN 'coach'::user_role
      ELSE 'athlete'::user_role
    END,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();