-- Migration: Create bill_extra_costs, bill_discounts, and bill_payments tables with RLS policies

-- 1. Bill Extra Costs Table
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

-- 2. Bill Discounts Table
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

-- 3. Bill Payments Table
CREATE TABLE IF NOT EXISTS bill_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_number text REFERENCES bills(bill_number) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  note text,
  amount decimal(10,2) NOT NULL CHECK (amount >= 0),
  payment_method text DEFAULT 'cash',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS & create public policies
ALTER TABLE bill_extra_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to bill_extra_costs" ON bill_extra_costs;
CREATE POLICY "Allow all access to bill_extra_costs" ON bill_extra_costs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to bill_discounts" ON bill_discounts;
CREATE POLICY "Allow all access to bill_discounts" ON bill_discounts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to bill_payments" ON bill_payments;
CREATE POLICY "Allow all access to bill_payments" ON bill_payments FOR ALL USING (true) WITH CHECK (true);
