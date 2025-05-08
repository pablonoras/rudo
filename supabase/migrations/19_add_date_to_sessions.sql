-- Add a date column to the sessions table to record which day the session belongs to
ALTER TABLE sessions ADD COLUMN session_date date;

-- Add an index for better performance when querying by date
CREATE INDEX idx_sessions_date ON sessions(session_date);

-- Make the column NOT NULL for future inserts, but allow existing records to remain
-- We'll set this after adding the column to avoid issues with existing data
ALTER TABLE sessions ALTER COLUMN session_date SET NOT NULL;

COMMENT ON COLUMN sessions.session_date IS 'The date when this session is scheduled'; 