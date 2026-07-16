-- 1. Create Plate Sizes table
CREATE TABLE IF NOT EXISTS plate_sizes (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert existing 10 sizes to preserve data
INSERT INTO plate_sizes (id, name, sort_order) VALUES
(1, '2 X 3', 1),
(2, '21 X 3', 2),
(3, '18 X 3', 3),
(4, '15 X 3', 4),
(5, '12 X 3', 5),
(6, '9 X 3', 6),
(7, 'પતરા', 7),
(8, '2 X 2', 8),
(9, '2 ફુટ', 9),
(10, 'Size 10', 10)
ON CONFLICT (id) DO NOTHING;

-- Ensure sequence is synced
SELECT setval('plate_sizes_id_seq', (SELECT MAX(id) FROM plate_sizes));

-- 2. Modify Stock Table (drop check constraint and add foreign key)
-- Find and drop the check constraint dynamically (often named 'stock_size_check' or similar)
DO $$
DECLARE
    con_name TEXT;
BEGIN
    SELECT conname INTO con_name
    FROM pg_constraint
    WHERE conrelid = 'stock'::regclass AND contype = 'c' AND pg_get_expr(conbin, conrelid) LIKE '%size >= 1%';
    
    IF con_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE stock DROP CONSTRAINT ' || con_name;
    END IF;
END $$;

ALTER TABLE stock ADD CONSTRAINT fk_stock_size FOREIGN KEY (size) REFERENCES plate_sizes(id) ON DELETE CASCADE;

-- 3. Add JSONB columns to items tables
ALTER TABLE udhar_items ADD COLUMN items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE jama_items ADD COLUMN items JSONB DEFAULT '[]'::jsonb;

-- 4. Data Migration: Convert 30 columns to JSONB
-- For udhar_items
UPDATE udhar_items SET items = (
    SELECT jsonb_agg(
        jsonb_build_object(
            'size_id', size_id,
            'qty', qty,
            'borrowed', borrowed,
            'note', note
        )
    )
    FROM (
        SELECT 1 AS size_id, size_1_qty AS qty, size_1_borrowed AS borrowed, size_1_note AS note FROM udhar_items u2 WHERE u2.udhar_challan_number = udhar_items.udhar_challan_number
        UNION ALL SELECT 2, size_2_qty, size_2_borrowed, size_2_note FROM udhar_items u2 WHERE u2.udhar_challan_number = udhar_items.udhar_challan_number
        UNION ALL SELECT 3, size_3_qty, size_3_borrowed, size_3_note FROM udhar_items u2 WHERE u2.udhar_challan_number = udhar_items.udhar_challan_number
        UNION ALL SELECT 4, size_4_qty, size_4_borrowed, size_4_note FROM udhar_items u2 WHERE u2.udhar_challan_number = udhar_items.udhar_challan_number
        UNION ALL SELECT 5, size_5_qty, size_5_borrowed, size_5_note FROM udhar_items u2 WHERE u2.udhar_challan_number = udhar_items.udhar_challan_number
        UNION ALL SELECT 6, size_6_qty, size_6_borrowed, size_6_note FROM udhar_items u2 WHERE u2.udhar_challan_number = udhar_items.udhar_challan_number
        UNION ALL SELECT 7, size_7_qty, size_7_borrowed, size_7_note FROM udhar_items u2 WHERE u2.udhar_challan_number = udhar_items.udhar_challan_number
        UNION ALL SELECT 8, size_8_qty, size_8_borrowed, size_8_note FROM udhar_items u2 WHERE u2.udhar_challan_number = udhar_items.udhar_challan_number
        UNION ALL SELECT 9, size_9_qty, size_9_borrowed, size_9_note FROM udhar_items u2 WHERE u2.udhar_challan_number = udhar_items.udhar_challan_number
        UNION ALL SELECT 10, size_10_qty, size_10_borrowed, size_10_note FROM udhar_items u2 WHERE u2.udhar_challan_number = udhar_items.udhar_challan_number
    ) sub
    WHERE (qty > 0 OR borrowed > 0 OR (note IS NOT NULL AND note != ''))
);

-- If items is null, set to empty array
UPDATE udhar_items SET items = '[]'::jsonb WHERE items IS NULL;

-- For jama_items
UPDATE jama_items SET items = (
    SELECT jsonb_agg(
        jsonb_build_object(
            'size_id', size_id,
            'qty', qty,
            'borrowed', borrowed,
            'note', note
        )
    )
    FROM (
        SELECT 1 AS size_id, size_1_qty AS qty, size_1_borrowed AS borrowed, size_1_note AS note FROM jama_items j2 WHERE j2.jama_challan_number = jama_items.jama_challan_number
        UNION ALL SELECT 2, size_2_qty, size_2_borrowed, size_2_note FROM jama_items j2 WHERE j2.jama_challan_number = jama_items.jama_challan_number
        UNION ALL SELECT 3, size_3_qty, size_3_borrowed, size_3_note FROM jama_items j2 WHERE j2.jama_challan_number = jama_items.jama_challan_number
        UNION ALL SELECT 4, size_4_qty, size_4_borrowed, size_4_note FROM jama_items j2 WHERE j2.jama_challan_number = jama_items.jama_challan_number
        UNION ALL SELECT 5, size_5_qty, size_5_borrowed, size_5_note FROM jama_items j2 WHERE j2.jama_challan_number = jama_items.jama_challan_number
        UNION ALL SELECT 6, size_6_qty, size_6_borrowed, size_6_note FROM jama_items j2 WHERE j2.jama_challan_number = jama_items.jama_challan_number
        UNION ALL SELECT 7, size_7_qty, size_7_borrowed, size_7_note FROM jama_items j2 WHERE j2.jama_challan_number = jama_items.jama_challan_number
        UNION ALL SELECT 8, size_8_qty, size_8_borrowed, size_8_note FROM jama_items j2 WHERE j2.jama_challan_number = jama_items.jama_challan_number
        UNION ALL SELECT 9, size_9_qty, size_9_borrowed, size_9_note FROM jama_items j2 WHERE j2.jama_challan_number = jama_items.jama_challan_number
        UNION ALL SELECT 10, size_10_qty, size_10_borrowed, size_10_note FROM jama_items j2 WHERE j2.jama_challan_number = jama_items.jama_challan_number
    ) sub
    WHERE (qty > 0 OR borrowed > 0 OR (note IS NOT NULL AND note != ''))
);
UPDATE jama_items SET items = '[]'::jsonb WHERE items IS NULL;

-- 5. Drop old columns
ALTER TABLE udhar_items
  DROP COLUMN size_1_qty, DROP COLUMN size_2_qty, DROP COLUMN size_3_qty, DROP COLUMN size_4_qty, DROP COLUMN size_5_qty,
  DROP COLUMN size_6_qty, DROP COLUMN size_7_qty, DROP COLUMN size_8_qty, DROP COLUMN size_9_qty, DROP COLUMN size_10_qty,
  DROP COLUMN size_1_borrowed, DROP COLUMN size_2_borrowed, DROP COLUMN size_3_borrowed, DROP COLUMN size_4_borrowed, DROP COLUMN size_5_borrowed,
  DROP COLUMN size_6_borrowed, DROP COLUMN size_7_borrowed, DROP COLUMN size_8_borrowed, DROP COLUMN size_9_borrowed, DROP COLUMN size_10_borrowed,
  DROP COLUMN size_1_note, DROP COLUMN size_2_note, DROP COLUMN size_3_note, DROP COLUMN size_4_note, DROP COLUMN size_5_note,
  DROP COLUMN size_6_note, DROP COLUMN size_7_note, DROP COLUMN size_8_note, DROP COLUMN size_9_note, DROP COLUMN size_10_note;

ALTER TABLE jama_items
  DROP COLUMN size_1_qty, DROP COLUMN size_2_qty, DROP COLUMN size_3_qty, DROP COLUMN size_4_qty, DROP COLUMN size_5_qty,
  DROP COLUMN size_6_qty, DROP COLUMN size_7_qty, DROP COLUMN size_8_qty, DROP COLUMN size_9_qty, DROP COLUMN size_10_qty,
  DROP COLUMN size_1_borrowed, DROP COLUMN size_2_borrowed, DROP COLUMN size_3_borrowed, DROP COLUMN size_4_borrowed, DROP COLUMN size_5_borrowed,
  DROP COLUMN size_6_borrowed, DROP COLUMN size_7_borrowed, DROP COLUMN size_8_borrowed, DROP COLUMN size_9_borrowed, DROP COLUMN size_10_borrowed,
  DROP COLUMN size_1_note, DROP COLUMN size_2_note, DROP COLUMN size_3_note, DROP COLUMN size_4_note, DROP COLUMN size_5_note,
  DROP COLUMN size_6_note, DROP COLUMN size_7_note, DROP COLUMN size_8_note, DROP COLUMN size_9_note, DROP COLUMN size_10_note;

-- 6. Rewrite Stored Procedures

-- Helper stock functions remain exactly the same since they already take a size_id and quantities
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


-- NEW dynamic update_udhar_challan_with_stock
DROP FUNCTION IF EXISTS update_udhar_challan_with_stock(TEXT, UUID, TEXT, TEXT, DATE, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, TEXT);

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
DROP FUNCTION IF EXISTS update_jama_challan_with_stock(TEXT, UUID, TEXT, TEXT, DATE, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, TEXT);

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
DROP FUNCTION IF EXISTS delete_udhar_challan_with_stock(TEXT, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER);

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
DROP FUNCTION IF EXISTS delete_jama_challan_with_stock(TEXT, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER);

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

-- Enable RLS for plate_sizes
ALTER TABLE plate_sizes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select on plate_sizes" ON plate_sizes FOR SELECT USING (true);
CREATE POLICY "Allow public insert on plate_sizes" ON plate_sizes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on plate_sizes" ON plate_sizes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on plate_sizes" ON plate_sizes FOR DELETE USING (true);
