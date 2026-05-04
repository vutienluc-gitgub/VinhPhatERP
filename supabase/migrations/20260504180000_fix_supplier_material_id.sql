-- Alter supplier_material_prices to use UUID for material_id
ALTER TABLE supplier_material_prices
ALTER COLUMN material_id TYPE UUID USING material_id::uuid;

-- Update rpc_get_supplier_price to accept UUID
DROP FUNCTION IF EXISTS rpc_get_supplier_price(uuid, varchar);

CREATE OR REPLACE FUNCTION rpc_get_supplier_price(
  p_supplier_id UUID,
  p_material_id UUID
)
RETURNS TABLE (
  unit_price NUMERIC(15,2),
  uom VARCHAR,
  moq NUMERIC(10,2),
  lead_time_days INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    smp.unit_price, 
    smp.uom, 
    smp.moq, 
    smp.lead_time_days
  FROM supplier_material_prices smp
  WHERE smp.supplier_id = p_supplier_id 
    AND smp.material_id = p_material_id
    AND smp.is_active = true
    AND smp.valid_from <= CURRENT_DATE
    AND (smp.valid_to IS NULL OR smp.valid_to >= CURRENT_DATE)
    AND smp.tenant_id = (current_setting('app.current_tenant_id', true))::uuid
  ORDER BY smp.valid_from DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;
