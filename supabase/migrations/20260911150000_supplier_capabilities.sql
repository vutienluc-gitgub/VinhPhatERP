-- 1. Create table supplier_capabilities
CREATE TABLE IF NOT EXISTS supplier_capabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    capability_code VARCHAR(50) NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(supplier_id, capability_code)
);

CREATE INDEX IF NOT EXISTS idx_supplier_capabilities_lookup 
ON supplier_capabilities(capability_code, is_verified);

CREATE INDEX IF NOT EXISTS idx_supplier_capabilities_supplier_id 
ON supplier_capabilities(supplier_id);

-- 2. RLS Policies
ALTER TABLE supplier_capabilities ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow read access to all authenticated" ON supplier_capabilities;
    CREATE POLICY "Allow read access to all authenticated" ON supplier_capabilities
        FOR SELECT TO authenticated USING (true);
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Allow manage to internal users" ON supplier_capabilities;
    CREATE POLICY "Allow manage to internal users" ON supplier_capabilities
        FOR ALL TO authenticated USING (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                  AND role <> 'customer'::user_role
            )
        );
END $$;

-- 3. Data Backfill for existing suppliers based on their category
-- YARN -> SUPPLY_YARN
INSERT INTO supplier_capabilities (supplier_id, tenant_id, capability_code, is_verified)
SELECT id, tenant_id, 'SUPPLY_YARN', true FROM suppliers WHERE category = 'YARN'
ON CONFLICT (supplier_id, capability_code) DO NOTHING;

-- GREIGE -> SUPPLY_GREIGE & WEAVING
INSERT INTO supplier_capabilities (supplier_id, tenant_id, capability_code, is_verified)
SELECT id, tenant_id, 'SUPPLY_GREIGE', true FROM suppliers WHERE category = 'GREIGE'
ON CONFLICT (supplier_id, capability_code) DO NOTHING;

INSERT INTO supplier_capabilities (supplier_id, tenant_id, capability_code, is_verified)
SELECT id, tenant_id, 'WEAVING', true FROM suppliers WHERE category = 'GREIGE'
ON CONFLICT (supplier_id, capability_code) DO NOTHING;

-- OUTSOURCING -> WEAVING & DYEING
INSERT INTO supplier_capabilities (supplier_id, tenant_id, capability_code, is_verified)
SELECT id, tenant_id, 'WEAVING', true FROM suppliers WHERE category = 'OUTSOURCING'
ON CONFLICT (supplier_id, capability_code) DO NOTHING;

INSERT INTO supplier_capabilities (supplier_id, tenant_id, capability_code, is_verified)
SELECT id, tenant_id, 'DYEING', true FROM suppliers WHERE category = 'OUTSOURCING'
ON CONFLICT (supplier_id, capability_code) DO NOTHING;

-- FINISHED_FABRIC -> SUPPLY_FINISHED_FABRIC
INSERT INTO supplier_capabilities (supplier_id, tenant_id, capability_code, is_verified)
SELECT id, tenant_id, 'SUPPLY_FINISHED_FABRIC', true FROM suppliers WHERE category = 'FINISHED_FABRIC'
ON CONFLICT (supplier_id, capability_code) DO NOTHING;

-- CHEMICAL -> SUPPLY_CHEMICAL
INSERT INTO supplier_capabilities (supplier_id, tenant_id, capability_code, is_verified)
SELECT id, tenant_id, 'SUPPLY_CHEMICAL', true FROM suppliers WHERE category = 'CHEMICAL'
ON CONFLICT (supplier_id, capability_code) DO NOTHING;

-- TRIM -> SUPPLY_TRIM
INSERT INTO supplier_capabilities (supplier_id, tenant_id, capability_code, is_verified)
SELECT id, tenant_id, 'SUPPLY_TRIM', true FROM suppliers WHERE category = 'TRIM'
ON CONFLICT (supplier_id, capability_code) DO NOTHING;

-- SERVICE -> LOGISTICS
INSERT INTO supplier_capabilities (supplier_id, tenant_id, capability_code, is_verified)
SELECT id, tenant_id, 'LOGISTICS', true FROM suppliers WHERE category = 'SERVICE'
ON CONFLICT (supplier_id, capability_code) DO NOTHING;
