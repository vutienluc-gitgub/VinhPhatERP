-- Update work_order_status enum
ALTER TYPE work_order_status ADD VALUE IF NOT EXISTS 'yarn_issued' AFTER 'draft';

-- Create dyeing_order_status enum
DO $$ BEGIN
    CREATE TYPE dyeing_order_status AS ENUM ('draft', 'sent', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table: dyeing_orders
CREATE TABLE IF NOT EXISTS dyeing_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dyeing_order_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) NOT NULL,
  order_date DATE NOT NULL,
  expected_return_date DATE,
  actual_return_date DATE,
  unit_price_per_kg DECIMAL(12,2) DEFAULT 0,
  total_weight_kg DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(15,2) DEFAULT 0,
  paid_amount DECIMAL(15,2) DEFAULT 0,
  work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
  status dyeing_order_status DEFAULT 'draft',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  tenant_id UUID NOT NULL DEFAULT (current_setting('app.current_tenant_id', true))::uuid
);

-- Table: dyeing_order_items
CREATE TABLE IF NOT EXISTS dyeing_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dyeing_order_id UUID REFERENCES dyeing_orders(id) ON DELETE CASCADE,
  raw_fabric_roll_id UUID REFERENCES raw_fabric_rolls(id) ON DELETE RESTRICT,
  weight_kg DECIMAL(10,2) NOT NULL,
  length_m DECIMAL(10,2),
  color_name VARCHAR(100) NOT NULL,
  color_code VARCHAR(30),
  notes TEXT,
  sort_order INT DEFAULT 0,
  finished_fabric_roll_id UUID REFERENCES finished_fabric_rolls(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  tenant_id UUID NOT NULL DEFAULT (current_setting('app.current_tenant_id', true))::uuid
);

-- Trigger: auto-update totals on item changes
CREATE OR REPLACE FUNCTION update_dyeing_order_totals()
RETURNS TRIGGER AS $$
DECLARE
  target_id UUID;
BEGIN
  target_id := COALESCE(NEW.dyeing_order_id, OLD.dyeing_order_id);
  UPDATE dyeing_orders SET
    total_weight_kg = COALESCE((SELECT SUM(weight_kg) FROM dyeing_order_items WHERE dyeing_order_id = target_id), 0),
    total_amount = COALESCE((SELECT SUM(weight_kg) FROM dyeing_order_items WHERE dyeing_order_id = target_id), 0) * unit_price_per_kg
  WHERE id = target_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_dyeing_order_items_totals ON dyeing_order_items;
CREATE TRIGGER trg_dyeing_order_items_totals
  AFTER INSERT OR UPDATE OR DELETE ON dyeing_order_items
  FOR EACH ROW EXECUTE FUNCTION update_dyeing_order_totals();

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_dyeing_orders_updated_at ON dyeing_orders;
CREATE TRIGGER update_dyeing_orders_updated_at
  BEFORE UPDATE ON dyeing_orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE dyeing_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE dyeing_order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation for dyeing_orders" ON dyeing_orders;
CREATE POLICY "Tenant isolation for dyeing_orders" ON dyeing_orders
  FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

DROP POLICY IF EXISTS "Tenant isolation for dyeing_order_items" ON dyeing_order_items;
CREATE POLICY "Tenant isolation for dyeing_order_items" ON dyeing_order_items
  FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

-- Function to get the next number
CREATE OR REPLACE FUNCTION next_dyeing_order_number()
RETURNS TEXT AS $$
DECLARE
  next_num TEXT;
  prefix TEXT;
BEGIN
  prefix := 'DN' || to_char(CURRENT_DATE, 'YYMM') || '-';

  SELECT dyeing_order_number INTO next_num
  FROM dyeing_orders
  WHERE dyeing_order_number LIKE prefix || '%'
  ORDER BY dyeing_order_number DESC
  LIMIT 1;

  IF next_num IS NULL THEN
    RETURN prefix || '0001';
  ELSE
    RETURN prefix || lpad((substring(next_num FROM length(prefix) + 1)::INT + 1)::TEXT, 4, '0');
  END IF;
END;
$$ LANGUAGE plpgsql;
