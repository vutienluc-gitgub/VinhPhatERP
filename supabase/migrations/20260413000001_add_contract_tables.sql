-- ============================================================
-- Migration: Auto Contract Generation
-- Tạo các bảng: contract_templates, contracts,
--               contract_order_links, contract_audit_logs
-- Thêm settings keys cho contract module
-- Requirements: 1.4, 3.5, 7.1
-- ============================================================
-- ─── 1. Bảng contract_templates ──────────────────────────────
CREATE TABLE IF NOT EXISTS contract_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('sale', 'purchase')),
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES profiles(id),
    tenant_id UUID NOT NULL DEFAULT (current_setting('app.current_tenant_id', true))::uuid
);
CREATE TRIGGER trg_contract_templates_updated_at BEFORE
UPDATE ON contract_templates FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- ─── 2. Bảng contracts ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_number TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('sale', 'purchase')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (
        status IN (
            'draft',
            'sent',
            'signed',
            'expired',
            'cancelled'
        )
    ),
    content TEXT NOT NULL,
    template_id UUID REFERENCES contract_templates(id),
    party_a_type TEXT NOT NULL CHECK (party_a_type IN ('customer', 'supplier')),
    party_a_id UUID NOT NULL,
    party_a_name TEXT NOT NULL,
    party_a_address TEXT,
    party_a_tax_code TEXT,
    party_a_representative TEXT,
    party_a_title TEXT,
    party_b_name TEXT NOT NULL,
    party_b_address TEXT,
    party_b_tax_code TEXT,
    party_b_bank_account TEXT,
    party_b_representative TEXT,
    payment_term TEXT,
    effective_date DATE,
    expiry_date DATE,
    notes TEXT,
    source_order_id UUID REFERENCES orders(id),
    pdf_url TEXT,
    pdf_generated_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    sent_by UUID REFERENCES profiles(id),
    signed_at TIMESTAMPTZ,
    signed_by UUID REFERENCES profiles(id),
    signed_file_url TEXT,
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES profiles(id),
    cancel_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES profiles(id),
    tenant_id UUID NOT NULL DEFAULT (current_setting('app.current_tenant_id', true))::uuid
);
CREATE TRIGGER trg_contracts_updated_at BEFORE
UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- ─── 3. Bảng contract_order_links ────────────────────────────
CREATE TABLE IF NOT EXISTS contract_order_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    linked_by UUID REFERENCES profiles(id),
    tenant_id UUID NOT NULL DEFAULT (current_setting('app.current_tenant_id', true))::uuid,
    UNIQUE (contract_id, order_id)
);
-- ─── 4. Bảng contract_audit_logs ─────────────────────────────
CREATE TABLE IF NOT EXISTS contract_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    performed_by UUID REFERENCES profiles(id),
    performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    tenant_id UUID NOT NULL DEFAULT (current_setting('app.current_tenant_id', true))::uuid
);
-- ─── 5. Indexes ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_contracts_contract_number ON contracts (contract_number);
CREATE INDEX IF NOT EXISTS idx_contracts_party_a_id ON contracts (party_a_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts (status);
CREATE INDEX IF NOT EXISTS idx_contracts_tenant_id ON contracts (tenant_id);
CREATE INDEX IF NOT EXISTS idx_contract_order_links_order_id ON contract_order_links (order_id);
CREATE INDEX IF NOT EXISTS idx_contract_order_links_contract_id ON contract_order_links (contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_templates_tenant_id ON contract_templates (tenant_id);
CREATE INDEX IF NOT EXISTS idx_contract_audit_logs_contract_id ON contract_audit_logs (contract_id);
-- ─── 6. RLS ───────────────────────────────────────────────────
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_order_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_audit_logs ENABLE ROW LEVEL SECURITY;
-- contract_templates: authenticated users đọc được, chỉ admin mới sửa/xoá/tạo
DROP POLICY IF EXISTS "Authenticated users can read contract_templates" ON contract_templates;
CREATE POLICY "Authenticated users can read contract_templates" ON contract_templates FOR
SELECT TO authenticated USING (
        tenant_id = (current_setting('app.current_tenant_id', true))::uuid
    );
DROP POLICY IF EXISTS "Admins can manage contract_templates" ON contract_templates;
CREATE POLICY "Admins can manage contract_templates" ON contract_templates FOR ALL TO authenticated USING (
    tenant_id = (current_setting('app.current_tenant_id', true))::uuid
    AND current_user_role() = 'admin'
) WITH CHECK (
    tenant_id = (current_setting('app.current_tenant_id', true))::uuid
    AND current_user_role() = 'admin'
);
-- contracts: authenticated users đọc được, staff+ ghi được
DROP POLICY IF EXISTS "Authenticated users can read contracts" ON contracts;
CREATE POLICY "Authenticated users can read contracts" ON contracts FOR
SELECT TO authenticated USING (
        tenant_id = (current_setting('app.current_tenant_id', true))::uuid
    );
DROP POLICY IF EXISTS "Staff can insert contracts" ON contracts;
CREATE POLICY "Staff can insert contracts" ON contracts FOR
INSERT TO authenticated WITH CHECK (
        tenant_id = (current_setting('app.current_tenant_id', true))::uuid
        AND current_user_role() IN ('admin', 'manager', 'staff')
    );
DROP POLICY IF EXISTS "Staff can update contracts" ON contracts;
CREATE POLICY "Staff can update contracts" ON contracts FOR
UPDATE TO authenticated USING (
        tenant_id = (current_setting('app.current_tenant_id', true))::uuid
        AND current_user_role() IN ('admin', 'manager', 'staff')
    );
DROP POLICY IF EXISTS "Managers can delete contracts" ON contracts;
CREATE POLICY "Managers can delete contracts" ON contracts FOR DELETE TO authenticated USING (
    tenant_id = (current_setting('app.current_tenant_id', true))::uuid
    AND current_user_role() IN ('admin', 'manager')
);
-- contract_order_links: authenticated users đọc được, staff+ ghi được
DROP POLICY IF EXISTS "Authenticated users can read contract_order_links" ON contract_order_links;
CREATE POLICY "Authenticated users can read contract_order_links" ON contract_order_links FOR
SELECT TO authenticated USING (
        tenant_id = (current_setting('app.current_tenant_id', true))::uuid
    );
DROP POLICY IF EXISTS "Staff can manage contract_order_links" ON contract_order_links;
CREATE POLICY "Staff can manage contract_order_links" ON contract_order_links FOR ALL TO authenticated USING (
    tenant_id = (current_setting('app.current_tenant_id', true))::uuid
    AND current_user_role() IN ('admin', 'manager', 'staff')
) WITH CHECK (
    tenant_id = (current_setting('app.current_tenant_id', true))::uuid
    AND current_user_role() IN ('admin', 'manager', 'staff')
);
-- contract_audit_logs: authenticated users đọc được, staff+ insert được (không update/delete)
DROP POLICY IF EXISTS "Authenticated users can read contract_audit_logs" ON contract_audit_logs;
CREATE POLICY "Authenticated users can read contract_audit_logs" ON contract_audit_logs FOR
SELECT TO authenticated USING (
        tenant_id = (current_setting('app.current_tenant_id', true))::uuid
    );
DROP POLICY IF EXISTS "Staff can insert contract_audit_logs" ON contract_audit_logs;
CREATE POLICY "Staff can insert contract_audit_logs" ON contract_audit_logs FOR
INSERT TO authenticated WITH CHECK (
        tenant_id = (current_setting('app.current_tenant_id', true))::uuid
        AND current_user_role() IN ('admin', 'manager', 'staff')
    );
-- ─── 7. Seed settings keys cho contract module ───────────────
INSERT INTO settings (key, value, description)
VALUES (
        'contract_sale_prefix',
        'ĐKKH',
        'Tiền tố loại hợp đồng bán hàng'
    ),
    (
        'contract_purchase_prefix',
        'ĐKNH',
        'Tiền tố loại hợp đồng mua hàng'
    ),
    (
        'company_representative',
        'VŨ TIẾN LỰC',
        'Người đại diện ký hợp đồng'
    ),
    (
        'company_representative_title',
        'Giám Đốc',
        'Chức vụ người đại diện'
    ),
    (
        'company_bank_account',
        '80000346931',
        'Số tài khoản ngân hàng'
    ),
    (
        'company_bank_name',
        'Vietcombank – CN Tân Định',
        'Tên ngân hàng'
    ) ON CONFLICT (key) DO NOTHING;