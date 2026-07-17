-- App-wide settings shared between devices and server-side jobs.
-- The Settings screen syncs bill-calculation settings here so the monthly
-- bill cron uses the same values as manual billing.
CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated manage app_settings" ON app_settings;
CREATE POLICY "Authenticated manage app_settings" ON app_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO app_settings (key, value)
VALUES ('date_sorting_method', 'standard')
ON CONFLICT (key) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Monthly bill generation cron: 1st of every month, 03:00 UTC (08:30 IST).
-- Calls the generate-monthly-bills edge function via pg_net.
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  PERFORM cron.unschedule('generate-monthly-bills');
EXCEPTION WHEN OTHERS THEN
  NULL; -- job did not exist yet
END $$;

SELECT cron.schedule(
  'generate-monthly-bills',
  '0 3 1 * *',
  $$
  SELECT net.http_post(
    url := 'https://bowonoxrnbelxjbwbthe.supabase.co/functions/v1/generate-monthly-bills',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer cronsecretkey'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  );
  $$
);
