-- Keep public.users in sync with auth.users so username/mobile login has a
-- profile row to resolve immediately after signup and email confirmation.
CREATE OR REPLACE FUNCTION public.sync_user_profile_from_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  meta jsonb := coalesce(NEW.raw_user_meta_data, '{}'::jsonb);
  profile_role public.user_role := CASE
    WHEN meta ->> 'role' IN ('farmer', 'buyer', 'admin') THEN (meta ->> 'role')::public.user_role
    ELSE 'farmer'::public.user_role
  END;
  profile_username text := coalesce(
    nullif(meta ->> 'username', ''),
    'user' || substr(replace(NEW.id::text, '-', ''), 1, 8)
  );
BEGIN
  INSERT INTO public.users (
    id,
    first_name,
    last_name,
    mobile_number,
    whatsapp_number,
    email,
    state,
    district,
    village,
    postal_code,
    role,
    username
  ) VALUES (
    NEW.id,
    coalesce(nullif(meta ->> 'first_name', ''), ''),
    nullif(meta ->> 'last_name', ''),
    nullif(meta ->> 'mobile_number', ''),
    nullif(meta ->> 'whatsapp_number', ''),
    coalesce(NEW.email, nullif(meta ->> 'email', ''), ''),
    coalesce(nullif(meta ->> 'state', ''), ''),
    coalesce(nullif(meta ->> 'district', ''), ''),
    nullif(meta ->> 'village', ''),
    nullif(meta ->> 'postal_code', ''),
    profile_role,
    profile_username
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_user_profile_after_auth_signup ON auth.users;
CREATE TRIGGER sync_user_profile_after_auth_signup
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.sync_user_profile_from_auth();

-- Backfill profiles for already-created auth accounts that are missing from public.users.
INSERT INTO public.users (
  id,
  first_name,
  last_name,
  mobile_number,
  whatsapp_number,
  email,
  state,
  district,
  village,
  postal_code,
  role,
  username
)
SELECT
  au.id,
  coalesce(nullif(au.raw_user_meta_data ->> 'first_name', ''), ''),
  nullif(au.raw_user_meta_data ->> 'last_name', ''),
  nullif(au.raw_user_meta_data ->> 'mobile_number', ''),
  nullif(au.raw_user_meta_data ->> 'whatsapp_number', ''),
  coalesce(au.email, nullif(au.raw_user_meta_data ->> 'email', ''), ''),
  coalesce(nullif(au.raw_user_meta_data ->> 'state', ''), ''),
  coalesce(nullif(au.raw_user_meta_data ->> 'district', ''), ''),
  nullif(au.raw_user_meta_data ->> 'village', ''),
  nullif(au.raw_user_meta_data ->> 'postal_code', ''),
  CASE
    WHEN au.raw_user_meta_data ->> 'role' IN ('farmer', 'buyer', 'admin')
      THEN (au.raw_user_meta_data ->> 'role')::public.user_role
    ELSE 'farmer'::public.user_role
  END,
  coalesce(
    nullif(au.raw_user_meta_data ->> 'username', ''),
    'user' || substr(replace(au.id::text, '-', ''), 1, 8)
  )
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1
  FROM public.users pu
  WHERE pu.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- Resolve login identifiers from both public profiles and auth metadata. This
-- protects login when an older account is missing/stale in public.users.
CREATE OR REPLACE FUNCTION public.lookup_login_email(identifier text)
RETURNS TABLE(email text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  WITH normalized AS (
    SELECT
      lower(btrim(identifier)) AS lower_identifier,
      regexp_replace(btrim(identifier), '\D', '', 'g') AS digit_identifier
  ),
  profile_matches AS (
    SELECT
      u.email,
      1 AS source_rank,
      CASE
        WHEN lower(u.username) = n.lower_identifier THEN 1
        WHEN regexp_replace(coalesce(u.mobile_number, ''), '\D', '', 'g') = n.digit_identifier THEN 2
        WHEN regexp_replace(coalesce(u.mobile_number, ''), '\D', '', 'g') = '91' || n.digit_identifier THEN 3
        ELSE 4
      END AS match_rank,
      u.created_at
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
  ),
  auth_matches AS (
    SELECT
      au.email,
      2 AS source_rank,
      CASE
        WHEN lower(au.raw_user_meta_data ->> 'username') = n.lower_identifier THEN 1
        WHEN regexp_replace(coalesce(au.raw_user_meta_data ->> 'mobile_number', ''), '\D', '', 'g') = n.digit_identifier THEN 2
        WHEN regexp_replace(coalesce(au.raw_user_meta_data ->> 'mobile_number', ''), '\D', '', 'g') = '91' || n.digit_identifier THEN 3
        ELSE 4
      END AS match_rank,
      au.created_at
    FROM auth.users au
    CROSS JOIN normalized n
    WHERE au.email IS NOT NULL
      AND (
        lower(au.raw_user_meta_data ->> 'username') = n.lower_identifier
        OR (
          n.digit_identifier <> ''
          AND (
            regexp_replace(coalesce(au.raw_user_meta_data ->> 'mobile_number', ''), '\D', '', 'g') = n.digit_identifier
            OR regexp_replace(coalesce(au.raw_user_meta_data ->> 'mobile_number', ''), '\D', '', 'g') = '91' || n.digit_identifier
            OR (
              length(n.digit_identifier) = 10
              AND right(regexp_replace(coalesce(au.raw_user_meta_data ->> 'mobile_number', ''), '\D', '', 'g'), 10) = n.digit_identifier
            )
          )
        )
      )
  )
  SELECT matches.email
  FROM (
    SELECT * FROM profile_matches
    UNION ALL
    SELECT * FROM auth_matches
  ) matches
  ORDER BY matches.source_rank, matches.match_rank, matches.created_at DESC NULLS LAST
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.lookup_login_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_login_email(text) TO anon, authenticated;
