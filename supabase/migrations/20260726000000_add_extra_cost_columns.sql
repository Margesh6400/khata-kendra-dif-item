-- Migration: Add extra cost columns (loading_unloading_charges, vehicle_rent, deposit) to udhar_challans and jama_challans

ALTER TABLE udhar_challans ADD COLUMN IF NOT EXISTS loading_unloading_charges NUMERIC DEFAULT 0;
ALTER TABLE udhar_challans ADD COLUMN IF NOT EXISTS vehicle_rent NUMERIC DEFAULT 0;
ALTER TABLE udhar_challans ADD COLUMN IF NOT EXISTS deposit NUMERIC DEFAULT 0;

ALTER TABLE jama_challans ADD COLUMN IF NOT EXISTS loading_unloading_charges NUMERIC DEFAULT 0;
ALTER TABLE jama_challans ADD COLUMN IF NOT EXISTS vehicle_rent NUMERIC DEFAULT 0;
ALTER TABLE jama_challans ADD COLUMN IF NOT EXISTS deposit NUMERIC DEFAULT 0;
