-- Add previous_pending_amount column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS previous_pending_amount NUMERIC DEFAULT 0 NOT NULL;
