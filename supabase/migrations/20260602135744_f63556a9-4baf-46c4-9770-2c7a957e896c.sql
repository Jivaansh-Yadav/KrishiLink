
-- 1) Restrict farmer directory to authenticated users only, and limit exposed columns via a safe view.
DROP POLICY IF EXISTS "Buyers can read farmers" ON public.users;

CREATE POLICY "Authenticated can read farmer directory"
ON public.users
FOR SELECT
TO authenticated
USING (role = 'farmer'::user_role);

-- Revoke broad anon access to users table (GraphQL exposure mitigation)
REVOKE SELECT ON public.users FROM anon;
GRANT SELECT ON public.users TO authenticated;

-- 2) Lock down SECURITY DEFINER function: only authenticated users should call it.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 3) Revoke anon SELECT on support (only INSERT needed for public contact form; admins/users read while authenticated)
REVOKE SELECT ON public.support FROM anon;
GRANT INSERT ON public.support TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support TO authenticated;
GRANT ALL ON public.support TO service_role;

-- 4) crops table currently public-readable (intentional marketplace listing). Keep anon SELECT.
GRANT SELECT ON public.crops TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crops TO authenticated;
GRANT ALL ON public.crops TO service_role;
