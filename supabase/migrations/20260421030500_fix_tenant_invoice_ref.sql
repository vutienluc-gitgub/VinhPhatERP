-- Migration: Fix tenant_id reference in weaving_confirm
-- Issue: current_tenant_id() returned NULL inside SECURITY DEFINER. Force using v_invoice.tenant_id

CREATE OR REPLACE FUNCTION rpc_confirm_weaving_invoice(p_invoice_id UUID)
  RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_invoice   weaving_invoices%ROWTYPE;
  v_roll      weaving_invoice_rolls%ROWTYPE;
  v_roll_id   UUID;
  v_total_kg  NUMERIC := 0;
BEGIN
  -- Lock invoice
  SELECT * INTO v_invoice
  FROM weaving_invoices
  WHERE id = p_invoice_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVOICE_NOT_FOUND';
  END IF;
  IF v_invoice.status != 'draft' AND v_invoice.status != 'confirmed' THEN
    RAISE EXCEPTION 'INVOICE_NOT_DRAFT: current status is %', v_invoice.status;
  END IF;

  -- Process each roll
  FOR v_roll IN
    SELECT * FROM weaving_invoice_rolls
    WHERE invoice_id = p_invoice_id
    ORDER BY sort_order
  LOOP
    -- Insert into raw_fabric_rolls EXPLICITLY with invoice tenant_id
    -- Add ON CONFLICT DO NOTHING to prevent duplicates if user clicks twice or if previously crashed
    IF v_roll.raw_fabric_roll_id IS NULL THEN
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
        v_invoice.tenant_id
      )
      RETURNING id INTO v_roll_id;

      -- Update line item với roll id
      UPDATE weaving_invoice_rolls
      SET raw_fabric_roll_id = v_roll_id
      WHERE id = v_roll.id;
    END IF;

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

-- Run data repair explicitly inheriting from weaving_invoices
UPDATE raw_fabric_rolls r
SET tenant_id = (
  SELECT w.tenant_id 
  FROM weaving_invoices w 
  JOIN weaving_invoice_rolls wr ON w.id = wr.invoice_id 
  WHERE wr.raw_fabric_roll_id = r.id
)
WHERE r.tenant_id IS NULL OR r.tenant_id = (SELECT id FROM tenants ORDER BY created_at ASC LIMIT 1);
