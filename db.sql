
-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_nic_name text NOT NULL,
  client_name text NOT NULL,
  site text NOT NULL,
  primary_phone_number text NOT NULL,
  is_hidden boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create udhar_challans table
CREATE TABLE IF NOT EXISTS udhar_challans (
  udhar_challan_number text PRIMARY KEY,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  alternative_site text,
  secondary_phone_number text,
  udhar_date date NOT NULL,
  driver_name text,
  created_at timestamptz DEFAULT now()
);

-- Create jama_challans table
CREATE TABLE IF NOT EXISTS jama_challans (
  jama_challan_number text PRIMARY KEY,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  alternative_site text,
  secondary_phone_number text,
  jama_date date NOT NULL,
  driver_name text,
  created_at timestamptz DEFAULT now()
);

-- Create udhar_items table
CREATE TABLE IF NOT EXISTS udhar_items (
  udhar_challan_number text PRIMARY KEY REFERENCES udhar_challans(udhar_challan_number) ON DELETE CASCADE,
  size_1_qty integer DEFAULT 0,
  size_2_qty integer DEFAULT 0,
  size_3_qty integer DEFAULT 0,
  size_4_qty integer DEFAULT 0,
  size_5_qty integer DEFAULT 0,
  size_6_qty integer DEFAULT 0,
  size_7_qty integer DEFAULT 0,
  size_8_qty integer DEFAULT 0,
  size_9_qty integer DEFAULT 0,
  size_1_borrowed integer DEFAULT 0,
  size_2_borrowed integer DEFAULT 0,
  size_3_borrowed integer DEFAULT 0,
  size_4_borrowed integer DEFAULT 0,
  size_5_borrowed integer DEFAULT 0,
  size_6_borrowed integer DEFAULT 0,
  size_7_borrowed integer DEFAULT 0,
  size_8_borrowed integer DEFAULT 0,
  size_9_borrowed integer DEFAULT 0,
  size_1_note text,
  size_2_note text,
  size_3_note text,
  size_4_note text,
  size_5_note text,
  size_6_note text,
  size_7_note text,
  size_8_note text,
  size_9_note text,
  main_note text
);

-- Create jama_items table
CREATE TABLE IF NOT EXISTS jama_items (
  jama_challan_number text PRIMARY KEY REFERENCES jama_challans(jama_challan_number) ON DELETE CASCADE,
  size_1_qty integer DEFAULT 0,
  size_2_qty integer DEFAULT 0,
  size_3_qty integer DEFAULT 0,
  size_4_qty integer DEFAULT 0,
  size_5_qty integer DEFAULT 0,
  size_6_qty integer DEFAULT 0,
  size_7_qty integer DEFAULT 0,
  size_8_qty integer DEFAULT 0,
  size_9_qty integer DEFAULT 0,
  size_1_borrowed integer DEFAULT 0,
  size_2_borrowed integer DEFAULT 0,
  size_3_borrowed integer DEFAULT 0,
  size_4_borrowed integer DEFAULT 0,
  size_5_borrowed integer DEFAULT 0,
  size_6_borrowed integer DEFAULT 0,
  size_7_borrowed integer DEFAULT 0,
  size_8_borrowed integer DEFAULT 0,
  size_9_borrowed integer DEFAULT 0,
  size_1_note text,
  size_2_note text,
  size_3_note text,
  size_4_note text,
  size_5_note text,
  size_6_note text,
  size_7_note text,
  size_8_note text,
  size_9_note text,
  main_note text
);

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE udhar_challans ENABLE ROW LEVEL SECURITY;
ALTER TABLE jama_challans ENABLE ROW LEVEL SECURITY;
ALTER TABLE udhar_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE jama_items ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since auth is client-side)
CREATE POLICY "Allow all operations on clients"
  ON clients
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on udhar_challans"
  ON udhar_challans
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on jama_challans"
  ON jama_challans
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on udhar_items"
  ON udhar_items
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on jama_items"
  ON jama_items
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
-- ============================================
-- STOCK MANAGEMENT - COMPLETE SUPABASE QUERIES
-- Run these in Supabase SQL Editor
-- ============================================

