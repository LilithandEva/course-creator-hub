CREATE OR REPLACE FUNCTION public.is_restricted_asset(_name text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT _name LIKE 'syllabus/%' OR _name LIKE 'landing/temario%';
$$;

REVOKE EXECUTE ON FUNCTION public.is_restricted_asset(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_restricted_asset(text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.can_read_syllabus()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.courses c WHERE public.has_course_access(c.id)
  );
$$;

REVOKE EXECUTE ON FUNCTION public.can_read_syllabus() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_read_syllabus() TO authenticated, service_role;

DROP POLICY IF EXISTS "public_assets_read" ON storage.objects;

CREATE POLICY "public_assets_read_public" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'public-assets' AND NOT public.is_restricted_asset(name));

CREATE POLICY "public_assets_read_syllabus" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'public-assets'
  AND public.is_restricted_asset(name)
  AND (public.is_admin() OR public.can_read_syllabus())
);