# Database Setup Instructions

The Supabase database needs to be set up manually. Please follow these steps:

## Step 1: Access Supabase SQL Editor

1. Go to your Supabase project dashboard: https://ruprkyyhsoivloubfyic.supabase.co
2. Navigate to the SQL Editor tab

## Step 2: Run the Following SQL

Copy and paste this SQL into the SQL Editor and execute it:

```sql
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
```

## Step 3: Verify Tables

After running the SQL, verify that all 5 tables are created:
- clients
- udhar_challans
- jama_challans
- udhar_items
- jama_items

## Login Credentials

Use these credentials to login to the application:
- Username: `admin` Password: `admin123`
- Username: `user1` Password: `user123`

## Features

The application includes:
- Bilingual support (Gujarati/English) - toggle in top-right
- Client management with CRUD operations
- Udhar (Issue) challan creation with automatic JPEG receipt generation
- Jama (Return) challan creation with automatic JPEG receipt generation
- All data persists in Supabase
- Responsive design for mobile and desktop
