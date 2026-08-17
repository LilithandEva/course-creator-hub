
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  price_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'eur',
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.courses TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "courses_public_read" ON public.courses FOR SELECT TO anon, authenticated
  USING (is_published OR public.is_admin());
CREATE POLICY "courses_admin_write" ON public.courses FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER courses_updated_at BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'manual',
  stripe_session_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);
GRANT SELECT ON public.enrollments TO authenticated;
GRANT ALL ON public.enrollments TO service_role;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enrollments_select_own" ON public.enrollments FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "enrollments_admin_write" ON public.enrollments FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.has_course_access(_course_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin')
      OR EXISTS (SELECT 1 FROM public.enrollments e
                 WHERE e.course_id = _course_id AND e.user_id = auth.uid());
$$;

CREATE TABLE public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  position integer NOT NULL DEFAULT 0,
  has_quiz boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.modules TO authenticated;
GRANT ALL ON public.modules TO service_role;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "modules_read_enrolled" ON public.modules FOR SELECT TO authenticated
  USING (public.has_course_access(course_id));
CREATE POLICY "modules_admin_write" ON public.modules FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER modules_updated_at BEFORE UPDATE ON public.modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  video_url text,
  duration_minutes integer,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lessons TO authenticated;
GRANT ALL ON public.lessons TO service_role;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_access_module(_module_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.modules m
                 WHERE m.id = _module_id AND public.has_course_access(m.course_id));
$$;

CREATE OR REPLACE FUNCTION public.can_access_lesson(_lesson_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.lessons l
                 WHERE l.id = _lesson_id AND public.can_access_module(l.module_id));
$$;

CREATE POLICY "lessons_read_enrolled" ON public.lessons FOR SELECT TO authenticated
  USING (public.can_access_module(module_id));
CREATE POLICY "lessons_admin_write" ON public.lessons FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER lessons_updated_at BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.lesson_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  name text NOT NULL,
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_resources TO authenticated;
GRANT ALL ON public.lesson_resources TO service_role;
ALTER TABLE public.lesson_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resources_read_enrolled" ON public.lesson_resources FOR SELECT TO authenticated
  USING (public.can_access_lesson(lesson_id));
CREATE POLICY "resources_admin_write" ON public.lesson_resources FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
GRANT SELECT, INSERT, DELETE ON public.lesson_progress TO authenticated;
GRANT ALL ON public.lesson_progress TO service_role;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "progress_select_own" ON public.lesson_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "progress_insert_own" ON public.lesson_progress FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.can_access_lesson(lesson_id));
CREATE POLICY "progress_delete_own" ON public.lesson_progress FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL UNIQUE REFERENCES public.modules(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Test del módulo',
  pass_score integer NOT NULL DEFAULT 70,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes TO authenticated;
GRANT ALL ON public.quizzes TO service_role;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quizzes_read_enrolled" ON public.quizzes FOR SELECT TO authenticated
  USING (public.can_access_module(module_id));
CREATE POLICY "quizzes_admin_write" ON public.quizzes FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions_admin_all" ON public.quiz_questions FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.quiz_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  label text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_options TO authenticated;
GRANT ALL ON public.quiz_options TO service_role;
ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "options_admin_all" ON public.quiz_options FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score integer NOT NULL,
  passed boolean NOT NULL,
  total_questions integer NOT NULL,
  correct_count integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attempts_select_own" ON public.quiz_attempts FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE OR REPLACE FUNCTION public.get_quiz_for_student(_quiz_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _module uuid; _result jsonb;
BEGIN
  SELECT module_id INTO _module FROM public.quizzes WHERE id = _quiz_id;
  IF _module IS NULL OR NOT public.can_access_module(_module) THEN
    RAISE EXCEPTION 'No access to this quiz';
  END IF;
  SELECT jsonb_build_object(
    'id', q.id, 'title', q.title, 'pass_score', q.pass_score,
    'questions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', qq.id, 'prompt', qq.prompt,
        'options', COALESCE((
          SELECT jsonb_agg(jsonb_build_object('id', o.id, 'label', o.label) ORDER BY o.position)
          FROM public.quiz_options o WHERE o.question_id = qq.id), '[]'::jsonb)
      ) ORDER BY qq.position)
      FROM public.quiz_questions qq WHERE qq.quiz_id = q.id), '[]'::jsonb)
  ) INTO _result FROM public.quizzes q WHERE q.id = _quiz_id;
  RETURN _result;
END; $$;

