-- 20260624000001_inventory_adjustments_enhancement.sql

-- 1. Add new columns and rename quantity_delta
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'inventory_adjustments' 
      AND column_name = 'quantity_delta'
  ) THEN
    ALTER TABLE public.inventory_adjustments RENAME COLUMN quantity_delta TO adjustment_qty;
  END IF;
END $$;

ALTER TABLE public.inventory_adjustments
  ADD COLUMN IF NOT EXISTS before_qty numeric(14,3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS after_qty numeric(14,3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'APPROVED' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'));

-- 2. Convert adjustment_type to TEXT to avoid ENUM issues, and allow custom types like PHYSICAL_COUNT
ALTER TABLE public.inventory_adjustments ALTER COLUMN adjustment_type TYPE text USING adjustment_type::text;
DROP TYPE IF EXISTS adjustment_type;

-- 3. Restrict inventory_adjustments to INSERT ONLY
-- Drop any existing UPDATE/DELETE policies if they exist.
DROP POLICY IF EXISTS "Staff can update inventory_adjustments" ON public.inventory_adjustments;
DROP POLICY IF EXISTS "Staff can delete inventory_adjustments" ON public.inventory_adjustments;
DROP POLICY IF EXISTS "Admin can delete inventory_adjustments" ON public.inventory_adjustments;

-- 4. Create rpc_adjust_inventory function
CREATE OR REPLACE FUNCTION public.rpc_adjust_inventory(
  p_item_type text,         -- 'yarn', 'raw_fabric', 'finished_fabric'
  p_item_id uuid,           -- the roll id or yarn receipt item id
  p_adjustment_type text,   -- 'PHYSICAL_COUNT', 'DAMAGE', etc.
  p_adjustment_qty numeric, -- signed number (-10, +5)
  p_reason text,
  p_notes text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_before_qty numeric := 0;
  v_after_qty numeric := 0;
  v_tenant_id uuid;
  v_adj_id uuid;
BEGIN
  -- Validate
  IF p_adjustment_qty = 0 THEN
    RAISE EXCEPTION 'Adjustment quantity cannot be zero';
  END IF;

  -- Get current stock based on item type
  IF p_item_type = 'raw_fabric' THEN
    SELECT length_m, tenant_id INTO v_before_qty, v_tenant_id
    FROM public.raw_fabric_rolls
    WHERE id = p_item_id FOR UPDATE;

    IF NOT FOUND THEN RAISE EXCEPTION 'Raw fabric roll not found'; END IF;

  ELSIF p_item_type = 'finished_fabric' THEN
    SELECT length_m, tenant_id INTO v_before_qty, v_tenant_id
    FROM public.finished_fabric_rolls
    WHERE id = p_item_id FOR UPDATE;
    
    IF NOT FOUND THEN RAISE EXCEPTION 'Finished fabric roll not found'; END IF;

  ELSIF p_item_type = 'yarn' THEN
    SELECT available_weight_kg, tenant_id INTO v_before_qty, v_tenant_id
    FROM public.yarn_receipt_items
    WHERE id = p_item_id FOR UPDATE;
    
    IF NOT FOUND THEN RAISE EXCEPTION 'Yarn receipt item not found'; END IF;
  ELSE
    RAISE EXCEPTION 'Invalid item_type. Must be raw_fabric, finished_fabric, or yarn.';
  END IF;

  -- Calculate after_qty
  v_after_qty := v_before_qty + p_adjustment_qty;

  -- Validate Negative Stock
  IF v_after_qty < 0 THEN
    RAISE EXCEPTION 'Stock cannot go below zero. Current stock: %, Adjustment: %', v_before_qty, p_adjustment_qty;
  END IF;

  -- Do the update
  IF p_item_type = 'raw_fabric' THEN
    UPDATE public.raw_fabric_rolls SET length_m = v_after_qty WHERE id = p_item_id;
  ELSIF p_item_type = 'finished_fabric' THEN
    UPDATE public.finished_fabric_rolls SET length_m = v_after_qty WHERE id = p_item_id;
  ELSIF p_item_type = 'yarn' THEN
    UPDATE public.yarn_receipt_items SET available_weight_kg = v_after_qty WHERE id = p_item_id;
  END IF;

  -- Insert Audit Log
  INSERT INTO public.inventory_adjustments (
    tenant_id,
    item_type,
    reference_id,
    adjustment_type,
    before_qty,
    adjustment_qty,
    after_qty,
    reason,
    notes,
    status,
    created_by
  ) VALUES (
    v_tenant_id,
    p_item_type::inventory_item_type,
    p_item_id,
    p_adjustment_type,
    v_before_qty,
    p_adjustment_qty,
    v_after_qty,
    p_reason,
    p_notes,
    'APPROVED',
    auth.uid()
  ) RETURNING id INTO v_adj_id;

  RETURN v_adj_id;
END;
$$;
