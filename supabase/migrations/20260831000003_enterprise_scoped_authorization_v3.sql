-- ============================================================================
-- Migration: 20260831000003_enterprise_scoped_authorization_v3.sql
-- Description: Enterprise Authorization Architecture v3
--              (Identity -> Scope -> Resource -> Action)
--              Centralizes object-level authorization predicates across orders,
--              shipments, quotations, payments, and contracts.
--              Converts Multi-Tenant policies to RESTRICTIVE to prevent permissive OR bypass.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Helper Functions (Centralized Authorization Predicates)
-- ----------------------------------------------------------------------------

-- A. Order Access Predicate
CREATE OR REPLACE FUNCTION public.fn_can_access_order(
  p_order_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_role TEXT;
  v_user_customer_id UUID;
  v_order_customer_id UUID;
  v_order_created_by UUID;
BEGIN
  IF p_user_id IS NULL OR p_order_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 1. Fetch user identity
  SELECT role::text, customer_id INTO v_user_role, v_user_customer_id
  FROM public.profiles
  WHERE id = p_user_id AND is_active = TRUE;

  IF v_user_role IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 2. Admin has global access within tenant
  IF v_user_role = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- 3. Fetch order attributes
  SELECT customer_id, created_by INTO v_order_customer_id, v_order_created_by
  FROM public.orders
  WHERE id = p_order_id;

  IF v_order_customer_id IS NULL AND v_order_created_by IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 4. Customer Role: strictly limited to own customer_id
  IF v_user_role = 'customer' THEN
    RETURN v_user_customer_id IS NOT NULL AND v_user_customer_id = v_order_customer_id;
  END IF;

  -- 5. Driver Role: allowed if assigned to a shipment of this order
  IF v_user_role = 'driver' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.shipments s
      WHERE s.order_id = p_order_id AND s.delivery_staff_id = p_user_id
    );
  END IF;

  -- 6. Internal Staff Roles (manager, staff, sale, accountant, viewer, warehouse)
  IF v_user_role IN ('manager', 'staff', 'sale', 'accountant', 'viewer', 'warehouse') THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- B. Shipment Access Predicate
