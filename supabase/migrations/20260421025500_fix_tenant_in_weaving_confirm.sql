-- Migration: Fix tenant_id missing during raw_fabric_rolls auto-insertion
-- Issue: SECURITY DEFINER bypasses RLS default tenant_id logic causing invisible rolls

CREATE OR REPLACE FUNCTION rpc_confirm_weaving_invoice(p_invoice_id UUID)
  RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_invoice   weaving_invoices%ROWTYPE;
  v_roll      weaving_invoice_rolls%ROWTYPE;
  v_roll_id   UUID;
  v_total_kg  NUMERIC := 0;
  v_tenant    UUID := current_tenant_id();
BEGIN
  -- Lock invoice
  SELECT * INTO v_invoice
  FROM weaving_invoices
  WHERE id = p_invoice_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVOICE_NOT_FOUND';
  END IF;
  IF v_invoice.status != 'draft' THEN
    RAISE EXCEPTION 'INVOICE_NOT_DRAFT: current status is %', v_invoice.status;
  END IF;

  -- Process each roll
  FOR v_roll IN
    SELECT * FROM weaving_invoice_rolls
    WHERE invoice_id = p_invoice_id
    ORDER BY sort_order
  LOOP
    -- Insert into raw_fabric_rolls EXPLICITLY with tenant_id
    INSERT INTO raw_fabric_rolls (
      roll_number, fabric_type, weight_kg, length_m,
      quality_grade, warehouse_location, lot_number,
      status, weaving_partner_id, notes, production_date, tenant_id
    ) VALUES (
      v_roll.roll_number,
      v_invoice.fabric_type,
      v_roll.weight_kg,
      v_roll.length_m,
      v_roll.quality_grade,
      v_roll.warehouse_location,
      v_roll.lot_number,
      'in_stock',
      v_invoice.supplier_id,
      v_roll.notes,
      v_invoice.invoice_date,
      v_tenant
    )
    RETURNING id INTO v_roll_id;

    -- Update line item với roll id
    UPDATE weaving_invoice_rolls
    SET raw_fabric_roll_id = v_roll_id
    WHERE id = v_roll.id;

    v_total_kg := v_total_kg + v_roll.weight_kg;
  END LOOP;

  -- Recalculate totals and confirm
  UPDATE weaving_invoices
  SET
    total_weight_kg = v_total_kg,
    total_amount    = v_total_kg * unit_price_per_kg,
    status          = 'confirmed',
    updated_at      = now()
  WHERE id = p_invoice_id;
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_confirm_weaving_invoice(UUID) TO authenticated;

-- Fix any previous orphaned records specifically for raw_fabric_rolls
DO $$
DECLARE
  v_default_tenant UUID;
BEGIN
  SELECT id INTO v_default_tenant FROM tenants LIMIT 1;
  IF v_default_tenant IS NOT NULL THEN
    UPDATE raw_fabric_rolls SET tenant_id = v_default_tenant WHERE tenant_id IS NULL;
  END IF;
END $$;
