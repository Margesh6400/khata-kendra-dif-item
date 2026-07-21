-- Migration to add category column to tables
ALTER TABLE clients ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'shuttering';
ALTER TABLE udhar_challans ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'shuttering';
ALTER TABLE jama_challans ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'shuttering';
ALTER TABLE bills ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'shuttering';
