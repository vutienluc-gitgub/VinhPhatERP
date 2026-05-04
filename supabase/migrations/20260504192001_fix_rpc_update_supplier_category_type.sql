-- Fix: rpc_update_supplier still used enum supplier_category for p_category
-- After migration 20260504192000, suppliers.category is VARCHAR(50), not enum.
-- This migration recreates the function with TEXT parameter.

DROP FUNCTION IF EXISTS public.rpc_update_supplier;
CREATE OR REPLACE FUNCTION public.rpc_update_supplier(
    p_id UUID,
    p_code TEXT,
    p_name TEXT,
    p_category TEXT,
    p_phone TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_address TEXT DEFAULT NULL,
    p_tax_code TEXT DEFAULT NULL,
    p_contact_person TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_status active_status DEFAULT 'active',
    p_expected_updated_at TIMESTAMPTZ DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_role user_role;
    v_result UUID;
    v_current_updated_at TIMESTAMPTZ;
BEGIN
    -- Check authentication
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
    
    -- Check authorization
    SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
    IF v_role IS NULL OR v_role NOT IN ('admin', 'manager', 'staff') THEN 
        RAISE EXCEPTION 'FORBIDDEN';
    END IF;

    -- Validate category exists in supplier_categories
    IF p_category IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM supplier_categories WHERE code = p_category AND is_active = true
    ) THEN
        RAISE EXCEPTION 'INVALID_CATEGORY: Danh mục "%" không hợp lệ.', p_category;
    END IF;

    -- Optimistic Concurrency Control (OCC) Guard
    IF p_expected_updated_at IS NOT NULL THEN
        SELECT updated_at INTO v_current_updated_at
        FROM suppliers WHERE id = p_id FOR UPDATE;

        IF date_trunc('milliseconds', v_current_updated_at) != date_trunc('milliseconds', p_expected_updated_at) THEN
            RAISE EXCEPTION 'OCC_MISMATCH: Dữ liệu đã bị thay đổi bởi người khác. Vui lòng tải lại trang.';
        END IF;
    END IF;

    -- Perform the update
    UPDATE suppliers
    SET code = p_code,
        name = p_name,
        category = p_category,
        phone = p_phone,
        email = p_email,
        address = p_address,
        tax_code = p_tax_code,
        contact_person = p_contact_person,
        notes = p_notes,
        status = p_status,
        updated_at = now()
    WHERE id = p_id
    RETURNING id INTO v_result;

    IF v_result IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
    
    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_update_supplier TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_update_supplier TO service_role;
