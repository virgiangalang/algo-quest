-- Algonova Quest mission banks (separate from LMS public.questions)
CREATE TABLE IF NOT EXISTS public.algonova_question_banks (
  file text PRIMARY KEY,
  level text NOT NULL,
  folder_id text,
  folder_title text,
  blurb text NOT NULL DEFAULT '',
  question_count integer NOT NULL DEFAULT 0,
  payload jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.algonova_catalog (
  id text PRIMARY KEY DEFAULT 'default',
  payload jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.algonova_question_banks IS 'Algonova Quest published mission JSON. Writes via service role from /api/admin-upload.';
COMMENT ON TABLE public.algonova_catalog IS 'Algonova Quest merged catalog (levels + folders). Public read; writes via service role.';

ALTER TABLE public.algonova_question_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.algonova_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS algonova_banks_public_read ON public.algonova_question_banks;
CREATE POLICY algonova_banks_public_read
  ON public.algonova_question_banks
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS algonova_catalog_public_read ON public.algonova_catalog;
CREATE POLICY algonova_catalog_public_read
  ON public.algonova_catalog
  FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON public.algonova_question_banks TO anon, authenticated;
GRANT SELECT ON public.algonova_catalog TO anon, authenticated;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.algonova_question_banks FROM anon, authenticated, PUBLIC;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.algonova_catalog FROM anon, authenticated, PUBLIC;
