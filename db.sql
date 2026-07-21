
-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_nic_name text NOT NULL,
  client_name text NOT NULL,
  site text NOT NULL,
  primary_phone_number text NOT NULL,
  previous_pending_amount numeric DEFAULT 0 NOT NULL,
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
  is_all_return boolean DEFAULT false NOT NULL,
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
  size_10_qty integer DEFAULT 0,
  size_1_borrowed integer DEFAULT 0,
  size_2_borrowed integer DEFAULT 0,
  size_3_borrowed integer DEFAULT 0,
  size_4_borrowed integer DEFAULT 0,
  size_5_borrowed integer DEFAULT 0,
  size_6_borrowed integer DEFAULT 0,
  size_7_borrowed integer DEFAULT 0,
  size_8_borrowed integer DEFAULT 0,
  size_9_borrowed integer DEFAULT 0,
  size_10_borrowed integer DEFAULT 0,
  size_1_note text,
  size_2_note text,
  size_3_note text,
  size_4_note text,
  size_5_note text,
  size_6_note text,
  size_7_note text,
  size_8_note text,
  size_9_note text,
  size_10_note text,
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
  size_10_qty integer DEFAULT 0,
  size_1_borrowed integer DEFAULT 0,
  size_2_borrowed integer DEFAULT 0,
  size_3_borrowed integer DEFAULT 0,
  size_4_borrowed integer DEFAULT 0,
  size_5_borrowed integer DEFAULT 0,
  size_6_borrowed integer DEFAULT 0,
  size_7_borrowed integer DEFAULT 0,
  size_8_borrowed integer DEFAULT 0,
  size_9_borrowed integer DEFAULT 0,
  size_10_borrowed integer DEFAULT 0,
  size_1_note text,
  size_2_note text,
  size_3_note text,
  size_4_note text,
  size_5_note text,
  size_6_note text,
  size_7_note text,
  size_8_note text,
  size_9_note text,
  size_10_note text,
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
  size integer PRIMARY KEY REFERENCES plate_sizes(id) ON DELETE CASCADE,
  total_stock integer DEFAULT 0 NOT NULL CHECK (total_stock >= 0),
  on_rent_stock integer DEFAULT 0 NOT NULL CHECK (on_rent_stock >= 0),
  borrowed_stock integer DEFAULT 0 NOT NULL CHECK (borrowed_stock >= 0),
  lost_stock integer DEFAULT 0 NOT NULL CHECK (lost_stock >= 0),
  updated_at timestamp DEFAULT now()
);

-- G. Stock History Table
CREATE TABLE IF NOT EXISTS stock_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date timestamptz DEFAULT now(),
  type text CHECK (type IN ('add', 'remove')) NOT NULL,
  party_name text,
  note text,
  amount numeric DEFAULT 0,
  items jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- H. Bills Table
CREATE TABLE IF NOT EXISTS bills (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  bill_number varchar(50) UNIQUE NOT NULL,
  billdate date NOT NULL,
  from_date date NOT NULL,
  to_date date NOT NULL,
  daily_rent decimal(10,2) NOT NULL,
  total_rent decimal(10,2) NOT NULL,
  extra_costs_total decimal(10,2) DEFAULT 0,
  discounts_total decimal(10,2) DEFAULT 0,
  grand_total decimal(10,2) NOT NULL,
  total_paid decimal(10,2) DEFAULT 0,
  due_payment decimal(10,2) NOT NULL,
  status varchar(20) DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- I. Bill Extra Costs Table
CREATE TABLE IF NOT EXISTS bill_extra_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_number text REFERENCES bills(bill_number) ON DELETE CASCADE,
  date date NOT NULL,
  note text,
  pieces integer NOT NULL,
  price_per_piece decimal(10,2) NOT NULL,
  total_amount decimal(10,2) GENERATED ALWAYS AS (pieces * price_per_piece) STORED,
  created_at timestamp DEFAULT now()
);

-- J. Bill Discounts Table
CREATE TABLE IF NOT EXISTS bill_discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_number text REFERENCES bills(bill_number) ON DELETE CASCADE,
  date date NOT NULL,
  note text,
  pieces integer NOT NULL,
  discount_per_piece decimal(10,2) NOT NULL,
  total_amount decimal(10,2) GENERATED ALWAYS AS (pieces * discount_per_piece) STORED,
  created_at timestamp DEFAULT now()
);

-- K. Bill Payments Table
CREATE TABLE IF NOT EXISTS bill_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_number text REFERENCES bills(bill_number) ON DELETE CASCADE,
  date date NOT NULL,
  note text,
  amount decimal(10,2) NOT NULL,
  payment_method text,
  created_at timestamp DEFAULT now()
);

-- =============================================================================
-- 3. SEED INITIAL STOCK DATA
-- =============================================================================
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

