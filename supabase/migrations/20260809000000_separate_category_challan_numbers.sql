-- Migration: Allow separate challan numbers per category by updating UNIQUE constraints to (udhar_challan_number, category) and (jama_challan_number, category)

-- 1. Ensure category columns exist on udhar_items and jama_items
ALTER TABLE udhar_items ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'shuttering';
ALTER TABLE jama_items ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'shuttering';

-- 2. Drop existing single-column FK constraints if present
ALTER TABLE udhar_items DROP CONSTRAINT IF EXISTS udhar_items_udhar_challan_number_fkey;
ALTER TABLE jama_items DROP CONSTRAINT IF EXISTS jama_items_jama_challan_number_fkey;

-- 3. Drop existing single-column UNIQUE constraints on udhar_challans and jama_challans
ALTER TABLE udhar_challans DROP CONSTRAINT IF EXISTS udhar_challans_udhar_challan_number_key;
ALTER TABLE jama_challans DROP CONSTRAINT IF EXISTS jama_challans_jama_challan_number_key;

-- 4. Add composite UNIQUE constraints (udhar_challan_number, category) and (jama_challan_number, category)
ALTER TABLE udhar_challans DROP CONSTRAINT IF EXISTS udhar_challans_number_category_key;
ALTER TABLE jama_challans DROP CONSTRAINT IF EXISTS jama_challans_number_category_key;
ALTER TABLE udhar_challans ADD CONSTRAINT udhar_challans_number_category_key UNIQUE (udhar_challan_number, category);
ALTER TABLE jama_challans ADD CONSTRAINT jama_challans_number_category_key UNIQUE (jama_challan_number, category);

-- 5. Sync category in existing udhar_items and jama_items rows to match parent challan tables
UPDATE udhar_items ui
SET category = uc.category
FROM udhar_challans uc
WHERE ui.udhar_challan_number = uc.udhar_challan_number;

UPDATE jama_items ji
SET category = jc.category
FROM jama_challans jc
WHERE ji.jama_challan_number = jc.jama_challan_number;

-- 6. Add composite FK constraints on udhar_items and jama_items
ALTER TABLE udhar_items ADD CONSTRAINT udhar_items_udhar_challan_number_fkey FOREIGN KEY (udhar_challan_number, category) REFERENCES udhar_challans (udhar_challan_number, category) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE jama_items ADD CONSTRAINT jama_items_jama_challan_number_fkey FOREIGN KEY (jama_challan_number, category) REFERENCES jama_challans (jama_challan_number, category) ON DELETE CASCADE ON UPDATE CASCADE;
