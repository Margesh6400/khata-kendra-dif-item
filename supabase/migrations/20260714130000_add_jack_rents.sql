-- Add jack_rents column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS jack_rents JSONB DEFAULT '{}'::jsonb;
