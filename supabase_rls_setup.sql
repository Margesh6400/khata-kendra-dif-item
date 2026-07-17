-- =============================================================================
-- KHATA KENDRA - COMPLETE DATABASE SCHEMA, TRIGGERS, RPCs, AND RLS POLICIES
-- RUN THIS ENTIRE QUERY IN THE SUPABASE SQL EDITOR TO SETUP OR RE-CREATE THE DATABASE
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. EXTENSIONS & UTILITIES
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 2. TABLE CREATIONS
-- -----------------------------------------------------------------------------

-- A. Plate Sizes Table
CREATE TABLE IF NOT EXISTS plate_sizes (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL,
  category text DEFAULT 'shuttering' CHECK (category IN ('shuttering', 'jack', 'cuplock', 'other')),
  created_at timestamptz DEFAULT now()
);

-- B. Clients Table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_nic_name text NOT NULL UNIQUE,
  client_name text NOT NULL,
  site text NOT NULL,
  primary_phone_number text NOT NULL,
  daily_rent_price numeric DEFAULT 1.5 NOT NULL,
  jack_rents jsonb DEFAULT '{}'::jsonb NOT NULL,
  is_hidden boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- C. Udhar Challans Table
CREATE TABLE IF NOT EXISTS udhar_challans (
  udhar_challan_number text PRIMARY KEY,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  alternative_site text,
  secondary_phone_number text,
  udhar_date date NOT NULL,
  driver_name text,
  driver_mobile text,
  vehicle_number text,
  created_at timestamptz DEFAULT now()
);

-- Ensure columns exist for existing databases
ALTER TABLE udhar_challans ADD COLUMN IF NOT EXISTS driver_mobile text;
ALTER TABLE udhar_challans ADD COLUMN IF NOT EXISTS vehicle_number text;

-- D. Jama Challans Table
CREATE TABLE IF NOT EXISTS jama_challans (
  jama_challan_number text PRIMARY KEY,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  alternative_site text,
  secondary_phone_number text,
  jama_date date NOT NULL,
  driver_name text,
  driver_mobile text,
  vehicle_number text,
  is_all_return boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Ensure columns exist for existing databases
ALTER TABLE jama_challans ADD COLUMN IF NOT EXISTS driver_mobile text;
ALTER TABLE jama_challans ADD COLUMN IF NOT EXISTS vehicle_number text;

-- E. Udhar Items Table (stores size quantities & notes as JSON)
CREATE TABLE IF NOT EXISTS udhar_items (
  udhar_challan_number text PRIMARY KEY REFERENCES udhar_challans(udhar_challan_number) ON DELETE CASCADE,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  main_note text
);

-- F. Jama Items Table (stores size quantities & notes as JSON)
CREATE TABLE IF NOT EXISTS jama_items (
  jama_challan_number text PRIMARY KEY REFERENCES jama_challans(jama_challan_number) ON DELETE CASCADE,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  main_note text
);

-- G. Stock Table (inherits sizes dynamically)
CREATE TABLE IF NOT EXISTS stock (
  size integer PRIMARY KEY REFERENCES plate_sizes(id) ON DELETE CASCADE,
  total_stock integer DEFAULT 0 NOT NULL CHECK (total_stock >= 0),
  on_rent_stock integer DEFAULT 0 NOT NULL CHECK (on_rent_stock >= 0),
  borrowed_stock integer DEFAULT 0 NOT NULL CHECK (borrowed_stock >= 0),
  lost_stock integer DEFAULT 0 NOT NULL CHECK (lost_stock >= 0),
  updated_at timestamptz DEFAULT now()
);

-- H. Stock History Table
CREATE TABLE IF NOT EXISTS stock_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date timestamptz DEFAULT now() NOT NULL,
  type text CHECK (type IN ('add', 'remove')) NOT NULL,
  party_name text NOT NULL,
  note text,
  amount numeric DEFAULT 0 NOT NULL,
  items jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- I. Bills Table
CREATE TABLE IF NOT EXISTS bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  bill_number varchar(50) UNIQUE NOT NULL,
  billing_date date NOT NULL,
  from_date date NOT NULL,
  to_date date NOT NULL,
  daily_rent decimal(10,2) NOT NULL,
  total_rent_amount decimal(10,2) NOT NULL,
  total_extra_cost decimal(10,2) DEFAULT 0 NOT NULL,
  total_discount decimal(10,2) DEFAULT 0 NOT NULL,
  total_payment decimal(10,2) DEFAULT 0 NOT NULL,
  due_payment decimal(10,2) NOT NULL,
  status varchar(20) DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- J. Bill Extra Costs Table
CREATE TABLE IF NOT EXISTS bill_extra_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_number text REFERENCES bills(bill_number) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  note text NOT NULL,
  pieces integer NOT NULL CHECK (pieces >= 0),
  price_per_piece decimal(10,2) NOT NULL CHECK (price_per_piece >= 0),
  total_amount decimal(10,2) GENERATED ALWAYS AS (pieces * price_per_piece) STORED,
  created_at timestamptz DEFAULT now()
);

