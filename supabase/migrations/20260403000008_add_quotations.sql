-- =============================================
-- Migration: Add Quotations feature
-- Covers: quotation_status enum, quotations, quotation_items tables
-- NOTE: 'sale' role added via 20260403000007_add_sale_role.sql
-- =============================================

-- 2. Create quotation_status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quotation_status') THEN
    CREATE TYPE quotation_status AS ENUM (
      'draft',
      'sent',
      'confirmed',
      'rejected',
      'expired',
      'converted'
    );
  END IF;
END
$$;

-- 3. Create quotations table (header)
CREATE TABLE IF NOT EXISTS quotations (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number     text        NOT NULL UNIQUE,
  customer_id          uuid        NOT NULL REFERENCES customers(id),
  quotation_date       date        NOT NULL DEFAULT CURRENT_DATE,
  valid_until          date,
  subtotal             numeric(18,2) NOT NULL DEFAULT 0,
  discount_type        text        NOT NULL DEFAULT 'percent'
    CHECK (discount_type IN ('percent', 'amount')),
  discount_value       numeric(18,2) NOT NULL DEFAULT 0,
  discount_amount      numeric(18,2) NOT NULL DEFAULT 0,
  total_before_vat     numeric(18,2) NOT NULL DEFAULT 0,
  vat_rate             numeric(5,2)  NOT NULL DEFAULT 10,
  vat_amount           numeric(18,2) NOT NULL DEFAULT 0,
  total_amount         numeric(18,2) NOT NULL DEFAULT 0,
  status               quotation_status NOT NULL DEFAULT 'draft',
  revision             smallint    NOT NULL DEFAULT 1,
  parent_quotation_id  uuid        REFERENCES quotations(id),
  converted_order_id   uuid        REFERENCES orders(id),
  delivery_terms       text,
  payment_terms        text,
  notes                text,
  created_by           uuid        REFERENCES profiles(id),
  confirmed_at         timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- 4. Create quotation_items table (line items)
CREATE TABLE IF NOT EXISTS quotation_items (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id      uuid        NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  fabric_type       text        NOT NULL,
  color_name        text,
  color_code        text,
  width_cm          numeric(7,2),
  quantity          numeric(14,3) NOT NULL,
  unit              text        NOT NULL DEFAULT 'm',
  unit_price        numeric(18,2) NOT NULL DEFAULT 0,
  amount            numeric(18,2) GENERATED ALWAYS AS (quantity * unit_price) STORED NOT NULL,
  lead_time_days    smallint,
  notes             text,
  sort_order        smallint    NOT NULL DEFAULT 0
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_quotations_customer ON quotations(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotations_date ON quotations(quotation_date);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_valid_until ON quotations(valid_until);
CREATE INDEX IF NOT EXISTS idx_quotations_parent ON quotations(parent_quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation ON quotation_items(quotation_id);

-- 6. RLS - Enable row-level security
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;

-- Policies for quotations
CREATE POLICY "quotations_select" ON quotations
  FOR SELECT USING (true);

CREATE POLICY "quotations_insert" ON quotations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role::text IN ('admin', 'manager', 'sale')
        AND is_active = true
    )
  );

CREATE POLICY "quotations_update" ON quotations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role::text IN ('admin', 'manager', 'sale')
        AND is_active = true
    )
  );

CREATE POLICY "quotations_delete" ON quotations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'manager')
        AND is_active = true
    )
  );

-- Policies for quotation_items (follow parent)
CREATE POLICY "quotation_items_select" ON quotation_items
  FOR SELECT USING (true);

CREATE POLICY "quotation_items_insert" ON quotation_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role::text IN ('admin', 'manager', 'sale')
        AND is_active = true
    )
  );

CREATE POLICY "quotation_items_update" ON quotation_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role::text IN ('admin', 'manager', 'sale')
        AND is_active = true
    )
  );

CREATE POLICY "quotation_items_delete" ON quotation_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role::text IN ('admin', 'manager', 'sale')
        AND is_active = true
    )
  );

-- 7. Updated_at trigger
CREATE OR REPLACE FUNCTION update_quotation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_quotations_updated_at ON quotations;
CREATE TRIGGER trg_quotations_updated_at
  BEFORE UPDATE ON quotations
  FOR EACH ROW
  EXECUTE FUNCTION update_quotation_updated_at();
