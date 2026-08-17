
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM public, anon;
REVOKE ALL ON FUNCTION public.is_admin() FROM public, anon;
REVOKE ALL ON FUNCTION public.has_course_access(uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.can_access_module(uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.can_access_lesson(uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.get_quiz_for_student(uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.submit_quiz(uuid, jsonb) FROM public, anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM public, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_course_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_module(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_lesson(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_quiz_for_student(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_quiz(uuid, jsonb) TO authenticated;
