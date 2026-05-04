-- Add security_invoker to views to ensure RLS is enforced
ALTER VIEW v_supplier_performance SET (security_invoker = true);
ALTER VIEW v_supplier_full SET (security_invoker = true);
