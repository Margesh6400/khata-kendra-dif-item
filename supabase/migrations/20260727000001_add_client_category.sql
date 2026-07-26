-- Migration: Add category column to clients table for business category client separation

ALTER TABLE clients ADD COLUMN IF NOT EXISTS category text DEFAULT 'shuttering';
