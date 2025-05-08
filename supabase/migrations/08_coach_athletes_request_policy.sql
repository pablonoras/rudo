-- Add policy to allow athletes to request to join coaches
CREATE POLICY "athletes_can_request_coaches"
ON coach_athletes
FOR INSERT
WITH CHECK (
  athlete_id = auth.uid() AND
  status = 'pending' AND
  NOT EXISTS (
    SELECT 1 FROM coach_athletes
    WHERE athlete_id = auth.uid() AND coach_id = coach_athletes.coach_id
  )
);

-- Add policy to allow coaches to update athlete status
CREATE POLICY "coaches_update_athlete_status"
ON coach_athletes
FOR UPDATE
USING (coach_id = auth.uid())
WITH CHECK (coach_id = auth.uid());

-- Add policy to allow coach to see pending requests
CREATE POLICY "coaches_view_pending_requests"
ON coach_athletes
FOR SELECT
USING (
  coach_id = auth.uid()
);

-- Add function to notify coaches of new athlete requests
CREATE OR REPLACE FUNCTION notify_coach_of_request()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (
    user_id,
    title,
    body,
    type,
    reference_id,
    reference_table
  )
  VALUES (
    NEW.coach_id,
    'New Athlete Request',
    (SELECT full_name FROM profiles WHERE id = NEW.athlete_id) || ' has requested to join your team.',
    'athlete_request',
    NEW.id,
    'coach_athletes'
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't prevent the insert
    RAISE NOTICE 'Error sending notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for the notification
DROP TRIGGER IF EXISTS athlete_request_notification ON coach_athletes;
CREATE TRIGGER athlete_request_notification
AFTER INSERT ON coach_athletes
FOR EACH ROW
WHEN (NEW.status = 'pending')
EXECUTE FUNCTION notify_coach_of_request(); 