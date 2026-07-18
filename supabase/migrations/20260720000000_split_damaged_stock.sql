-- Split lost (ગુમ) and damaged (નુકસાન) into separate buckets.
-- lost = gone permanently; damaged = out of circulation but repairable.
-- Stock math is identical for both: on_rent reverses by qty + lost + damaged,
-- total_stock unchanged, available = total - rent - lost_stock - damaged_stock.
-- Existing combined data stays in lost_stock; jama payloads without 'damaged'
-- behave unchanged (COALESCE -> 0).

-- 1. New stock bucket
ALTER TABLE stock ADD COLUMN IF NOT EXISTS damaged_stock INTEGER NOT NULL DEFAULT 0;

-- 2. Allow 'damaged' entries in stock_history (signed quantities, same as 'lost')
ALTER TABLE stock_history DROP CONSTRAINT IF EXISTS stock_history_type_check;
ALTER TABLE stock_history ADD CONSTRAINT stock_history_type_check
  CHECK (type IN ('add', 'remove', 'lost', 'damaged'));

-- 3. Signed damaged_stock adjustment (mirror of adjust_lost_stock).
-- Positive = mark damaged, negative = repaired/recovered back to available.
CREATE OR REPLACE FUNCTION adjust_damaged_stock(p_size INTEGER, p_delta INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE stock
  SET damaged_stock = GREATEST(0, damaged_stock + COALESCE(p_delta, 0)),
      updated_at = NOW()
  WHERE size = p_size;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Size % not found in stock table', p_size;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION adjust_damaged_stock(INTEGER, INTEGER) TO anon, authenticated;

-- 4. Update Jama Challan with stock adjustments (lost + damaged aware)
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
  v_qty INTEGER;
  v_borrowed INTEGER;
  v_lost INTEGER;
  v_damaged INTEGER;
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

  -- Reverse old stock (add back what was returned; un-mark old lost/damaged)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_old_items)
  LOOP
    v_qty := COALESCE((v_item->>'qty')::INTEGER, 0);
    v_borrowed := COALESCE((v_item->>'borrowed')::INTEGER, 0);
    v_lost := COALESCE((v_item->>'lost')::INTEGER, 0);
    v_damaged := COALESCE((v_item->>'damaged')::INTEGER, 0);
    IF v_qty > 0 OR v_borrowed > 0 OR v_lost > 0 OR v_damaged > 0 THEN
      UPDATE stock
      SET
        on_rent_stock = on_rent_stock + v_qty + v_lost + v_damaged,
        borrowed_stock = borrowed_stock + v_borrowed,
        lost_stock = GREATEST(0, lost_stock - v_lost),
        damaged_stock = GREATEST(0, damaged_stock - v_damaged)
      WHERE size = (v_item->>'size_id')::INTEGER;
    END IF;
  END LOOP;

  -- Apply new stock (subtract new return values; mark new lost/damaged)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_new_items)
  LOOP
    v_qty := COALESCE((v_item->>'qty')::INTEGER, 0);
    v_borrowed := COALESCE((v_item->>'borrowed')::INTEGER, 0);
    v_lost := COALESCE((v_item->>'lost')::INTEGER, 0);
    v_damaged := COALESCE((v_item->>'damaged')::INTEGER, 0);
    IF v_qty > 0 OR v_borrowed > 0 OR v_lost > 0 OR v_damaged > 0 THEN
      UPDATE stock
      SET
        on_rent_stock = GREATEST(0, on_rent_stock - v_qty - v_lost - v_damaged),
        borrowed_stock = GREATEST(0, borrowed_stock - v_borrowed),
        lost_stock = lost_stock + v_lost,
        damaged_stock = damaged_stock + v_damaged
      WHERE size = (v_item->>'size_id')::INTEGER;
    END IF;
  END LOOP;

  RETURN json_build_object('success', true, 'message', 'Jama challan updated successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Delete Jama Challan with stock reversal (lost + damaged aware)
CREATE OR REPLACE FUNCTION delete_jama_challan_with_stock(
  p_challan_number TEXT,
  p_items JSONB
)
RETURNS JSON AS $$
DECLARE
  v_item JSONB;
  v_qty INTEGER;
  v_borrowed INTEGER;
  v_lost INTEGER;
  v_damaged INTEGER;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := COALESCE((v_item->>'qty')::INTEGER, 0);
    v_borrowed := COALESCE((v_item->>'borrowed')::INTEGER, 0);
    v_lost := COALESCE((v_item->>'lost')::INTEGER, 0);
    v_damaged := COALESCE((v_item->>'damaged')::INTEGER, 0);
    IF v_qty > 0 OR v_borrowed > 0 OR v_lost > 0 OR v_damaged > 0 THEN
      UPDATE stock
      SET
        on_rent_stock = on_rent_stock + v_qty + v_lost + v_damaged,
        borrowed_stock = borrowed_stock + v_borrowed,
        lost_stock = GREATEST(0, lost_stock - v_lost),
        damaged_stock = GREATEST(0, damaged_stock - v_damaged)
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

GRANT EXECUTE ON FUNCTION update_jama_challan_with_stock TO anon, authenticated;
GRANT EXECUTE ON FUNCTION delete_jama_challan_with_stock TO anon, authenticated;
