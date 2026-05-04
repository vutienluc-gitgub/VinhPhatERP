-- 1. Drop NOT NULL constraint on raw_roll_id
ALTER TABLE finished_fabric_rolls ALTER COLUMN raw_roll_id DROP NOT NULL;

-- 2. Add supplier_id and purchase_price for direct commercial purchases
ALTER TABLE finished_fabric_rolls ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;
ALTER TABLE finished_fabric_rolls ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(15, 2);

-- 3. Update the trigger function to allow NULL raw_roll_id (for direct purchases)
CREATE OR REPLACE FUNCTION fn_finished_fabric_sync_lot() RETURNS trigger AS $$
DECLARE 
  raw_lot text;
BEGIN 
  -- If raw_roll_id is NULL, it's a direct purchase. We don't sync lot from raw.
  IF NEW.raw_roll_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Otherwise, always look up lot_number from the linked raw roll
  SELECT lot_number INTO raw_lot
  FROM raw_fabric_rolls
  WHERE id = NEW.raw_roll_id;

  IF NOT FOUND THEN 
    RAISE EXCEPTION 'Cuộn vải mộc nguồn (raw_roll_id = %) không tồn tại', NEW.raw_roll_id;
  END IF;

  -- Auto-sync lot_number from raw roll
  NEW.lot_number := raw_lot;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
