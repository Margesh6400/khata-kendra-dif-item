-- The live DB was created without the bills.status column that the app code
-- (billOperations.saveBill) and the monthly bill cron expect. Add it:
-- existing bills were manually generated, new rows default to 'draft'
-- (cron-created bills awaiting owner review).
ALTER TABLE bills ADD COLUMN IF NOT EXISTS status varchar(20);

UPDATE bills SET status = 'generated' WHERE status IS NULL;

ALTER TABLE bills ALTER COLUMN status SET DEFAULT 'draft';

DO $$
BEGIN
  ALTER TABLE bills ADD CONSTRAINT bills_status_check
    CHECK (status IN ('draft', 'generated', 'cancelled'));
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;
