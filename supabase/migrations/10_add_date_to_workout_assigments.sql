
-- Add the date column to workout_assigments table
ALTER TABLE "public"."workout_assigments" ADD COLUMN "workout_date" DATE NOT NULL;

-- Create an index for better query performance when filtering by date
CREATE INDEX "idx_workout_assigments_date" ON "public"."workout_assigments" USING btree ("workout_date");

-- Add a comment to explain the purpose of this column
COMMENT ON COLUMN "public"."workout_assigments"."workout_date" IS 'The date when this workout is scheduled'; 