-- K. Bill Discounts Table
CREATE TABLE IF NOT EXISTS bill_discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_number text REFERENCES bills(bill_number) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  note text NOT NULL,
  pieces integer NOT NULL CHECK (pieces >= 0),
  discount_per_piece decimal(10,2) NOT NULL CHECK (discount_per_piece >= 0),
  total_amount decimal(10,2) GENERATED ALWAYS AS (pieces * discount_per_piece) STORED,
  created_at timestamptz DEFAULT now()
);

-- L. Bill Payments Table
CREATE TABLE IF NOT EXISTS bill_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_number text REFERENCES bills(bill_number) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  note text,
  amount decimal(10,2) NOT NULL CHECK (amount >= 0),
  payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank')),
  created_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 3. SEED INITIAL BASE SIZES
-- -----------------------------------------------------------------------------
INSERT INTO plate_sizes (id, name, sort_order, category)
VALUES 
  (1, '3x1.5', 1, 'shuttering'),
  (2, '3x2', 2, 'shuttering'),
  (3, '3x2.5', 3, 'shuttering'),
  (4, '3x3', 4, 'shuttering'),
  (5, '2.5x2', 5, 'shuttering'),
  (6, '2x2', 6, 'shuttering'),
  (7, '9x1', 7, 'shuttering'),
  (8, '10x1.5', 8, 'shuttering'),
  (9, '10x2', 9, 'shuttering')
ON CONFLICT (id) DO NOTHING;

-- Seed matching records in stock table
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

-- -----------------------------------------------------------------------------
-- 4. DATABASE INDEXES FOR OPTIMAL SEARCHES & SORTING
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_clients_nic_name ON clients(client_nic_name);
CREATE INDEX IF NOT EXISTS idx_udhar_challans_client_id ON udhar_challans(client_id);
CREATE INDEX IF NOT EXISTS idx_udhar_challans_date ON udhar_challans(udhar_date);
CREATE INDEX IF NOT EXISTS idx_udhar_items_challan ON udhar_items(udhar_challan_number);
CREATE INDEX IF NOT EXISTS idx_jama_challans_client_id ON jama_challans(client_id);
CREATE INDEX IF NOT EXISTS idx_jama_challans_date ON jama_challans(jama_date);
CREATE INDEX IF NOT EXISTS idx_jama_items_challan ON jama_items(jama_challan_number);
CREATE INDEX IF NOT EXISTS idx_bills_client_id ON bills(client_id);
CREATE INDEX IF NOT EXISTS idx_bills_billing_date ON bills(billing_date);
CREATE INDEX IF NOT EXISTS idx_bill_extra_costs_bill ON bill_extra_costs(bill_number);
CREATE INDEX IF NOT EXISTS idx_bill_discounts_bill ON bill_discounts(bill_number);
CREATE INDEX IF NOT EXISTS idx_bill_payments_bill ON bill_payments(bill_number);