-- STEP 1: Drop existing table if needed (CAUTION: This will delete all data)
-- DROP TABLE IF EXISTS stock CASCADE;

-- STEP 2: Create stock table
CREATE TABLE IF NOT EXISTS stock (
  size INTEGER PRIMARY KEY CHECK (size >= 1 AND size <= 9),
  total_stock INTEGER DEFAULT 0 NOT NULL CHECK (total_stock >= 0),
  on_rent_stock INTEGER DEFAULT 0 NOT NULL CHECK (on_rent_stock >= 0),
  borrowed_stock INTEGER DEFAULT 0 NOT NULL CHECK (borrowed_stock >= 0),
  lost_stock INTEGER DEFAULT 0 NOT NULL CHECK (lost_stock >= 0),
  updated_at TIMESTAMP
);

-- STEP 3: Insert initial data for all 9 sizes
INSERT INTO stock (size, total_stock, on_rent_stock, borrowed_stock, lost_stock)
VALUES 
  (1, 0, 0, 0, 0),
  (2, 0, 0, 0, 0),
  (3, 0, 0, 0, 0),
  (4, 0, 0, 0, 0),
  (5, 0, 0, 0, 0),
  (6, 0, 0, 0, 0),
  (7, 0, 0, 0, 0),
  (8, 0, 0, 0, 0),
  (9, 0, 0, 0, 0)
ON CONFLICT (size) DO NOTHING;

-- STEP 4: Enable Row Level Security (RLS)
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;

-- STEP 5: Create RLS Policies for public access
-- Policy for SELECT (Read)
CREATE POLICY "Allow public read access to stock"
ON stock
FOR SELECT
TO public
USING (true);

-- Policy for INSERT (Create)
CREATE POLICY "Allow public insert access to stock"
ON stock
FOR INSERT
TO public
WITH CHECK (true);

-- Policy for UPDATE (Update)
CREATE POLICY "Allow public update access to stock"
ON stock
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Policy for DELETE (Delete)
CREATE POLICY "Allow public delete access to stock"
ON stock
FOR DELETE
TO public
USING (true);

