-- Add updated_at and previous_status columns to coach_athletes table

-- Add the columns
ALTER TABLE coach_athletes
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS previous_status TEXT;

-- Create function to track previous status and update the updated_at timestamp
CREATE OR REPLACE FUNCTION track_coach_athletes_status_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Set previous_status to the old status value before update
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.previous_status = OLD.status;
  END IF;
  
  -- Always update the updated_at timestamp
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update the columns
DROP TRIGGER IF EXISTS coach_athletes_status_tracking ON coach_athletes;
CREATE TRIGGER coach_athletes_status_tracking
BEFORE UPDATE ON coach_athletes
FOR EACH ROW
EXECUTE FUNCTION track_coach_athletes_status_changes(); 