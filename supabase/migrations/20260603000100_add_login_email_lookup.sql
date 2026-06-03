CREATE OR REPLACE FUNCTION public.lookup_login_email(identifier text)
RETURNS TABLE(email text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH normalized AS (
    SELECT
      btrim(identifier) AS raw_identifier,
      lower(btrim(identifier)) AS lower_identifier,
      regexp_replace(btrim(identifier), '\D', '', 'g') AS digit_identifier
  )
  SELECT u.email
  FROM public.users u
  CROSS JOIN normalized n
  WHERE u.email IS NOT NULL
    AND (
      lower(u.username) = n.lower_identifier
      OR (
        n.digit_identifier <> ''
        AND (
          regexp_replace(coalesce(u.mobile_number, ''), '\D', '', 'g') = n.digit_identifier
          OR regexp_replace(coalesce(u.mobile_number, ''), '\D', '', 'g') = '91' || n.digit_identifier
          OR (
            length(n.digit_identifier) = 10
            AND right(regexp_replace(coalesce(u.mobile_number, ''), '\D', '', 'g'), 10) = n.digit_identifier
          )
        )
      )
    )
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.lookup_login_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_login_email(text) TO anon, authenticated;
