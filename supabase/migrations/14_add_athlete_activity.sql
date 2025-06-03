-- 14_add_athlete_activity.sql
-- Create athlete_activity table to track workout completion, notes, and scaling information.
-- This table allows athletes to log their workout experiences, mark completions,
-- and add notes about how the workout felt or any modifications made.

-- Create the athlete_activity table
CREATE TABLE IF NOT EXISTS "public"."athlete_activity" (
    "id" bigserial PRIMARY KEY,
    "athlete_id" uuid NOT NULL,
    "workout_id" uuid NOT NULL,
    "scheduled_on" date NULL,
    "is_completed" boolean NOT NULL DEFAULT false,
    "completed_at" timestamptz NULL,
    "notes" text NULL,
    "is_unscaled" boolean NULL,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE "public"."athlete_activity" 
ADD CONSTRAINT "athlete_activity_athlete_id_fkey" 
FOREIGN KEY ("athlete_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;

ALTER TABLE "public"."athlete_activity" 
ADD CONSTRAINT "athlete_activity_workout_id_fkey" 
FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("workout_id") ON DELETE CASCADE;

-- Add unique constraint to prevent duplicate logs per day
ALTER TABLE "public"."athlete_activity" 
ADD CONSTRAINT "athlete_activity_unique_per_day" 
UNIQUE ("athlete_id", "workout_id", "scheduled_on");

-- Add index for calendar queries (athlete activities by date)
CREATE INDEX "idx_athlete_activity_calendar" 
ON "public"."athlete_activity" ("athlete_id", "scheduled_on" DESC);

-- Add index for athlete's workout activities
CREATE INDEX "idx_athlete_activity_athlete_workout" 
ON "public"."athlete_activity" ("athlete_id", "workout_id");

-- Add index for completion status queries
CREATE INDEX "idx_athlete_activity_completed" 
ON "public"."athlete_activity" ("athlete_id", "is_completed", "completed_at");

-- Create trigger function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_athlete_activity_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at column
CREATE TRIGGER trigger_update_athlete_activity_updated_at
    BEFORE UPDATE ON "public"."athlete_activity"
    FOR EACH ROW
    EXECUTE FUNCTION update_athlete_activity_updated_at();

-- Add Row Level Security (RLS) policies
ALTER TABLE "public"."athlete_activity" ENABLE ROW LEVEL SECURITY;

-- Policy: Athletes can only access their own activity records
CREATE POLICY "Athletes can manage own activity" ON "public"."athlete_activity"
    FOR ALL USING (
        auth.uid() = athlete_id
    );

-- Policy: Coaches can view activity of their athletes
CREATE POLICY "Coaches can view athlete activity" ON "public"."athlete_activity"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "public"."coach_athletes" ca
            WHERE ca.athlete_id = "public"."athlete_activity".athlete_id
            AND ca.coach_id = auth.uid()
            AND ca.status = 'active'
        )
    );

-- Add helpful comments
COMMENT ON TABLE "public"."athlete_activity" IS 'Tracks athlete workout activities including completion status, notes, and scaling information';
COMMENT ON COLUMN "public"."athlete_activity"."scheduled_on" IS 'Date when workout was scheduled; NULL for adhoc logs';
COMMENT ON COLUMN "public"."athlete_activity"."is_completed" IS 'Whether the workout has been marked as completed';
COMMENT ON COLUMN "public"."athlete_activity"."completed_at" IS 'Timestamp when workout was marked as completed';
COMMENT ON COLUMN "public"."athlete_activity"."notes" IS 'Free-form notes about how the workout felt or any modifications';
COMMENT ON COLUMN "public"."athlete_activity"."is_unscaled" IS 'Whether workout was performed as prescribed (true) or scaled (false)'; 