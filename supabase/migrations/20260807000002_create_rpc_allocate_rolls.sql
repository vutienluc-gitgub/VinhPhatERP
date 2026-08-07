-- ========================================================================================
-- 2. Create RPC allocate_rolls
-- ========================================================================================
CREATE OR REPLACE FUNCTION public.rpc_allocate_rolls(
    p_roll_ids UUID[],
    p_target_type TEXT,
    p_target_id UUID,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_id UUID;
    v_available_count INT;
BEGIN
    v_tenant_id := (SELECT auth.jwt() ->> 'tenant_id')::uuid;

    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Tenant ID is required';
    END IF;

    IF array_length(p_roll_ids, 1) = 0 OR p_roll_ids IS NULL THEN
        RETURN TRUE;
    END IF;

    -- Pessimistic locking: lock the requested rolls to prevent race conditions
    -- Also ensure they are in_stock and NOT already in roll_allocations
    SELECT COUNT(*) INTO v_available_count
    FROM public.raw_fabric_rolls r
    LEFT JOIN public.roll_allocations a ON r.id = a.roll_id
    WHERE r.id = ANY(p_roll_ids)
      AND r.tenant_id = v_tenant_id
      AND r.status = 'in_stock'
      AND a.id IS NULL -- Must not be allocated yet
    FOR UPDATE OF r;

    -- If the count of available & unallocated rolls doesn't match the requested array length,
    -- it means someone else took at least one of them, or they are invalid.
    IF v_available_count < array_length(p_roll_ids, 1) THEN
        RAISE EXCEPTION 'One or more requested rolls are no longer available or already allocated.';
    END IF;

    -- Insert allocations
    INSERT INTO public.roll_allocations (tenant_id, roll_id, target_type, target_id, allocated_by)
    SELECT v_tenant_id, unnest(p_roll_ids), p_target_type, p_target_id, p_user_id;

    RETURN TRUE;
END;
$$;
