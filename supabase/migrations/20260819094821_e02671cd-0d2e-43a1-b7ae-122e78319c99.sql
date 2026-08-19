ALTER TABLE public.landing_settings
  ADD COLUMN IF NOT EXISTS students_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_average numeric(2,1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reviews_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS social_proof_note text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS featured_logos jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS curriculum_title text NOT NULL DEFAULT 'El temario, módulo a módulo',
  ADD COLUMN IF NOT EXISTS curriculum_description text NOT NULL DEFAULT 'Esto es exactamente lo que vas a ver dentro del campus.',
  ADD COLUMN IF NOT EXISTS guarantee_title text NOT NULL DEFAULT 'Garantía de 14 días',
  ADD COLUMN IF NOT EXISTS guarantee_body text NOT NULL DEFAULT 'Si el curso no es para ti, escríbenos en los primeros 14 días y te devolvemos el 100% del importe. Sin preguntas.',
  ADD COLUMN IF NOT EXISTS certificate_title text NOT NULL DEFAULT 'Certificado de finalización',
  ADD COLUMN IF NOT EXISTS certificate_body text NOT NULL DEFAULT 'Al superar todos los tests recibes un certificado digital con tu nombre, listo para compartir en LinkedIn.',
  ADD COLUMN IF NOT EXISTS og_image_url text;

CREATE OR REPLACE FUNCTION public.public_curriculum(_course_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(x ORDER BY x->>'position'), '[]'::jsonb)
  FROM (
    SELECT jsonb_build_object(
      'id', m.id,
      'title', m.title,
      'description', m.description,
      'position', lpad(m.position::text, 4, '0'),
      'has_quiz', m.has_quiz,
      'lessons', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', l.id, 'title', l.title, 'duration_minutes', l.duration_minutes
        ) ORDER BY l.position)
        FROM public.lessons l WHERE l.module_id = m.id
      ), '[]'::jsonb)
    ) AS x
    FROM public.modules m
    JOIN public.courses c ON c.id = m.course_id AND c.is_published
    WHERE m.course_id = _course_id
  ) s;
$$;

REVOKE ALL ON FUNCTION public.public_curriculum(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_curriculum(uuid) TO anon, authenticated;