-- STEP 6: Create function for incrementing stock (Udhar Challan)
CREATE OR REPLACE FUNCTION increment_stock(
  p_size INTEGER,
  p_on_rent_increment INTEGER DEFAULT 0,
  p_borrowed_increment INTEGER DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE stock
  SET 
    on_rent_stock = on_rent_stock + COALESCE(p_on_rent_increment, 0),
    borrowed_stock = borrowed_stock + COALESCE(p_borrowed_increment, 0),
    updated_at = NOW()
  WHERE size = p_size;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Size % not found in stock table', p_size;
  END IF;
END;
$$;

-- STEP 7: Create function for decrementing stock (Jama Challan)
CREATE OR REPLACE FUNCTION decrement_stock(
  p_size INTEGER,
  p_on_rent_decrement INTEGER DEFAULT 0,
  p_borrowed_decrement INTEGER DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE stock
  SET 
    on_rent_stock = GREATEST(0, on_rent_stock - COALESCE(p_on_rent_decrement, 0)),
    borrowed_stock = GREATEST(0, borrowed_stock - COALESCE(p_borrowed_decrement, 0)),
    updated_at = NOW()
  WHERE size = p_size;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Size % not found in stock table', p_size;
  END IF;
END;
$$;

-- STEP 8: Create trigger to update timestamp
CREATE OR REPLACE FUNCTION update_stock_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER stock_updated_at
BEFORE UPDATE ON stock
FOR EACH ROW
EXECUTE FUNCTION update_stock_timestamp();

-- STEP 9: Grant execute permissions on RPC functions
GRANT EXECUTE ON FUNCTION increment_stock(INTEGER, INTEGER, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION decrement_stock(INTEGER, INTEGER, INTEGER) TO anon, authenticated;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'stock'
ORDER BY ordinal_position;

-- Verify data exists
SELECT * FROM stock ORDER BY size;

-- Verify RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'stock';

-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'stock';

-- ============================================
-- TEST QUERIES
-- ============================================

-- Test 1: Insert test data
UPDATE stock SET total_stock = 100 WHERE size = 1;
UPDATE stock SET total_stock = 50 WHERE size = 2;

-- Test 2: Test increment function (simulating Udhar Challan)
SELECT increment_stock(1, 20, 5);  -- size 1: +20 on_rent, +5 borrowed

-- Test 3: Verify increment worked
SELECT size, total_stock, on_rent_stock, borrowed_stock, lost_stock,
       (total_stock - on_rent_stock - borrowed_stock - lost_stock) as available_stock
FROM stock
WHERE size = 1;

-- Test 4: Test decrement function (simulating Jama Challan)
SELECT decrement_stock(1, 10, 3);  -- size 1: -10 on_rent, -3 borrowed

-- Test 5: Verify decrement worked
SELECT size, total_stock, on_rent_stock, borrowed_stock, lost_stock,
       (total_stock - on_rent_stock - borrowed_stock - lost_stock) as available_stock
FROM stock
WHERE size = 1;

-- Test 6: Get stock overview
SELECT 
  SUM(total_stock) as total_stock,
  SUM(on_rent_stock) as total_on_rent,
  SUM(borrowed_stock) as total_borrowed,
  SUM(lost_stock) as total_lost,
  SUM(total_stock - on_rent_stock - borrowed_stock - lost_stock) as total_available
FROM stock;

-- ============================================
-- USEFUL QUERIES FOR DEBUGGING
-- ============================================

-- Reset all stock to zero (for testing)
UPDATE stock SET 
  total_stock = 0,
  on_rent_stock = 0,
  borrowed_stock = 0,
  lost_stock = 0;

-- Add sample stock data
UPDATE stock SET total_stock = 100 WHERE size IN (1, 2, 3);
UPDATE stock SET total_stock = 75 WHERE size IN (4, 5, 6);
UPDATE stock SET total_stock = 50 WHERE size IN (7, 8, 9);

-- View stock with calculated available
SELECT 
  size,
  total_stock,
  on_rent_stock,
  borrowed_stock,
  lost_stock,
  (total_stock - on_rent_stock - borrowed_stock - lost_stock) as available_stock,
  CASE 
    WHEN (total_stock - on_rent_stock - borrowed_stock - lost_stock) <= 0 THEN 'OUT_OF_STOCK'
    WHEN (total_stock - on_rent_stock - borrowed_stock - lost_stock) <= 10 THEN 'LOW_STOCK'
    ELSE 'IN_STOCK'
  END as stock_status,
  updated_at
FROM stock
ORDER BY size;

-- Check for negative values (should not exist)
SELECT * FROM stock
WHERE on_rent_stock < 0 
   OR borrowed_stock < 0 
   OR lost_stock < 0 
   OR total_stock < 0;
-- ============================================
-- SUPABASE FUNCTIONS FOR CHALLAN CRUD WITH STOCK UPDATES
-- Run these in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. FUNCTION: Update Udhar Challan with Stock Adjustment
-- ============================================

CREATE OR REPLACE FUNCTION update_udhar_challan_with_stock(
  p_challan_number TEXT,
  p_client_id UUID,
  p_alternative_site TEXT,
  p_secondary_phone_number TEXT,
  p_udhar_date DATE,
  p_driver_name TEXT,
  -- Old items data (for stock reversal)
  p_old_size_1_qty INTEGER, p_old_size_1_borrowed INTEGER,
  p_old_size_2_qty INTEGER, p_old_size_2_borrowed INTEGER,
  p_old_size_3_qty INTEGER, p_old_size_3_borrowed INTEGER,
  p_old_size_4_qty INTEGER, p_old_size_4_borrowed INTEGER,
  p_old_size_5_qty INTEGER, p_old_size_5_borrowed INTEGER,
  p_old_size_6_qty INTEGER, p_old_size_6_borrowed INTEGER,
  p_old_size_7_qty INTEGER, p_old_size_7_borrowed INTEGER,
  p_old_size_8_qty INTEGER, p_old_size_8_borrowed INTEGER,
  p_old_size_9_qty INTEGER, p_old_size_9_borrowed INTEGER,
  -- New items data
  p_new_size_1_qty INTEGER, p_new_size_1_borrowed INTEGER, p_new_size_1_note TEXT,
  p_new_size_2_qty INTEGER, p_new_size_2_borrowed INTEGER, p_new_size_2_note TEXT,
  p_new_size_3_qty INTEGER, p_new_size_3_borrowed INTEGER, p_new_size_3_note TEXT,
  p_new_size_4_qty INTEGER, p_new_size_4_borrowed INTEGER, p_new_size_4_note TEXT,
  p_new_size_5_qty INTEGER, p_new_size_5_borrowed INTEGER, p_new_size_5_note TEXT,
  p_new_size_6_qty INTEGER, p_new_size_6_borrowed INTEGER, p_new_size_6_note TEXT,
  p_new_size_7_qty INTEGER, p_new_size_7_borrowed INTEGER, p_new_size_7_note TEXT,
  p_new_size_8_qty INTEGER, p_new_size_8_borrowed INTEGER, p_new_size_8_note TEXT,
  p_new_size_9_qty INTEGER, p_new_size_9_borrowed INTEGER, p_new_size_9_note TEXT,
  p_new_main_note TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Step 1: Reverse old stock (decrement)
  PERFORM decrement_stock(1, p_old_size_1_qty, p_old_size_1_borrowed);
  PERFORM decrement_stock(2, p_old_size_2_qty, p_old_size_2_borrowed);
  PERFORM decrement_stock(3, p_old_size_3_qty, p_old_size_3_borrowed);
  PERFORM decrement_stock(4, p_old_size_4_qty, p_old_size_4_borrowed);
  PERFORM decrement_stock(5, p_old_size_5_qty, p_old_size_5_borrowed);
  PERFORM decrement_stock(6, p_old_size_6_qty, p_old_size_6_borrowed);
  PERFORM decrement_stock(7, p_old_size_7_qty, p_old_size_7_borrowed);
  PERFORM decrement_stock(8, p_old_size_8_qty, p_old_size_8_borrowed);
  PERFORM decrement_stock(9, p_old_size_9_qty, p_old_size_9_borrowed);

  -- Step 2: Update challan
  UPDATE udhar_challans
  SET
    client_id = p_client_id,
    alternative_site = p_alternative_site,
    secondary_phone_number = p_secondary_phone_number,
    udhar_date = p_udhar_date,
    driver_name = p_driver_name
  WHERE udhar_challan_number = p_challan_number;

  -- Step 3: Update items
  UPDATE udhar_items
  SET
    size_1_qty = p_new_size_1_qty,
    size_1_borrowed = p_new_size_1_borrowed,
    size_1_note = p_new_size_1_note,
    size_2_qty = p_new_size_2_qty,
    size_2_borrowed = p_new_size_2_borrowed,
    size_2_note = p_new_size_2_note,
    size_3_qty = p_new_size_3_qty,
    size_3_borrowed = p_new_size_3_borrowed,
    size_3_note = p_new_size_3_note,
    size_4_qty = p_new_size_4_qty,
    size_4_borrowed = p_new_size_4_borrowed,
    size_4_note = p_new_size_4_note,
    size_5_qty = p_new_size_5_qty,
    size_5_borrowed = p_new_size_5_borrowed,
    size_5_note = p_new_size_5_note,
    size_6_qty = p_new_size_6_qty,
    size_6_borrowed = p_new_size_6_borrowed,
    size_6_note = p_new_size_6_note,
    size_7_qty = p_new_size_7_qty,
    size_7_borrowed = p_new_size_7_borrowed,
    size_7_note = p_new_size_7_note,
    size_8_qty = p_new_size_8_qty,
    size_8_borrowed = p_new_size_8_borrowed,
    size_8_note = p_new_size_8_note,
    size_9_qty = p_new_size_9_qty,
    size_9_borrowed = p_new_size_9_borrowed,
    size_9_note = p_new_size_9_note,
    main_note = p_new_main_note
  WHERE udhar_challan_number = p_challan_number;

  -- Step 4: Apply new stock (increment)
  PERFORM increment_stock(1, p_new_size_1_qty, p_new_size_1_borrowed);
  PERFORM increment_stock(2, p_new_size_2_qty, p_new_size_2_borrowed);
  PERFORM increment_stock(3, p_new_size_3_qty, p_new_size_3_borrowed);
  PERFORM increment_stock(4, p_new_size_4_qty, p_new_size_4_borrowed);
  PERFORM increment_stock(5, p_new_size_5_qty, p_new_size_5_borrowed);
  PERFORM increment_stock(6, p_new_size_6_qty, p_new_size_6_borrowed);
  PERFORM increment_stock(7, p_new_size_7_qty, p_new_size_7_borrowed);
  PERFORM increment_stock(8, p_new_size_8_qty, p_new_size_8_borrowed);
  PERFORM increment_stock(9, p_new_size_9_qty, p_new_size_9_borrowed);

  RETURN json_build_object('success', true, 'message', 'Udhar challan updated successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- ============================================
-- 2. FUNCTION: Update Jama Challan with Stock Adjustment
-- ============================================

CREATE OR REPLACE FUNCTION update_jama_challan_with_stock(
  p_challan_number TEXT,
  p_client_id UUID,
  p_alternative_site TEXT,
  p_secondary_phone_number TEXT,
  p_jama_date DATE,
  p_driver_name TEXT,
  -- Old items data (for stock reversal)
  p_old_size_1_qty INTEGER, p_old_size_1_borrowed INTEGER,
  p_old_size_2_qty INTEGER, p_old_size_2_borrowed INTEGER,
  p_old_size_3_qty INTEGER, p_old_size_3_borrowed INTEGER,
  p_old_size_4_qty INTEGER, p_old_size_4_borrowed INTEGER,
  p_old_size_5_qty INTEGER, p_old_size_5_borrowed INTEGER,
  p_old_size_6_qty INTEGER, p_old_size_6_borrowed INTEGER,
  p_old_size_7_qty INTEGER, p_old_size_7_borrowed INTEGER,
  p_old_size_8_qty INTEGER, p_old_size_8_borrowed INTEGER,
  p_old_size_9_qty INTEGER, p_old_size_9_borrowed INTEGER,
  -- New items data
  p_new_size_1_qty INTEGER, p_new_size_1_borrowed INTEGER, p_new_size_1_note TEXT,
  p_new_size_2_qty INTEGER, p_new_size_2_borrowed INTEGER, p_new_size_2_note TEXT,
  p_new_size_3_qty INTEGER, p_new_size_3_borrowed INTEGER, p_new_size_3_note TEXT,
  p_new_size_4_qty INTEGER, p_new_size_4_borrowed INTEGER, p_new_size_4_note TEXT,
  p_new_size_5_qty INTEGER, p_new_size_5_borrowed INTEGER, p_new_size_5_note TEXT,
  p_new_size_6_qty INTEGER, p_new_size_6_borrowed INTEGER, p_new_size_6_note TEXT,
  p_new_size_7_qty INTEGER, p_new_size_7_borrowed INTEGER, p_new_size_7_note TEXT,
  p_new_size_8_qty INTEGER, p_new_size_8_borrowed INTEGER, p_new_size_8_note TEXT,
  p_new_size_9_qty INTEGER, p_new_size_9_borrowed INTEGER, p_new_size_9_note TEXT,
  p_new_main_note TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Step 1: Reverse old stock (increment back for Jama)
  PERFORM increment_stock(1, p_old_size_1_qty, p_old_size_1_borrowed);
  PERFORM increment_stock(2, p_old_size_2_qty, p_old_size_2_borrowed);
  PERFORM increment_stock(3, p_old_size_3_qty, p_old_size_3_borrowed);
  PERFORM increment_stock(4, p_old_size_4_qty, p_old_size_4_borrowed);
  PERFORM increment_stock(5, p_old_size_5_qty, p_old_size_5_borrowed);
  PERFORM increment_stock(6, p_old_size_6_qty, p_old_size_6_borrowed);
  PERFORM increment_stock(7, p_old_size_7_qty, p_old_size_7_borrowed);
  PERFORM increment_stock(8, p_old_size_8_qty, p_old_size_8_borrowed);
  PERFORM increment_stock(9, p_old_size_9_qty, p_old_size_9_borrowed);

  -- Step 2: Update challan
  UPDATE jama_challans
  SET
    client_id = p_client_id,
    alternative_site = p_alternative_site,
    secondary_phone_number = p_secondary_phone_number,
    jama_date = p_jama_date,
    driver_name = p_driver_name
  WHERE jama_challan_number = p_challan_number;

  -- Step 3: Update items
  UPDATE jama_items
  SET
    size_1_qty = p_new_size_1_qty,
    size_1_borrowed = p_new_size_1_borrowed,
    size_1_note = p_new_size_1_note,
    size_2_qty = p_new_size_2_qty,
    size_2_borrowed = p_new_size_2_borrowed,
    size_2_note = p_new_size_2_note,
    size_3_qty = p_new_size_3_qty,
    size_3_borrowed = p_new_size_3_borrowed,
    size_3_note = p_new_size_3_note,
    size_4_qty = p_new_size_4_qty,
    size_4_borrowed = p_new_size_4_borrowed,
    size_4_note = p_new_size_4_note,
    size_5_qty = p_new_size_5_qty,
    size_5_borrowed = p_new_size_5_borrowed,
    size_5_note = p_new_size_5_note,
    size_6_qty = p_new_size_6_qty,
    size_6_borrowed = p_new_size_6_borrowed,
    size_6_note = p_new_size_6_note,
    size_7_qty = p_new_size_7_qty,
    size_7_borrowed = p_new_size_7_borrowed,
    size_7_note = p_new_size_7_note,
    size_8_qty = p_new_size_8_qty,
    size_8_borrowed = p_new_size_8_borrowed,
    size_8_note = p_new_size_8_note,
    size_9_qty = p_new_size_9_qty,
    size_9_borrowed = p_new_size_9_borrowed,
    size_9_note = p_new_size_9_note,
    main_note = p_new_main_note
  WHERE jama_challan_number = p_challan_number;

  -- Step 4: Apply new stock (decrement for Jama)
  PERFORM decrement_stock(1, p_new_size_1_qty, p_new_size_1_borrowed);
  PERFORM decrement_stock(2, p_new_size_2_qty, p_new_size_2_borrowed);
  PERFORM decrement_stock(3, p_new_size_3_qty, p_new_size_3_borrowed);
  PERFORM decrement_stock(4, p_new_size_4_qty, p_new_size_4_borrowed);
  PERFORM decrement_stock(5, p_new_size_5_qty, p_new_size_5_borrowed);
  PERFORM decrement_stock(6, p_new_size_6_qty, p_new_size_6_borrowed);
  PERFORM decrement_stock(7, p_new_size_7_qty, p_new_size_7_borrowed);
  PERFORM decrement_stock(8, p_new_size_8_qty, p_new_size_8_borrowed);
  PERFORM decrement_stock(9, p_new_size_9_qty, p_new_size_9_borrowed);

  RETURN json_build_object('success', true, 'message', 'Jama challan updated successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- ============================================
-- 3. FUNCTION: Delete Udhar Challan with Stock Reversal
-- ============================================

CREATE OR REPLACE FUNCTION delete_udhar_challan_with_stock(
  p_challan_number TEXT,
  p_size_1_qty INTEGER, p_size_1_borrowed INTEGER,
  p_size_2_qty INTEGER, p_size_2_borrowed INTEGER,
  p_size_3_qty INTEGER, p_size_3_borrowed INTEGER,
  p_size_4_qty INTEGER, p_size_4_borrowed INTEGER,
  p_size_5_qty INTEGER, p_size_5_borrowed INTEGER,
  p_size_6_qty INTEGER, p_size_6_borrowed INTEGER,
  p_size_7_qty INTEGER, p_size_7_borrowed INTEGER,
  p_size_8_qty INTEGER, p_size_8_borrowed INTEGER,
  p_size_9_qty INTEGER, p_size_9_borrowed INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Step 1: Reverse stock (decrement for Udhar)
  PERFORM decrement_stock(1, p_size_1_qty, p_size_1_borrowed);
  PERFORM decrement_stock(2, p_size_2_qty, p_size_2_borrowed);
  PERFORM decrement_stock(3, p_size_3_qty, p_size_3_borrowed);
  PERFORM decrement_stock(4, p_size_4_qty, p_size_4_borrowed);
  PERFORM decrement_stock(5, p_size_5_qty, p_size_5_borrowed);
  PERFORM decrement_stock(6, p_size_6_qty, p_size_6_borrowed);
  PERFORM decrement_stock(7, p_size_7_qty, p_size_7_borrowed);
  PERFORM decrement_stock(8, p_size_8_qty, p_size_8_borrowed);
  PERFORM decrement_stock(9, p_size_9_qty, p_size_9_borrowed);

  -- Step 2: Delete items (foreign key constraint)
  DELETE FROM udhar_items WHERE udhar_challan_number = p_challan_number;

  -- Step 3: Delete challan
  DELETE FROM udhar_challans WHERE udhar_challan_number = p_challan_number;

  RETURN json_build_object('success', true, 'message', 'Udhar challan deleted successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- ============================================
-- 4. FUNCTION: Delete Jama Challan with Stock Reversal
-- ============================================

CREATE OR REPLACE FUNCTION delete_jama_challan_with_stock(
  p_challan_number TEXT,
  p_size_1_qty INTEGER, p_size_1_borrowed INTEGER,
  p_size_2_qty INTEGER, p_size_2_borrowed INTEGER,
  p_size_3_qty INTEGER, p_size_3_borrowed INTEGER,
  p_size_4_qty INTEGER, p_size_4_borrowed INTEGER,
  p_size_5_qty INTEGER, p_size_5_borrowed INTEGER,
  p_size_6_qty INTEGER, p_size_6_borrowed INTEGER,
  p_size_7_qty INTEGER, p_size_7_borrowed INTEGER,
  p_size_8_qty INTEGER, p_size_8_borrowed INTEGER,
  p_size_9_qty INTEGER, p_size_9_borrowed INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Step 1: Reverse stock (increment back for Jama)
  PERFORM increment_stock(1, p_size_1_qty, p_size_1_borrowed);
  PERFORM increment_stock(2, p_size_2_qty, p_size_2_borrowed);
  PERFORM increment_stock(3, p_size_3_qty, p_size_3_borrowed);
  PERFORM increment_stock(4, p_size_4_qty, p_size_4_borrowed);
  PERFORM increment_stock(5, p_size_5_qty, p_size_5_borrowed);
  PERFORM increment_stock(6, p_size_6_qty, p_size_6_borrowed);
  PERFORM increment_stock(7, p_size_7_qty, p_size_7_borrowed);
  PERFORM increment_stock(8, p_size_8_qty, p_size_8_borrowed);
  PERFORM increment_stock(9, p_size_9_qty, p_size_9_borrowed);

  -- Step 2: Delete items (foreign key constraint)
  DELETE FROM jama_items WHERE jama_challan_number = p_challan_number;

  -- Step 3: Delete challan
  DELETE FROM jama_challans WHERE jama_challan_number = p_challan_number;

  RETURN json_build_object('success', true, 'message', 'Jama challan deleted successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- ============================================
-- 5. GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION update_udhar_challan_with_stock TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_jama_challan_with_stock TO anon, authenticated;
GRANT EXECUTE ON FUNCTION delete_udhar_challan_with_stock TO anon, authenticated;
GRANT EXECUTE ON FUNCTION delete_jama_challan_with_stock TO anon, authenticated;
-- =============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =============================================================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE udhar_challans ENABLE ROW LEVEL SECURITY;
ALTER TABLE udhar_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE jama_challans ENABLE ROW LEVEL SECURITY;
ALTER TABLE jama_items ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS POLICIES FOR CLIENTS TABLE
-- =============================================================================
CREATE POLICY "Authenticated users can view clients"
  ON clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete clients"
  ON clients FOR DELETE
  TO authenticated
  USING (true);

-- =============================================================================
-- RLS POLICIES FOR UDHAR_CHALLANS TABLE
-- =============================================================================
CREATE POLICY "Authenticated users can view udhar_challans"
  ON udhar_challans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert udhar_challans"
  ON udhar_challans FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update udhar_challans"
  ON udhar_challans FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete udhar_challans"
  ON udhar_challans FOR DELETE
  TO authenticated
  USING (true);

-- =============================================================================
-- RLS POLICIES FOR UDHAR_ITEMS TABLE
-- =============================================================================
CREATE POLICY "Authenticated users can view udhar_items"
  ON udhar_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert udhar_items"
  ON udhar_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update udhar_items"
  ON udhar_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete udhar_items"
  ON udhar_items FOR DELETE
  TO authenticated
  USING (true);

-- =============================================================================
-- RLS POLICIES FOR JAMA_CHALLANS TABLE
-- =============================================================================
CREATE POLICY "Authenticated users can view jama_challans"
  ON jama_challans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert jama_challans"
  ON jama_challans FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update jama_challans"
  ON jama_challans FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete jama_challans"
  ON jama_challans FOR DELETE
  TO authenticated
  USING (true);

-- =============================================================================
-- RLS POLICIES FOR JAMA_ITEMS TABLE
-- =============================================================================
CREATE POLICY "Authenticated users can view jama_items"
  ON jama_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert jama_items"
  ON jama_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update jama_items"
  ON jama_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete jama_items"
  ON jama_items FOR DELETE
  TO authenticated
  USING (true);

CREATE TABLE bills (
  bill_number TEXT PRIMARY KEY,
  client_id UUID REFERENCES clients(id) NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  billing_date DATE DEFAULT CURRENT_DATE NOT NULL,
  daily_rent DECIMAL(10, 2) NOT NULL,
  total_rent_amount DECIMAL(10, 2) NOT NULL,
  total_extra_cost DECIMAL(10, 2) DEFAULT 0,
  total_discount DECIMAL(10, 2) DEFAULT 0,
  total_payment DECIMAL(10, 2) DEFAULT 0,
  due_payment DECIMAL(10, 2) NOT NULL,
  main_note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE bill_extra_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_number TEXT REFERENCES bills(bill_number) ON DELETE CASCADE,
  date DATE NOT NULL,
  note TEXT,
  pieces INTEGER NOT NULL,
  price_per_piece DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) GENERATED ALWAYS AS (pieces * price_per_piece) STORED,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE bill_discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_number TEXT REFERENCES bills(bill_number) ON DELETE CASCADE,
  date DATE NOT NULL,
  note TEXT,
  pieces INTEGER NOT NULL,
  discount_per_piece DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) GENERATED ALWAYS AS (pieces * discount_per_piece) STORED,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE bill_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_number TEXT REFERENCES bills(bill_number) ON DELETE CASCADE,
  date DATE NOT NULL,
  note TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_bills_client_id ON bills(client_id);
CREATE INDEX idx_bills_billing_date ON bills(billing_date);
CREATE INDEX idx_bill_extra_costs_bill_number ON bill_extra_costs(bill_number);
CREATE INDEX idx_bill_discounts_bill_number ON bill_discounts(bill_number);
CREATE INDEX idx_bill_payments_bill_number ON bill_payments(bill_number);
-- Enable RLS
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_extra_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_payments ENABLE ROW LEVEL SECURITY;

-- Public access policies
CREATE POLICY "Allow public read access to bills" ON bills FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert access to bills" ON bills FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update access to bills" ON bills FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete access to bills" ON bills FOR DELETE TO public USING (true);

CREATE POLICY "Allow public read access to bill_extra_costs" ON bill_extra_costs FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert access to bill_extra_costs" ON bill_extra_costs FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update access to bill_extra_costs" ON bill_extra_costs FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete access to bill_extra_costs" ON bill_extra_costs FOR DELETE TO public USING (true);

CREATE POLICY "Allow public read access to bill_discounts" ON bill_discounts FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert access to bill_discounts" ON bill_discounts FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update access to bill_discounts" ON bill_discounts FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete access to bill_discounts" ON bill_discounts FOR DELETE TO public USING (true);

CREATE POLICY "Allow public read access to bill_payments" ON bill_payments FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert access to bill_payments" ON bill_payments FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update access to bill_payments" ON bill_payments FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete access to bill_payments" ON bill_payments FOR DELETE TO public USING (true);
