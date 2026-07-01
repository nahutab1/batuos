-- Add missing columns to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority integer NOT NULL DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date timestamp with time zone;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Add missing columns to notes table
ALTER TABLE notes ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE notes ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Add missing columns to memories table
ALTER TABLE memories ADD COLUMN IF NOT EXISTS context text;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';
ALTER TABLE memories ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Add missing columns to goals table
ALTER TABLE goals ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS target_date timestamp with time zone;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Add missing columns to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
