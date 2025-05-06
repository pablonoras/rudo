-- Drop existing tables
DROP TABLE IF EXISTS workout_blocks CASCADE;
DROP TABLE IF EXISTS workout_exercise CASCADE;

-- Create new workouts table
CREATE TABLE workouts (
  workout_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL,
  description TEXT,
  color TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX workouts_session_id_idx ON workouts(session_id);

-- Add comment to describe the table purpose
COMMENT ON TABLE workouts IS 'Stores workout information associated with training sessions';

-- Add trigger to update the updated_at timestamp
CREATE TRIGGER update_workouts_updated_at
BEFORE UPDATE ON workouts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 