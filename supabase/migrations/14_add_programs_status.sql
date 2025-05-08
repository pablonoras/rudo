-- Migration 14: add status column to programs table
-- Added status column with default 'draft' and constraint for ('draft', 'published', 'archived')

ALTER TABLE programs
  DROP CONSTRAINT IF EXISTS programs_status_check;

ALTER TABLE programs
  ADD COLUMN status text NOT NULL DEFAULT 'draft';

ALTER TABLE programs
  ADD CONSTRAINT programs_status_check CHECK (status IN ('draft', 'published', 'archived')); 