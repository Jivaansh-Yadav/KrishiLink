-- Allow the login form to load only the identifier columns it needs, then
-- perform the same input-to-row matching in the app for username/mobile login.
CREATE OR REPLACE VIEW public.login_identifiers
WITH (security_barrier = true)
AS
SELECT
  email,
  username,
  mobile_number
FROM public.users
WHERE email IS NOT NULL;

REVOKE ALL ON public.login_identifiers FROM PUBLIC;
GRANT SELECT ON public.login_identifiers TO anon, authenticated;
