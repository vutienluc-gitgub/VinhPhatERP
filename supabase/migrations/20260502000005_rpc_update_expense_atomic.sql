-- =====================================================================================
-- Migration: Atomic Expense Update
-- =====================================================================================

DROP FUNCTION IF EXISTS rpc_update_expense(UUID, JSONB);

CREATE OR REPLACE FUNCTION rpc_update_expense(
  p_expense_id UUID,
  p_data JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant UUID;
  v_alloc JSONB;
BEGIN
  -- 1. Xác thực tenant
  SELECT tenant_id INTO v_tenant FROM profiles WHERE id = auth.uid();
  IF v_tenant IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED_ACCESS';
  END IF;

  -- 2. Đảm bảo Expense tồn tại và thuộc về tenant
  IF NOT EXISTS (
    SELECT 1 FROM expenses WHERE id = p_expense_id AND tenant_id = v_tenant
  ) THEN
    RAISE EXCEPTION 'EXPENSE_NOT_FOUND';
  END IF;

  -- 3. Cập nhật thông tin Header
  UPDATE expenses
  SET
    expense_date     = COALESCE((p_data->>'expense_date')::date, expense_date),
    category         = COALESCE(p_data->>'category', category),
    amount           = COALESCE((p_data->>'amount')::numeric, amount),
    description      = COALESCE(p_data->>'description', description),
    payment_method   = COALESCE(p_data->>'payment_method', payment_method),
    payment_account_id = CASE WHEN p_data ? 'payment_account_id' THEN (p_data->>'payment_account_id')::uuid ELSE payment_account_id END,
    supplier_id      = CASE WHEN p_data ? 'supplier_id' THEN (p_data->>'supplier_id')::uuid ELSE supplier_id END,
    updated_at       = now()
  WHERE id = p_expense_id;

  -- 4. Cập nhật Allocations (Xoá cũ, Thêm mới) một cách Atomic
  IF p_data ? 'allocations' THEN
    DELETE FROM expense_allocations WHERE expense_id = p_expense_id;

    FOR v_alloc IN SELECT * FROM jsonb_array_elements(p_data->'allocations')
    LOOP
      INSERT INTO expense_allocations (
        tenant_id,
        expense_id,
        document_type,
        document_id,
        allocated_amount
      ) VALUES (
        v_tenant,
        p_expense_id,
        (v_alloc->>'document_type')::payment_document_type,
        (v_alloc->>'document_id')::uuid,
        (v_alloc->>'allocated_amount')::numeric
      );
    END LOOP;
  END IF;

  RETURN jsonb_build_object('ok', true, 'id', p_expense_id);
END;
$$;
