-- On/off switch for the monthly bill generation cron, controlled from the
-- app's Settings screen. The edge function checks it at the start of every
-- cron-triggered run; the manual Create All Bills button ignores it.
INSERT INTO app_settings (key, value)
VALUES ('monthly_bill_cron_enabled', 'true')
ON CONFLICT (key) DO NOTHING;
