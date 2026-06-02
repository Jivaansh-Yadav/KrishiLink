CREATE POLICY "Authenticated can read buyer directory"
ON public.users
FOR SELECT
TO authenticated
USING (role = 'buyer'::user_role);