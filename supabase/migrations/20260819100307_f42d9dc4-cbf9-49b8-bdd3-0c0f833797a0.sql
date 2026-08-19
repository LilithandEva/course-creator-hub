ALTER TABLE public.landing_settings
  ADD COLUMN IF NOT EXISTS comparison_title text NOT NULL DEFAULT 'Antes y después del curso',
  ADD COLUMN IF NOT EXISTS comparison_before_label text NOT NULL DEFAULT 'Sin el curso',
  ADD COLUMN IF NOT EXISTS comparison_after_label text NOT NULL DEFAULT 'Con el curso',
  ADD COLUMN IF NOT EXISTS comparison_rows jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS scarcity_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS scarcity_total integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS scarcity_remaining integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS scarcity_note text NOT NULL DEFAULT 'Plazas limitadas a este precio';

UPDATE public.landing_settings
SET comparison_rows = '[
  {"before":"Vas dando tumbos con los proveedores y no sabes a quién creer","after":"Proceso claro para encontrar, validar y negociar con proveedores"},
  {"before":"Montas la tienda a ojo y no sabes por qué no vende","after":"Estructura de tienda y fichas de producto pensadas para convertir"},
  {"before":"Quemas presupuesto en anuncios sin números que te guíen","after":"Métricas y márgenes controlados para escalar con cabeza"}
]'::jsonb
WHERE comparison_rows = '[]'::jsonb;