-- -----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------

-- Enable RLS on all 12 tables
ALTER TABLE plate_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE udhar_challans ENABLE ROW LEVEL SECURITY;
ALTER TABLE jama_challans ENABLE ROW LEVEL SECURITY;
ALTER TABLE udhar_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE jama_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_extra_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_payments ENABLE ROW LEVEL SECURITY;

-- Allow unrestricted CRUD permissions (authenticated and anonymous users) 
-- to support client-side offline-first operations securely.
CREATE POLICY "Allow all on plate_sizes" ON plate_sizes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on clients" ON clients FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on udhar_challans" ON udhar_challans FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on jama_challans" ON jama_challans FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on udhar_items" ON udhar_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on jama_items" ON jama_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on stock" ON stock FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on stock_history" ON stock_history FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on bills" ON bills FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on bill_extra_costs" ON bill_extra_costs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on bill_discounts" ON bill_discounts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on bill_payments" ON bill_payments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 6. SYSTEM TRIGGERS (Auto-timestamps)
-- -----------------------------------------------------------------------------

-- Trigger Function: Update modified timestamps
CREATE OR REPLACE FUNCTION update_modified_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers
CREATE OR REPLACE TRIGGER update_clients_timestamp
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_timestamp();

CREATE OR REPLACE TRIGGER update_stock_timestamp
  BEFORE UPDATE ON stock
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_timestamp();

CREATE OR REPLACE TRIGGER update_bills_timestamp
  BEFORE UPDATE ON bills
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_timestamp();

-- -----------------------------------------------------------------------------
-- 7. STORED PROCEDURES / RPC FUNCTIONS (Stock & Challan Operations)
-- -----------------------------------------------------------------------------

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
    borrowed_stock = borrowed_stock + COALESCE(p_borrowed_increment, 0)
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
    borrowed_stock = GREATEST(0, borrowed_stock - COALESCE(p_borrowed_decrement, 0))
  WHERE size = p_size;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Size % not found in stock table', p_size;
  END IF;
END;
$$;

-- RPC: Update Udhar Challan with Stock adjustments
CREATE OR REPLACE FUNCTION update_udhar_challan_with_stock(
  p_challan_number TEXT,
  p_client_id UUID,
  p_alternative_site TEXT,
  p_secondary_phone_number TEXT,
  p_udhar_date DATE,
  p_driver_name TEXT,
  p_driver_mobile TEXT,
  p_vehicle_number TEXT,
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
    driver_name = p_driver_name,
    driver_mobile = p_driver_mobile,
    vehicle_number = p_vehicle_number
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

-- RPC: Update Jama Challan with Stock adjustments
CREATE OR REPLACE FUNCTION update_jama_challan_with_stock(
  p_challan_number TEXT,
  p_client_id UUID,
  p_alternative_site TEXT,
  p_secondary_phone_number TEXT,
  p_jama_date DATE,
  p_driver_name TEXT,
  p_driver_mobile TEXT,
  p_vehicle_number TEXT,
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
    driver_name = p_driver_name,
    driver_mobile = p_driver_mobile,
    vehicle_number = p_vehicle_number
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

-- RPC: Delete Udhar Challan with Stock reversal
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

-- RPC: Delete Jama Challan with Stock reversal
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

-- -----------------------------------------------------------------------------
-- 8. GRANT FUNCTION EXECUTION RIGHTS
-- -----------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION increment_stock(INTEGER, INTEGER, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION decrement_stock(INTEGER, INTEGER, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_udhar_challan_with_stock TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_jama_challan_with_stock TO anon, authenticated;
GRANT EXECUTE ON FUNCTION delete_udhar_challan_with_stock TO anon, authenticated;
GRANT EXECUTE ON FUNCTION delete_jama_challan_with_stock TO anon, authenticated;
