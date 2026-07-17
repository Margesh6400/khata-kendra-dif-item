-- Track how a bill was created:
--   'manual' - by a person (CreateBill page, or the Create All Bills button)
--   'cron'   - by the scheduled monthly bill generation job
ALTER TABLE bills ADD COLUMN IF NOT EXISTS generated_by text DEFAULT 'manual';

UPDATE bills SET generated_by = 'manual' WHERE generated_by IS NULL;