-- =============================================================================
-- 4. CREATE DATABASE INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_clients_nic_name ON clients(client_nic_name);
CREATE INDEX IF NOT EXISTS idx_udhar_challans_client_id ON udhar_challans(client_id);
CREATE INDEX IF NOT EXISTS idx_udhar_challans_date ON udhar_challans(udhar_date);
CREATE INDEX IF NOT EXISTS idx_udhar_items_challan_number ON udhar_items(udhar_challan_number);
CREATE INDEX IF NOT EXISTS idx_jama_challans_client_id ON jama_challans(client_id);
CREATE INDEX IF NOT EXISTS idx_jama_challans_date ON jama_challans(jama_date);
CREATE INDEX IF NOT EXISTS idx_jama_items_challan_number ON jama_items(jama_challan_number);
CREATE INDEX IF NOT EXISTS idx_bills_client_id ON bills(client_id);
CREATE INDEX IF NOT EXISTS idx_bills_billdate ON bills(billdate);
CREATE INDEX IF NOT EXISTS idx_bill_extra_costs_bill_number ON bill_extra_costs(bill_number);
CREATE INDEX IF NOT EXISTS idx_bill_discounts_bill_number ON bill_discounts(bill_number);
CREATE INDEX IF NOT EXISTS idx_bill_payments_bill_number ON bill_payments(bill_number);

-- =============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE udhar_challans ENABLE ROW LEVEL SECURITY;
ALTER TABLE udhar_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE jama_challans ENABLE ROW LEVEL SECURITY;
ALTER TABLE jama_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_extra_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE jama_challans ADD COLUMN IF NOT EXISTS is_all_return boolean DEFAULT false NOT NULL;


-- Allow unrestricted CRUD permissions (authenticated and anonymous users) 
-- to support client-side operations securely.
CREATE POLICY "Allow all on clients" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on udhar_challans" ON udhar_challans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on udhar_items" ON udhar_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on jama_challans" ON jama_challans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on jama_items" ON jama_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on stock" ON stock FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on stock_history" ON stock_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on bills" ON bills FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on bill_extra_costs" ON bill_extra_costs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on bill_discounts" ON bill_discounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on bill_payments" ON bill_payments FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- 6. SYSTEM TRIGGERS (Auto-timestamps)
-- =============================================================================

-- Trigger Function: Update bills updated_at column
CREATE OR REPLACE FUNCTION update_bills_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bills_updated_at
    BEFORE UPDATE ON bills
    FOR EACH ROW
    EXECUTE FUNCTION update_bills_updated_at();

-- Trigger Function: Update stock updated_at column
CREATE OR REPLACE FUNCTION update_stock_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER stock_updated_at
    BEFORE UPDATE ON stock
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_timestamp();

-- =============================================================================
-- 7. STORED PROCEDURES / RPC FUNCTIONS (Stock & Challan Operations)
-- =============================================================================

-- RPC: Increment Stock (Udhar Transaction)
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

-- RPC: Decrement Stock (Jama Transaction)
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

-- RPC: Update Udhar Challan with Stock adjustments


-- RPC: Update Jama Challan with Stock adjustments


-- RPC: Delete Udhar Challan with Stock reversal (decrements from stock)


-- RPC: Delete Jama Challan with Stock reversal (adds back to stock)


