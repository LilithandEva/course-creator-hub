-- 1) Course-file downloads must be scoped to the course the file belongs to.
CREATE OR REPLACE FUNCTION public.can_read_course_file(_path text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.lesson_resources r
    JOIN public.lessons l ON l.id = r.lesson_id
    JOIN public.modules m ON m.id = l.module_id
    WHERE r.storage_path = _path
      AND public.has_course_access(m.course_id)
  )
  OR EXISTS (
    SELECT 1
    FROM public.course_documents d
    WHERE d.storage_path = _path
      AND public.has_course_access(d.course_id)
  );
$$;

REVOKE ALL ON FUNCTION public.can_read_course_file(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_read_course_file(text) TO authenticated;

DROP POLICY IF EXISTS course_files_read_enrolled ON storage.objects;
CREATE POLICY course_files_read_enrolled
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'course-files'
  AND (public.is_admin() OR public.can_read_course_file(name))
);

-- 2) Internal subscription check must not be callable directly with an
--    arbitrary user id. It is only used inside other SECURITY DEFINER
--    functions, which execute as the owner and do not need this grant.
REVOKE ALL ON FUNCTION public.has_active_subscription(uuid, uuid) FROM PUBLIC, anon, authenticated;