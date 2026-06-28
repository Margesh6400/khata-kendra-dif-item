/*
  # Create Challan Management System Tables

  ## Overview
  This migration creates a complete database schema for a challan (receipt/invoice) management system
  that handles client information, Udhar (credit/loan) challans, and Jama (collection) challans.

  ## New Tables

  ### 1. clients
  Stores client/customer information
  - `id` (uuid, primary key) - Unique identifier
  - `client_nic_name` (text) - Client NIC or nickname
  - `client_name` (text) - Full client name
  - `site` (text) - Site or location information
  - `primary_phone_number` (text) - Primary contact number
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. udhar_challans
  Stores Udhar (credit/loan) challan records
  - `id` (uuid, primary key) - Unique identifier
  - `udhar_challan_number` (text, unique) - Challan reference number
  - `client_id` (uuid, foreign key) - References clients table
  - `alternative_site` (text, optional) - Override site information
  - `secondary_phone_number` (text, optional) - Alternative phone number
  - `udhar_date` (date) - Date of the Udhar transaction
  - `driver_name` (text, optional) - Name of the driver
  - `created_at` (timestamptz) - Record creation timestamp

  ### 3. udhar_items
  Stores items/products for each Udhar challan
  - `id` (uuid, primary key) - Unique identifier
  - `udhar_challan_number` (text, foreign key) - References udhar_challans
  - `size_1_qty` through `size_9_qty` (integer) - Quantities for 9 different sizes
  - `size_1_borrowed` through `size_9_borrowed` (integer) - Borrowed stock for each size
  - `size_1_note` through `size_9_note` (text) - Notes for each size
  - `main_note` (text) - General notes
  - `created_at` (timestamptz) - Record creation timestamp

  ### 4. jama_challans
  Stores Jama (collection) challan records
  - Same structure as udhar_challans but for Jama transactions

  ### 5. jama_items
  Stores items/products for each Jama challan
  - Same structure as udhar_items but for Jama transactions

  ## Security
  - Row Level Security (RLS) is enabled on all tables
  - Policies allow authenticated users to perform all operations
  - Public access is restricted

  ## Important Notes
  - All tables use UUID primary keys with automatic generation
  - Timestamps are automatically managed with DEFAULT values
  - Foreign key constraints ensure referential integrity
  - Unique constraints prevent duplicate challan numbers
  - All quantity fields default to 0 for easier data entry
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_nic_name text NOT NULL,
  client_name text NOT NULL,
  site text NOT NULL,
  primary_phone_number text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create udhar_challans table
CREATE TABLE IF NOT EXISTS udhar_challans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  udhar_challan_number text UNIQUE NOT NULL,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  alternative_site text,
  secondary_phone_number text,
  udhar_date date NOT NULL,
  driver_name text,
  created_at timestamptz DEFAULT now()
);

-- Create udhar_items table
CREATE TABLE IF NOT EXISTS udhar_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  udhar_challan_number text NOT NULL REFERENCES udhar_challans(udhar_challan_number) ON DELETE CASCADE,
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
  size_1_note text DEFAULT '',
  size_2_note text DEFAULT '',
  size_3_note text DEFAULT '',
  size_4_note text DEFAULT '',
  size_5_note text DEFAULT '',
  size_6_note text DEFAULT '',
  size_7_note text DEFAULT '',
  size_8_note text DEFAULT '',
  size_9_note text DEFAULT '',
  main_note text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create jama_challans table
CREATE TABLE IF NOT EXISTS jama_challans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jama_challan_number text UNIQUE NOT NULL,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  alternative_site text,
  secondary_phone_number text,
  jama_date date NOT NULL,
  driver_name text,
  is_all_return boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create jama_items table
CREATE TABLE IF NOT EXISTS jama_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jama_challan_number text NOT NULL REFERENCES jama_challans(jama_challan_number) ON DELETE CASCADE,
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
  size_1_note text DEFAULT '',
  size_2_note text DEFAULT '',
  size_3_note text DEFAULT '',
  size_4_note text DEFAULT '',
  size_5_note text DEFAULT '',
  size_6_note text DEFAULT '',
  size_7_note text DEFAULT '',
  size_8_note text DEFAULT '',
  size_9_note text DEFAULT '',
  main_note text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_clients_nic_name ON clients(client_nic_name);
CREATE INDEX IF NOT EXISTS idx_udhar_challans_client_id ON udhar_challans(client_id);
CREATE INDEX IF NOT EXISTS idx_udhar_challans_date ON udhar_challans(udhar_date);
CREATE INDEX IF NOT EXISTS idx_udhar_items_challan_number ON udhar_items(udhar_challan_number);
CREATE INDEX IF NOT EXISTS idx_jama_challans_client_id ON jama_challans(client_id);
CREATE INDEX IF NOT EXISTS idx_jama_challans_date ON jama_challans(jama_date);
CREATE INDEX IF NOT EXISTS idx_jama_items_challan_number ON jama_items(jama_challan_number);

-- Enable Row Level Security on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE udhar_challans ENABLE ROW LEVEL SECURITY;
ALTER TABLE udhar_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE jama_challans ENABLE ROW LEVEL SECURITY;
ALTER TABLE jama_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for clients table
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

-- Create RLS policies for udhar_challans table
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

-- Create RLS policies for udhar_items table
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

-- Create RLS policies for jama_challans table
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

-- Create RLS policies for jama_items table
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