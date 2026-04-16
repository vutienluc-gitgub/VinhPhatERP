-- Migration: RPC for linking profile to employee
-- Bypasses RLS so admins can link profiles for other users

CREATE OR REPLACE FUNCTION atomic_link_profile_to_employee(
  p_employee_id UUID,
  p_profile_id UUID DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Clear any existing profile linked to this employee
  UPDATE public.profiles
     SET employee_id = NULL
   WHERE employee_id = p_employee_id;

  -- 2. Link the new profile if provided AND set their role to 'driver'
  IF p_profile_id IS NOT NULL THEN
    UPDATE public.profiles
       SET employee_id = p_employee_id,
           role = 'driver',
           updated_at = now()
     WHERE id = p_profile_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION atomic_link_profile_to_employee(UUID, UUID) TO authenticated;
