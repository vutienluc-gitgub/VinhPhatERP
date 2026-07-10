-- Supplier Portal Quotes Tables & Functions

CREATE TABLE IF NOT EXISTS public.supplier_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    rfq_id UUID NOT NULL REFERENCES public.sourcing_rfqs(id) ON DELETE CASCADE,
    supplier_name VARCHAR(255) NOT NULL,
    supplier_phone VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'submitted',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, rfq_id, supplier_phone)
);

CREATE TABLE IF NOT EXISTS public.supplier_quote_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    quote_id UUID NOT NULL REFERENCES public.supplier_quotes(id) ON DELETE CASCADE,
    rfq_item_id UUID NOT NULL REFERENCES public.sourcing_rfq_items(id) ON DELETE CASCADE,
    unit_price DECIMAL(15, 2) NOT NULL,
    qty_offered DECIMAL(15, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.supplier_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for supplier_quotes" ON public.supplier_quotes
    FOR ALL USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);

ALTER TABLE public.supplier_quote_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for supplier_quote_items" ON public.supplier_quote_items
    FOR ALL USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);

-- Public RPCs (Security Definer)

CREATE OR REPLACE FUNCTION public.rpc_get_public_rfq_details(p_rfq_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_rfq_data JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', r.id,
        'rfq_code', r.rfq_code,
        'title', r.title,
        'deadline_date', r.deadline_date,
        'status', r.status,
        'notes', r.notes,
        'tenant_id', r.tenant_id,
        'items', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', i.id,
                    'material_name', i.material_name,
                    'material_specs', i.material_specs,
                    'qty_required', i.qty_required,
                    'uom', i.uom
                )
            )
            FROM public.sourcing_rfq_items i
            WHERE i.rfq_id = r.id
        ), '[]'::jsonb)
    ) INTO v_rfq_data
    FROM public.sourcing_rfqs r
    WHERE r.id = p_rfq_id AND r.status IN ('open', 'closing_soon');

    IF v_rfq_data IS NULL THEN
        RAISE EXCEPTION 'RFQ not found or is closed';
    END IF;

    RETURN v_rfq_data;
END;
$$;


CREATE OR REPLACE FUNCTION public.rpc_submit_supplier_quote(
    p_rfq_id UUID,
    p_supplier_name VARCHAR,
    p_supplier_phone VARCHAR,
    p_notes TEXT,
    p_items JSONB -- Array of { rfq_item_id, unit_price, qty_offered, notes }
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_id UUID;
    v_quote_id UUID;
    v_rfq_status VARCHAR;
    item_record JSONB;
BEGIN
    -- Verify RFQ is open
    SELECT tenant_id, status INTO v_tenant_id, v_rfq_status
    FROM public.sourcing_rfqs
    WHERE id = p_rfq_id;

    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'RFQ not found';
    END IF;

    IF v_rfq_status NOT IN ('open', 'closing_soon') THEN
        RAISE EXCEPTION 'RFQ is closed, cannot submit quotes';
    END IF;

    -- Upsert Quote
    INSERT INTO public.supplier_quotes (tenant_id, rfq_id, supplier_name, supplier_phone, notes, status)
    VALUES (v_tenant_id, p_rfq_id, p_supplier_name, p_supplier_phone, p_notes, 'submitted')
    ON CONFLICT (tenant_id, rfq_id, supplier_phone) 
    DO UPDATE SET 
        supplier_name = EXCLUDED.supplier_name,
        notes = EXCLUDED.notes,
        updated_at = NOW()
    RETURNING id INTO v_quote_id;

    -- Clear old items if it was an update
    DELETE FROM public.supplier_quote_items WHERE quote_id = v_quote_id;

    -- Insert new items
    FOR item_record IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.supplier_quote_items (
            tenant_id, quote_id, rfq_item_id, unit_price, qty_offered, notes
        )
        VALUES (
            v_tenant_id,
            v_quote_id,
            (item_record->>'rfq_item_id')::UUID,
            (item_record->>'unit_price')::DECIMAL,
            (item_record->>'qty_offered')::DECIMAL,
            item_record->>'notes'
        );
    END LOOP;

    RETURN v_quote_id;
END;
$$;
