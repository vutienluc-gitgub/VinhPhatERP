-- Migration: 20260709140000_rfq_awarding.sql
-- Description: RPC for awarding a supplier quote and updating RFQ status.

CREATE OR REPLACE FUNCTION public.rpc_award_supplier_quote(p_quote_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_rfq_id UUID;
BEGIN
  -- Get current tenant
  v_tenant_id := (current_setting('app.current_tenant_id', true))::UUID;
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Missing tenant context';
  END IF;

  -- 1. Check if the quote exists and belongs to the tenant
  SELECT rfq_id INTO v_rfq_id
  FROM public.supplier_quotes
  WHERE id = p_quote_id AND tenant_id = v_tenant_id;

  IF v_rfq_id IS NULL THEN
    RAISE EXCEPTION 'Quote not found or access denied';
  END IF;

  -- 2. Update the target quote status to awarded
  UPDATE public.supplier_quotes
  SET status = 'awarded', updated_at = NOW()
  WHERE id = p_quote_id AND tenant_id = v_tenant_id;

  -- 3. Update all other quotes for the same RFQ to rejected
  UPDATE public.supplier_quotes
  SET status = 'rejected', updated_at = NOW()
  WHERE rfq_id = v_rfq_id 
    AND id != p_quote_id 
    AND tenant_id = v_tenant_id;

  -- 4. Update the RFQ status to awarded
  UPDATE public.sourcing_rfqs
  SET status = 'awarded', updated_at = NOW()
  WHERE id = v_rfq_id AND tenant_id = v_tenant_id;

  RETURN jsonb_build_object('success', true, 'rfq_id', v_rfq_id);
END;
$$;
