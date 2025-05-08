-- Update the coach_athletes table to modify the status column
ALTER TABLE coach_athletes
  DROP CONSTRAINT IF EXISTS coach_athletes_status_check;

ALTER TABLE coach_athletes
  -- First set the default value for new rows
  ALTER COLUMN status SET DEFAULT 'pending',
  -- Then add a check constraint to validate status values
  ADD CONSTRAINT coach_athletes_status_check CHECK (status IN ('pending', 'active', 'declined', 'inactive')); 