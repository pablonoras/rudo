-- Create sessions table to store program sessions
CREATE TABLE sessions (
  session_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add index for faster lookups by program_id
CREATE INDEX idx_sessions_program_id ON sessions(program_id);

-- Add the updated_at trigger
CREATE TRIGGER update_sessions_updated_at
BEFORE UPDATE ON sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Row level security policies
-- Enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Policy for coaches - they can view and edit sessions for programs they own
CREATE POLICY "Coaches can CRUD sessions for their programs" ON sessions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM programs
    WHERE programs.id = sessions.program_id
    AND programs.coach_id = auth.uid()
  )
);

-- Policy for athletes - they can view sessions for programs assigned to them
CREATE POLICY "Athletes can view sessions for assigned programs" ON sessions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM program_assignments pa
    JOIN programs p ON p.id = sessions.program_id
    WHERE pa.program_id = sessions.program_id
    AND pa.athlete_id = auth.uid()
  )
); 