-- 12_add_workout_types.sql
-- Adding workout type system backed by a lookup table

-- Step 1: Create workout types table
CREATE TABLE IF NOT EXISTS "public"."workout_types" (
  "id" SERIAL PRIMARY KEY,
  "code" TEXT UNIQUE NOT NULL,
  "created_by_coach_id" UUID REFERENCES profiles(id)  -- null = seed / system
);

-- Step 2: Seed with base workout types
INSERT INTO workout_types (code) VALUES
  ('strength'),
  ('powerlifting'),
  ('olympic'),
  ('metcon'),
  ('conditioning'),
  ('endurance'),
  ('cardio'),
  ('aerobic'),
  ('anaerobic'),
  ('skill'),
  ('technique'),
  ('gymnastics'),
  ('mobility'),
  ('flexibility'),
  ('recovery'),
  ('warmup'),
  ('cooldown'),
  ('hypertrophy'),
  ('accessory'),
  ('core'),
  ('stability'),
  ('balance'),
  ('agility'),
  ('speed'),
  ('plyometric'),
  ('interval'),
  ('circuit'),
  ('team'),
  ('partner'),
  ('benchmark'),
  ('hero'),
  ('girl'),
  ('test'),
  ('max'),
  ('custom');

-- Step 3: Add type_id to workouts table initially without NOT NULL constraint
ALTER TABLE workouts
  ADD COLUMN type_id INTEGER NOT NULL
  REFERENCES workout_types(id);

-- Step 4: Create index for better performance
CREATE INDEX ix_workouts_type ON workouts (type_id);

-- Step5: Add RLS policies for workout types
-- Everyone can read workout types
CREATE POLICY "anyone_can_read_workout_types" 
  ON "public"."workout_types" 
  FOR SELECT USING (true);

-- Coaches can create custom workout types
CREATE POLICY "coaches_can_create_workout_types" 
  ON "public"."workout_types" 
  FOR INSERT
  WITH CHECK (
    created_by_coach_id = auth.uid()
  );

-- Enable RLS on workout_types
ALTER TABLE "public"."workout_types" ENABLE ROW LEVEL SECURITY;

-- Add comments for documentation
COMMENT ON TABLE "public"."workout_types" IS 'Lookup table for workout classification types';
COMMENT ON COLUMN "public"."workout_types"."code" IS 'Unique code identifier for the workout type';
COMMENT ON COLUMN "public"."workout_types"."created_by_coach_id" IS 'Coach who created this type (null for system types)';
COMMENT ON COLUMN "public"."workouts"."type_id" IS 'Reference to workout_types table for classification'; 