CREATE OR REPLACE FUNCTION public.submit_quiz(_quiz_id uuid, _answers jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _module uuid; _total int; _correct int; _score int; _pass int; _passed boolean; _attempt uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT module_id, pass_score INTO _module, _pass FROM public.quizzes WHERE id = _quiz_id;
  IF _module IS NULL OR NOT public.can_access_module(_module) THEN
    RAISE EXCEPTION 'No access to this quiz';
  END IF;
  SELECT count(*) INTO _total FROM public.quiz_questions WHERE quiz_id = _quiz_id;
  IF _total = 0 THEN RAISE EXCEPTION 'Quiz has no questions'; END IF;
  SELECT count(*) INTO _correct
  FROM public.quiz_questions qq
  JOIN public.quiz_options o ON o.question_id = qq.id AND o.is_correct
  WHERE qq.quiz_id = _quiz_id
    AND (_answers ->> qq.id::text) = o.id::text;
  _score := round((_correct::numeric / _total) * 100);
  _passed := _score >= _pass;
  INSERT INTO public.quiz_attempts (user_id, quiz_id, score, passed, total_questions, correct_count)
  VALUES (auth.uid(), _quiz_id, _score, _passed, _total, _correct)
  RETURNING id INTO _attempt;
  RETURN jsonb_build_object('attempt_id', _attempt, 'score', _score, 'passed', _passed,
                            'total', _total, 'correct', _correct, 'pass_score', _pass);
END; $$;

REVOKE ALL ON FUNCTION public.get_quiz_for_student(uuid) FROM public;
REVOKE ALL ON FUNCTION public.submit_quiz(uuid, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.get_quiz_for_student(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_quiz(uuid, jsonb) TO authenticated;

CREATE TABLE public.landing_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  primary_color text NOT NULL DEFAULT '#0B1D33',
  accent_color text NOT NULL DEFAULT '#F5B544',
  font_family text NOT NULL DEFAULT 'Space Grotesk',
  hero_title text NOT NULL DEFAULT '',
  hero_subtitle text NOT NULL DEFAULT '',
  hero_cta text NOT NULL DEFAULT 'Comprar el curso',
  about_title text NOT NULL DEFAULT '',
  about_body text NOT NULL DEFAULT '',
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.landing_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.landing_settings TO authenticated;
GRANT ALL ON public.landing_settings TO service_role;
ALTER TABLE public.landing_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "landing_public_read" ON public.landing_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "landing_admin_write" ON public.landing_settings FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER landing_updated_at BEFORE UPDATE ON public.landing_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL DEFAULT '',
  quote text NOT NULL,
  photo_url text,
  position integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.testimonials TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "testimonials_public_read" ON public.testimonials FOR SELECT TO anon, authenticated
  USING (is_visible OR public.is_admin());
CREATE POLICY "testimonials_admin_write" ON public.testimonials FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "public_assets_read" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'public-assets');
CREATE POLICY "public_assets_admin_write" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'public-assets' AND public.is_admin())
  WITH CHECK (bucket_id = 'public-assets' AND public.is_admin());

CREATE POLICY "course_files_read_enrolled" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'course-files' AND (
    public.is_admin() OR EXISTS (SELECT 1 FROM public.enrollments e WHERE e.user_id = auth.uid())
  ));
CREATE POLICY "course_files_admin_write" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'course-files' AND public.is_admin())
  WITH CHECK (bucket_id = 'course-files' AND public.is_admin());

INSERT INTO public.courses (slug, title, subtitle, description, price_cents, currency)
VALUES ('ecommerce-formation', 'eCommerce Formation',
  'De cero a tu primera tienda online rentable',
  'Un programa práctico para lanzar, gestionar y escalar un negocio de comercio electrónico: producto, proveedores, tienda, tráfico y conversión.',
  29700, 'eur');

INSERT INTO public.landing_settings (course_id, hero_title, hero_subtitle, about_title, about_body)
SELECT id,
  'Lanza tu eCommerce rentable en 8 semanas',
  'Formación práctica, paso a paso, con plantillas, vídeos y tests para consolidar cada módulo.',
  'Un método probado, sin humo',
  'Aprenderás a validar producto, negociar con proveedores, montar tu tienda, atraer tráfico y convertir visitas en ventas. Cada módulo incluye vídeo, teoría descargable y un test para comprobar que lo has interiorizado.'
FROM public.courses WHERE slug = 'ecommerce-formation';

INSERT INTO public.testimonials (name, role, quote, position) VALUES
  ('Laura Méndez', 'Fundadora de Nuvo Store', 'Pasé de una idea suelta a facturar mis primeros 4.000 € en dos meses. El módulo de proveedores vale por sí solo el curso.', 1),
  ('Diego Ferrán', 'eCommerce de accesorios', 'Muy directo y sin relleno. Las plantillas de márgenes y la checklist de lanzamiento me ahorraron semanas.', 2),
  ('Marta Ibáñez', 'Marca de cosmética natural', 'Los tests al final de cada módulo me obligaron a repasar de verdad. Ahora entiendo mis números.', 3);
