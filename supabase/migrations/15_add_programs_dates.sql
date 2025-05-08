-- Migration 15: add start_date and end_date to programs table
-- Added start_date and end_date with non-null constraint and defaults

ALTER TABLE programs
  ADD COLUMN start_date date;

ALTER TABLE programs
  ADD COLUMN end_date date;

-- Populate existing rows with created_at date and 7 days later
UPDATE programs
  SET start_date = created_at::date,
      end_date = (created_at + INTERVAL '7 days')::date;

ALTER TABLE programs
  ALTER COLUMN start_date SET NOT NULL,
  ALTER COLUMN start_date SET DEFAULT now()::date,
  ALTER COLUMN end_date SET NOT NULL,
  ALTER COLUMN end_date SET DEFAULT (now() + INTERVAL '7 days')::date; 