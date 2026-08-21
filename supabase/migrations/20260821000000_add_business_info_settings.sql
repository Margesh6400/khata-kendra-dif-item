-- Configurable business identity (name, phone, address) printed on bills and
-- WhatsApp messages. Settings > Business Information lets the user choose
-- between the built-in "Khata Kendra" default (per app language) and their
-- own custom values, synced here so it's shared across devices.
INSERT INTO app_settings (key, value) VALUES
  ('use_custom_business_info', 'false'),
  ('business_name', 'Khata Kendra'),
  ('business_phone', '88664 71567'),
  ('business_address', 'Blue City, Simada, Surat')
ON CONFLICT (key) DO NOTHING;