CREATE OR REPLACE FUNCTION public.fn_can_access_shipment(
  p_shipment_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_role TEXT;
  v_user_customer_id UUID;
  v_shipment_customer_id UUID;
  v_delivery_staff_id UUID;
BEGIN
  IF p_user_id IS NULL OR p_shipment_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT role::text, customer_id INTO v_user_role, v_user_customer_id
  FROM public.profiles
  WHERE id = p_user_id AND is_active = TRUE;

  IF v_user_role IS NULL THEN
    RETURN FALSE;
  END IF;

  IF v_user_role = 'admin' THEN
    RETURN TRUE;
  END IF;

  SELECT customer_id, delivery_staff_id INTO v_shipment_customer_id, v_delivery_staff_id
  FROM public.shipments
  WHERE id = p_shipment_id;

  IF v_shipment_customer_id IS NULL AND v_delivery_staff_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Customer role: strictly own customer_id
  IF v_user_role = 'customer' THEN
    RETURN v_user_customer_id IS NOT NULL AND v_user_customer_id = v_shipment_customer_id;
  END IF;

  -- Driver role: strictly assigned delivery staff
  IF v_user_role = 'driver' THEN
    RETURN v_delivery_staff_id = p_user_id;
  END IF;

  IF v_user_role IN ('manager', 'staff', 'sale', 'accountant', 'viewer', 'warehouse') THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- C. Quotation Access Predicate
CREATE OR REPLACE FUNCTION public.fn_can_access_quotation(
  p_quotation_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_role TEXT;
  v_user_customer_id UUID;
  v_quotation_customer_id UUID;
  v_status TEXT;
BEGIN
  IF p_user_id IS NULL OR p_quotation_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT role::text, customer_id INTO v_user_role, v_user_customer_id
  FROM public.profiles
  WHERE id = p_user_id AND is_active = TRUE;

  IF v_user_role IS NULL THEN
    RETURN FALSE;
  END IF;

  IF v_user_role = 'admin' THEN
    RETURN TRUE;
  END IF;

  SELECT customer_id, status INTO v_quotation_customer_id, v_status
  FROM public.quotations
  WHERE id = p_quotation_id;

  IF v_quotation_customer_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Customer role: strictly own customer_id and cannot view draft quotations
  IF v_user_role = 'customer' THEN
    RETURN v_user_customer_id IS NOT NULL 
       AND v_user_customer_id = v_quotation_customer_id 
       AND v_status != 'draft';
  END IF;

  IF v_user_role IN ('manager', 'staff', 'sale', 'accountant', 'viewer') THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- D. Payment Access Predicate
CREATE OR REPLACE FUNCTION public.fn_can_access_payment(
  p_payment_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_role TEXT;
  v_user_customer_id UUID;
  v_payment_customer_id UUID;
  v_order_id UUID;
BEGIN
  IF p_user_id IS NULL OR p_payment_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT role::text, customer_id INTO v_user_role, v_user_customer_id
  FROM public.profiles
  WHERE id = p_user_id AND is_active = TRUE;

  IF v_user_role IS NULL THEN
    RETURN FALSE;
  END IF;

  IF v_user_role = 'admin' THEN
    RETURN TRUE;
  END IF;

  SELECT customer_id, order_id INTO v_payment_customer_id, v_order_id
  FROM public.payments
  WHERE id = p_payment_id;

  -- If customer_id is directly on payment
  IF v_user_role = 'customer' THEN
    IF v_payment_customer_id IS NOT NULL THEN
      RETURN v_user_customer_id IS NOT NULL AND v_user_customer_id = v_payment_customer_id;
    END IF;
    -- Fallback via order ownership graph
    IF v_order_id IS NOT NULL THEN
      RETURN EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = v_order_id AND o.customer_id = v_user_customer_id
      );
    END IF;
    RETURN FALSE;
  END IF;

  IF v_user_role IN ('manager', 'staff', 'sale', 'accountant', 'viewer') THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- E. Contract Access Predicate
CREATE OR REPLACE FUNCTION public.fn_can_access_contract(
  p_contract_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_role TEXT;
  v_user_customer_id UUID;
  v_user_supplier_id UUID;
  v_party_b_id UUID;
  v_party_a_id UUID;
BEGIN
  IF p_user_id IS NULL OR p_contract_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT role::text, customer_id, supplier_id 
  INTO v_user_role, v_user_customer_id, v_user_supplier_id
  FROM public.profiles
  WHERE id = p_user_id AND is_active = TRUE;

  IF v_user_role IS NULL THEN
    RETURN FALSE;
  END IF;

  IF v_user_role = 'admin' THEN
    RETURN TRUE;
  END IF;

  SELECT party_a_id, party_b_id INTO v_party_a_id, v_party_b_id
  FROM public.contracts
  WHERE id = p_contract_id;

  IF v_user_role = 'customer' THEN
    RETURN v_user_customer_id IS NOT NULL AND (v_party_b_id = v_user_customer_id OR v_party_a_id = v_user_customer_id);
  END IF;

  IF v_user_role = 'supplier' THEN
    RETURN v_user_supplier_id IS NOT NULL AND (v_party_b_id = v_user_supplier_id OR v_party_a_id = v_user_supplier_id);
  END IF;

  IF v_user_role IN ('manager', 'staff', 'sale', 'accountant', 'viewer') THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. Clean Up Legacy & Overpermissive Policies
-- ----------------------------------------------------------------------------

-- Orders
DROP POLICY IF EXISTS "Staff can read orders" ON public.orders;
DROP POLICY IF EXISTS "Tenant Isolation Select on orders" ON public.orders;
DROP POLICY IF EXISTS "customer_portal_orders_select" ON public.orders;

-- Order Items
DROP POLICY IF EXISTS "Staff can read order_items" ON public.order_items;
DROP POLICY IF EXISTS "Tenant Isolation Select on order_items" ON public.order_items;
DROP POLICY IF EXISTS "customer_portal_order_items_select" ON public.order_items;

-- Shipments
DROP POLICY IF EXISTS "Shipments read access" ON public.shipments;
DROP POLICY IF EXISTS "Staff can read shipments" ON public.shipments;
DROP POLICY IF EXISTS "customer_portal_shipments_select" ON public.shipments;
DROP POLICY IF EXISTS "Tenant Isolation Select on shipments" ON public.shipments;

-- Shipment Items
DROP POLICY IF EXISTS "Shipment items read access" ON public.shipment_items;
DROP POLICY IF EXISTS "Staff can read shipment_items" ON public.shipment_items;
DROP POLICY IF EXISTS "customer_portal_shipment_items_select" ON public.shipment_items;
DROP POLICY IF EXISTS "Tenant Isolation Select on shipment_items" ON public.shipment_items;

-- Quotations
DROP POLICY IF EXISTS "quotations_select" ON public.quotations;
DROP POLICY IF EXISTS "Staff can read quotations" ON public.quotations;
DROP POLICY IF EXISTS "Tenant Isolation Select on quotations" ON public.quotations;

-- Quotation Items
DROP POLICY IF EXISTS "quotation_items_select" ON public.quotation_items;
DROP POLICY IF EXISTS "Staff can read quotation_items" ON public.quotation_items;
DROP POLICY IF EXISTS "Tenant Isolation Select on quotation_items" ON public.quotation_items;

-- Payments
DROP POLICY IF EXISTS "Staff can read payments" ON public.payments;
DROP POLICY IF EXISTS "customer_portal_payments_select" ON public.payments;
DROP POLICY IF EXISTS "Tenant Isolation Select on payments" ON public.payments;

-- Contracts
DROP POLICY IF EXISTS "Authenticated users can read contracts" ON public.contracts;

-- ----------------------------------------------------------------------------
-- 3. Apply Unified Scoped RLS Policies (PERMISSIVE object predicates)
-- ----------------------------------------------------------------------------

-- Orders
CREATE POLICY "orders_scoped_select"
ON public.orders
FOR SELECT
TO authenticated
USING (public.fn_can_access_order(id, auth.uid()));

-- Order Items
CREATE POLICY "order_items_scoped_select"
ON public.order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND public.fn_can_access_order(o.id, auth.uid())
  )
);

-- Shipments
CREATE POLICY "shipments_scoped_select"
ON public.shipments
FOR SELECT
TO authenticated
USING (public.fn_can_access_shipment(id, auth.uid()));

-- Shipment Items
CREATE POLICY "shipment_items_scoped_select"
ON public.shipment_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.shipments s
    WHERE s.id = shipment_items.shipment_id
      AND public.fn_can_access_shipment(s.id, auth.uid())
  )
);

-- Quotations
CREATE POLICY "quotations_scoped_select"
ON public.quotations
FOR SELECT
TO authenticated
USING (public.fn_can_access_quotation(id, auth.uid()));

-- Quotation Items
CREATE POLICY "quotation_items_scoped_select"
ON public.quotation_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.quotations q
    WHERE q.id = quotation_items.quotation_id
      AND public.fn_can_access_quotation(q.id, auth.uid())
  )
);

-- Payments
CREATE POLICY "payments_scoped_select"
ON public.payments
FOR SELECT
TO authenticated
USING (public.fn_can_access_payment(id, auth.uid()));

-- Contracts
CREATE POLICY "contracts_scoped_select"
ON public.contracts
FOR SELECT
TO authenticated
USING (public.fn_can_access_contract(id, auth.uid()));