-- =============================================================================
-- 8. GRANT FUNCTION EXECUTION RIGHTS
-- =============================================================================
GRANT EXECUTE ON FUNCTION increment_stock(INTEGER, INTEGER, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION decrement_stock(INTEGER, INTEGER, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_udhar_challan_with_stock TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_jama_challan_with_stock TO anon, authenticated;
GRANT EXECUTE ON FUNCTION delete_udhar_challan_with_stock TO anon, authenticated;
GRANT EXECUTE ON FUNCTION delete_jama_challan_with_stock TO anon, authenticated;



-- NEW dynamic update_udhar_challan_with_stock
CREATE OR REPLACE FUNCTION update_udhar_challan_with_stock(
  p_challan_number TEXT,
  p_client_id UUID,
  p_alternative_site TEXT,
  p_secondary_phone_number TEXT,
  p_udhar_date DATE,
  p_driver_name TEXT,
  p_old_items JSONB,
  p_new_items JSONB,
  p_new_main_note TEXT
)
RETURNS JSON AS $$
DECLARE
  v_item JSONB;
BEGIN
  -- Update challan details
  UPDATE udhar_challans
  SET
    client_id = p_client_id,
    alternative_site = p_alternative_site,
    secondary_phone_number = p_secondary_phone_number,
    udhar_date = p_udhar_date,
    driver_name = p_driver_name
  WHERE udhar_challan_number = p_challan_number;

  -- Update items details
  UPDATE udhar_items
  SET
    items = p_new_items,
    main_note = p_new_main_note
  WHERE udhar_challan_number = p_challan_number;

  -- Reverse old stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_old_items)
  LOOP
    IF (v_item->>'qty')::INTEGER > 0 OR (v_item->>'borrowed')::INTEGER > 0 THEN
      UPDATE stock
      SET
        on_rent_stock = GREATEST(0, on_rent_stock - COALESCE((v_item->>'qty')::INTEGER, 0)),
        borrowed_stock = GREATEST(0, borrowed_stock - COALESCE((v_item->>'borrowed')::INTEGER, 0))
      WHERE size = (v_item->>'size_id')::INTEGER;
    END IF;
  END LOOP;

  -- Apply new stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_new_items)
  LOOP
    IF (v_item->>'qty')::INTEGER > 0 OR (v_item->>'borrowed')::INTEGER > 0 THEN
      UPDATE stock
      SET
        on_rent_stock = on_rent_stock + COALESCE((v_item->>'qty')::INTEGER, 0),
        borrowed_stock = borrowed_stock + COALESCE((v_item->>'borrowed')::INTEGER, 0)
      WHERE size = (v_item->>'size_id')::INTEGER;
    END IF;
  END LOOP;

  RETURN json_build_object('success', true, 'message', 'Udhar challan updated successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- NEW dynamic update_jama_challan_with_stock
CREATE OR REPLACE FUNCTION update_jama_challan_with_stock(
  p_challan_number TEXT,
  p_client_id UUID,
  p_alternative_site TEXT,
  p_secondary_phone_number TEXT,
  p_jama_date DATE,
  p_driver_name TEXT,
  p_old_items JSONB,
  p_new_items JSONB,
  p_new_main_note TEXT
)
RETURNS JSON AS $$
DECLARE
  v_item JSONB;
BEGIN
  -- Update challan details
  UPDATE jama_challans
  SET
    client_id = p_client_id,
    alternative_site = p_alternative_site,
    secondary_phone_number = p_secondary_phone_number,
    jama_date = p_jama_date,
    driver_name = p_driver_name
  WHERE jama_challan_number = p_challan_number;

  -- Update items details
  UPDATE jama_items
  SET
    items = p_new_items,
    main_note = p_new_main_note
  WHERE jama_challan_number = p_challan_number;

  -- Reverse old stock (Add back what was returned)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_old_items)
  LOOP
    IF (v_item->>'qty')::INTEGER > 0 OR (v_item->>'borrowed')::INTEGER > 0 THEN
      UPDATE stock
      SET
        on_rent_stock = on_rent_stock + COALESCE((v_item->>'qty')::INTEGER, 0),
        borrowed_stock = borrowed_stock + COALESCE((v_item->>'borrowed')::INTEGER, 0)
      WHERE size = (v_item->>'size_id')::INTEGER;
    END IF;
  END LOOP;

  -- Apply new stock (Subtract new return values)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_new_items)
  LOOP
    IF (v_item->>'qty')::INTEGER > 0 OR (v_item->>'borrowed')::INTEGER > 0 THEN
      UPDATE stock
      SET
        on_rent_stock = GREATEST(0, on_rent_stock - COALESCE((v_item->>'qty')::INTEGER, 0)),
        borrowed_stock = GREATEST(0, borrowed_stock - COALESCE((v_item->>'borrowed')::INTEGER, 0))
      WHERE size = (v_item->>'size_id')::INTEGER;
    END IF;
  END LOOP;

  RETURN json_build_object('success', true, 'message', 'Jama challan updated successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- NEW delete_udhar_challan_with_stock
CREATE OR REPLACE FUNCTION delete_udhar_challan_with_stock(
  p_challan_number TEXT,
  p_items JSONB
)
RETURNS JSON AS $$
DECLARE
  v_item JSONB;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF (v_item->>'qty')::INTEGER > 0 OR (v_item->>'borrowed')::INTEGER > 0 THEN
      UPDATE stock
      SET
        on_rent_stock = GREATEST(0, on_rent_stock - COALESCE((v_item->>'qty')::INTEGER, 0)),
        borrowed_stock = GREATEST(0, borrowed_stock - COALESCE((v_item->>'borrowed')::INTEGER, 0))
      WHERE size = (v_item->>'size_id')::INTEGER;
    END IF;
  END LOOP;

  DELETE FROM udhar_challans WHERE udhar_challan_number = p_challan_number;

  RETURN json_build_object('success', true, 'message', 'Udhar challan deleted successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- NEW delete_jama_challan_with_stock
CREATE OR REPLACE FUNCTION delete_jama_challan_with_stock(
  p_challan_number TEXT,
  p_items JSONB
)
RETURNS JSON AS $$
DECLARE
  v_item JSONB;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF (v_item->>'qty')::INTEGER > 0 OR (v_item->>'borrowed')::INTEGER > 0 THEN
      UPDATE stock
      SET
        on_rent_stock = on_rent_stock + COALESCE((v_item->>'qty')::INTEGER, 0),
        borrowed_stock = borrowed_stock + COALESCE((v_item->>'borrowed')::INTEGER, 0)
      WHERE size = (v_item->>'size_id')::INTEGER;
    END IF;
  END LOOP;

  DELETE FROM jama_challans WHERE jama_challan_number = p_challan_number;

  RETURN json_build_object('success', true, 'message', 'Jama challan deleted successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
