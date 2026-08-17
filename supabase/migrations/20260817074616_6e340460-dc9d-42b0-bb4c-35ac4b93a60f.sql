-- Chatbot knowledge base
CREATE TABLE public.course_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name text NOT NULL,
  storage_path text NOT NULL,
  chunk_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_documents TO authenticated;
GRANT ALL ON public.course_documents TO service_role;

ALTER TABLE public.course_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage documents" ON public.course_documents
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Enrolled students can list documents" ON public.course_documents
  FOR SELECT TO authenticated
  USING (public.has_course_access(course_id));

CREATE TABLE public.course_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.course_documents(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  content text NOT NULL,
  tsv tsvector GENERATED ALWAYS AS (to_tsvector('spanish', content)) STORED,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_chunks TO authenticated;
GRANT ALL ON public.course_chunks TO service_role;

ALTER TABLE public.course_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage chunks" ON public.course_chunks
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Enrolled students can read chunks" ON public.course_chunks
  FOR SELECT TO authenticated
  USING (public.has_course_access(course_id));

CREATE INDEX course_chunks_tsv_idx ON public.course_chunks USING gin (tsv);
CREATE INDEX course_chunks_document_idx ON public.course_chunks (document_id);

-- Chat history
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own chat" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own chat" ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.has_course_access(course_id));

CREATE POLICY "Users delete own chat" ON public.chat_messages
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX chat_messages_user_idx ON public.chat_messages (user_id, created_at);

-- Payments
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'stripe',
  provider_session_id text UNIQUE,
  amount_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'eur',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own payments" ON public.payments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX payments_user_idx ON public.payments (user_id);

-- Retrieval helper for the chatbot (definer, but enrollment-checked)
CREATE OR REPLACE FUNCTION public.search_course_chunks(_course_id uuid, _query text, _limit integer DEFAULT 6)
RETURNS TABLE (content text, rank real)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_course_access(_course_id) THEN
    RAISE EXCEPTION 'No tienes acceso a este curso';
  END IF;

  RETURN QUERY
  SELECT c.content, ts_rank(c.tsv, websearch_to_tsquery('spanish', _query)) AS rank
  FROM public.course_chunks c
  WHERE c.course_id = _course_id
    AND c.tsv @@ websearch_to_tsquery('spanish', _query)
  ORDER BY rank DESC
  LIMIT LEAST(GREATEST(_limit, 1), 12);
END;
$$;

REVOKE ALL ON FUNCTION public.search_course_chunks(uuid, text, integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.search_course_chunks(uuid, text, integer) TO authenticated, service_role;