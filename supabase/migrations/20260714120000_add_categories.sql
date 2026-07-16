-- Add category column to plate_sizes
ALTER TABLE plate_sizes ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'shuttering';

-- Set existing jack items to 'jack' category
UPDATE plate_sizes SET category = 'jack' 
WHERE name ILIKE '%jack%' OR name ILIKE '%જેક%';
