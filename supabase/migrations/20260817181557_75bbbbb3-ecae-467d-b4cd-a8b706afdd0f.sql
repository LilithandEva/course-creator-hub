INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE lower(email) = 'luis@lilith.com'
ON CONFLICT (user_id, role) DO NOTHING;

DELETE FROM public.user_roles ur
USING auth.users u
WHERE ur.user_id = u.id AND lower(u.email) = 'luis@lilith.com' AND ur.role = 'student';