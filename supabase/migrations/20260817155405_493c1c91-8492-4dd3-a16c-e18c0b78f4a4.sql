ALTER TABLE public.landing_settings
  ADD COLUMN IF NOT EXISTS free_lesson_title text NOT NULL DEFAULT 'Clase gratuita: los 3 pilares de una tienda que vende',
  ADD COLUMN IF NOT EXISTS free_lesson_subtitle text NOT NULL DEFAULT 'Mira la primera clase completa, sin registro y sin pagar nada.',
  ADD COLUMN IF NOT EXISTS free_lesson_video_url text,
  ADD COLUMN IF NOT EXISTS syllabus_pdf_path text,
  ADD COLUMN IF NOT EXISTS syllabus_title text NOT NULL DEFAULT 'Temario completo en PDF',
  ADD COLUMN IF NOT EXISTS syllabus_description text NOT NULL DEFAULT 'Descarga el programa detallado: módulos, lecciones, duración y para quién es este curso.',
  ADD COLUMN IF NOT EXISTS benefits jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS faq jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.landing_settings SET
  benefits = '[
    {"title":"Monta tu tienda de cero","body":"Elige plataforma, configura catálogo, pasarela de pago y envíos sin depender de nadie."},
    {"title":"Tráfico que convierte","body":"Estrategia de SEO, paid y email para atraer compradores reales, no visitas vacías."},
    {"title":"Fichas de producto que venden","body":"Copy, fotografía y estructura de página probadas en tiendas reales."},
    {"title":"Números bajo control","body":"Márgenes, CAC, LTV y un panel simple para decidir con datos."},
    {"title":"Automatiza y escala","body":"Flujos de email, recuperación de carrito y procesos para crecer sin morir de trabajo."},
    {"title":"Plantillas listas para usar","body":"Calculadoras, checklists y plantillas descargables en cada módulo."}
  ]'::jsonb
WHERE benefits = '[]'::jsonb;

UPDATE public.landing_settings SET
  faq = '[
    {"q":"¿Necesito experiencia previa?","a":"No. El curso empieza desde cero y avanza hasta estrategias de escalado."},
    {"q":"¿Durante cuánto tiempo tengo acceso?","a":"El acceso al campus es de por vida, incluidas las actualizaciones del contenido."},
    {"q":"¿Hay certificado?","a":"Al completar todos los módulos y sus tests recibes un certificado de finalización."},
    {"q":"¿Puedo pagar a plazos o suscribirme?","a":"Sí, además del pago único puedes activar el acceso mediante suscripción mensual o anual."},
    {"q":"¿Puedo ver algo antes de comprar?","a":"Sí: la clase gratuita y el temario en PDF están disponibles sin registrarte."}
  ]'::jsonb
WHERE faq = '[]'::jsonb;