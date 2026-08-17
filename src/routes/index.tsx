import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Download,
  FileText,
  PlayCircle,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { fetchLanding, formatPrice } from "@/lib/course";
import { fontStack, signedAssetUrl, signedAssetUrls } from "@/lib/landing";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "eCommerce Formation · Curso online de eCommerce | TuCurso.com" },
      {
        name: "description",
        content:
          "Empieza con una clase gratuita y el temario en PDF. Curso online para lanzar y escalar tu tienda: vídeo, plantillas, tests y campus privado.",
      },
      { property: "og:title", content: "eCommerce Formation · Clase gratuita y temario en PDF" },
      {
        property: "og:description",
        content:
          "Mira la clase gratuita, descarga el temario y decide después: campus privado con vídeo, plantillas y tests.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

type Benefit = { title: string; body: string };
type Faq = { q: string; a: string };

function LandingPage() {
  const { user } = useAuth();
  const { data } = useQuery({ queryKey: ["landing"], queryFn: fetchLanding });

  const settings = data?.settings;
  const course = data?.course;
  const fonts = fontStack(settings?.font_family);

  const benefits = (Array.isArray(settings?.benefits) ? settings.benefits : []) as Benefit[];
  const faq = (Array.isArray(settings?.faq) ? settings.faq : []) as Faq[];
  const galleryPaths = Array.isArray(settings?.gallery) ? (settings.gallery as string[]) : [];

  const { data: galleryUrls } = useQuery({
    queryKey: ["gallery", galleryPaths],
    queryFn: () => signedAssetUrls(galleryPaths),
    enabled: galleryPaths.length > 0,
  });

  const { data: syllabusUrl } = useQuery({
    queryKey: ["syllabus", settings?.syllabus_pdf_path],
    queryFn: () => signedAssetUrl(settings?.syllabus_pdf_path),
    enabled: !!settings?.syllabus_pdf_path,
  });

  const testimonials = (data?.testimonials ?? []).filter((t) => t.is_visible);

  const style = {
    "--brand": settings?.primary_color ?? "#0B1D33",
    "--brand-accent": settings?.accent_color ?? "#F5B544",
    "--font-display-custom": fonts.display,
    "--font-body-custom": fonts.body,
  } as React.CSSProperties;

  const buyLink = user ? "/comprar" : "/comprar";

  return (
    <div
      className="min-h-screen bg-background"
      style={{ ...style, fontFamily: "var(--font-body-custom)" }}
    >
      <SiteHeader />

      <main>
        {/* 1 · Gancho / propuesta de valor */}
        <section className="ink-gradient relative overflow-hidden text-white">
          <div className="container-x grid gap-14 py-24 md:grid-cols-[1.15fr_0.85fr] md:items-center">
            <div className="reveal">
              <span
                className="chip glass"
                style={{ color: "var(--brand-accent)", fontFamily: "var(--font-body-custom)" }}
              >
                <Sparkles className="size-3.5" />
                Formación en eCommerce
              </span>

              <h1
                className="display-xl mt-6"
                style={{ fontFamily: "var(--font-display-custom)" }}
              >
                {settings?.hero_title ?? course?.title ?? "eCommerce Formation"}
              </h1>

              <p className="lede mt-6 max-w-xl text-white/75">
                {settings?.hero_subtitle ??
                  course?.subtitle ??
                  "Lanza, gestiona y escala tu tienda online con un método probado, paso a paso."}
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-full px-7 text-base font-semibold shadow-lg transition-transform hover:-translate-y-0.5"
                  style={{ backgroundColor: "var(--brand-accent)", color: "#12203a" }}
                >
                  <Link to="/clase-gratis">
                    <PlayCircle className="size-5" />
                    Ver la clase gratuita
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full border-white/25 bg-transparent px-7 text-base text-white hover:bg-white/10 hover:text-white"
                >
                  <a href="#temario">
                    <FileText className="size-5" />
                    Descargar el temario
                  </a>
                </Button>
              </div>

              <ul className="mt-10 grid gap-x-6 gap-y-2.5 text-sm text-white/70 sm:grid-cols-2">
                {[
                  "Acceso de por vida al campus",
                  "Plantillas y recursos descargables",
                  "Tests de autoevaluación por módulo",
                  "Tutor IA entrenado con el curso",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4" style={{ color: "var(--brand-accent)" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Tarjeta destacada: clase gratuita */}
            <Link
              to="/clase-gratis"
              className="glass group reveal block rounded-3xl p-7 transition-transform duration-500 hover:-translate-y-1"
            >
              <span
                className="chip"
                style={{ backgroundColor: "var(--brand-accent)", color: "#12203a" }}
              >
                Gratis · sin tarjeta
              </span>
              <h2
                className="mt-5 text-2xl font-bold leading-tight"
                style={{ fontFamily: "var(--font-display-custom)" }}
              >
                {settings?.free_lesson_title ?? "Clase gratuita"}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                {settings?.free_lesson_subtitle ??
                  "Mira la primera clase completa y comprueba el método antes de decidir."}
              </p>
              <span
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold"
                style={{ color: "var(--brand-accent)" }}
              >
                Empezar ahora
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </Link>
          </div>
        </section>

        {/* 2 · Clase gratuita + PDF del temario */}
        <section id="temario" className="container-x section-y">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow text-muted-foreground">Empieza sin pagar</p>
            <h2 className="display-lg mt-3" style={{ fontFamily: "var(--font-display-custom)" }}>
              Conoce el curso antes de comprarlo
            </h2>
            <p className="lede mt-4 text-muted-foreground">
              Una clase completa y el temario detallado en PDF. Sin compromiso.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <article className="surface card-lift flex flex-col p-8">
              <span
                className="flex size-12 items-center justify-center rounded-2xl"
                style={{ backgroundColor: "var(--brand)", color: "var(--brand-accent)" }}
              >
                <PlayCircle className="size-6" />
              </span>
              <h3
                className="mt-6 text-xl font-bold"
                style={{ fontFamily: "var(--font-display-custom)" }}
              >
                {settings?.free_lesson_title ?? "Clase gratuita"}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                {settings?.free_lesson_subtitle ??
                  "La primera lección del curso, íntegra y en abierto."}
              </p>
              <Button
                asChild
                size="lg"
                className="mt-7 w-fit rounded-full px-6"
                style={{ backgroundColor: "var(--brand)", color: "#fff" }}
              >
                <Link to="/clase-gratis">
                  Ver la clase
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </article>

            <article className="surface card-lift flex flex-col p-8">
              <span
                className="flex size-12 items-center justify-center rounded-2xl"
                style={{ backgroundColor: "var(--brand-accent)", color: "#12203a" }}
              >
                <FileText className="size-6" />
              </span>
              <h3
                className="mt-6 text-xl font-bold"
                style={{ fontFamily: "var(--font-display-custom)" }}
              >
                {settings?.syllabus_title ?? "Temario completo en PDF"}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                {settings?.syllabus_description ??
                  "Módulos, lecciones, duración y para quién es este curso."}
              </p>
              {syllabusUrl ? (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="mt-7 w-fit rounded-full px-6"
                >
                  <a href={syllabusUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="size-4" />
                    Descargar PDF
                  </a>
                </Button>
              ) : (
                <p className="mt-7 text-sm text-muted-foreground">
                  El temario en PDF estará disponible en breve.
                </p>
              )}
            </article>
          </div>
        </section>

        {/* 3 · Beneficios / qué aprenderás */}
        <section className="bg-secondary/40">
          <div className="container-x section-y">
            <div className="max-w-2xl">
              <p className="eyebrow text-muted-foreground">Qué aprenderás</p>
              <h2 className="display-lg mt-3" style={{ fontFamily: "var(--font-display-custom)" }}>
                {settings?.about_title ?? "Un método completo, de la idea a la escala"}
              </h2>
              <p className="lede mt-4 whitespace-pre-wrap text-muted-foreground">
                {settings?.about_body ?? course?.description}
              </p>
            </div>

            {benefits.length > 0 && (
              <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {benefits.map((b) => (
                  <article key={b.title} className="surface card-lift p-6">
                    <BadgeCheck className="size-6" style={{ color: "var(--brand-accent)" }} />
                    <h3
                      className="mt-4 text-base font-bold"
                      style={{ fontFamily: "var(--font-display-custom)" }}
                    >
                      {b.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.body}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Galería */}
        {(galleryUrls ?? []).length > 0 && (
          <section className="container-x section-y">
            <Carousel className="w-full">
              <CarouselContent>
                {(galleryUrls ?? []).map((url) => (
                  <CarouselItem key={url} className="md:basis-1/2">
                    <img
                      src={url}
                      alt="Material y pantallas del curso de eCommerce"
                      loading="lazy"
                      className="h-80 w-full rounded-2xl object-cover shadow-[var(--shadow-soft)]"
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </section>
        )}

        {/* 4 · Testimonios */}
        {testimonials.length > 0 && (
          <section className="container-x section-y">
            <div className="mx-auto max-w-2xl text-center">
              <p className="eyebrow text-muted-foreground">Resultados reales</p>
              <h2 className="display-lg mt-3" style={{ fontFamily: "var(--font-display-custom)" }}>
                Lo que dicen los alumnos
              </h2>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {testimonials.map((t) => (
                <TestimonialCard key={t.id} testimonial={t} />
              ))}
            </div>
          </section>
        )}

        {/* 5 · Precio y CTA de compra */}
        <section id="precio" className="ink-gradient text-white">
          <div className="container-x section-y">
            <div className="mx-auto max-w-3xl text-center">
              <p className="eyebrow" style={{ color: "var(--brand-accent)" }}>
                Acceso completo
              </p>
              <h2
                className="display-lg mt-3"
                style={{ fontFamily: "var(--font-display-custom)" }}
              >
                Cuando estés listo, entra al campus
              </h2>
              <p className="lede mt-4 text-white/70">
                Pago único con acceso de por vida, o suscripción si prefieres empezar poco a poco.
              </p>
            </div>

            <div className="glass mx-auto mt-12 max-w-xl rounded-3xl p-9 text-center">
              {course && (
                <>
                  <p className="text-sm uppercase tracking-widest text-white/60">Pago único</p>
                  <p
                    className="mt-3 text-5xl font-bold"
                    style={{ fontFamily: "var(--font-display-custom)" }}
                  >
                    {formatPrice(course.price_cents, course.currency)}
                  </p>
                </>
              )}
              <ul className="mt-8 space-y-2.5 text-left text-sm text-white/75">
                {[
                  "Todos los módulos y lecciones en vídeo",
                  "Plantillas, checklists y recursos descargables",
                  "Tests con corrección automática y certificado",
                  "Tutor IA con la teoría del curso",
                  "Actualizaciones incluidas",
                ].map((i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2
                      className="mt-0.5 size-4 shrink-0"
                      style={{ color: "var(--brand-accent)" }}
                    />
                    {i}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                size="lg"
                className="mt-9 h-12 w-full rounded-full text-base font-semibold transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: "var(--brand-accent)", color: "#12203a" }}
              >
                <Link to={buyLink}>{settings?.hero_cta ?? "Apuntarme al curso"}</Link>
              </Button>
              <p className="mt-4 flex items-center justify-center gap-2 text-xs text-white/55">
                <ShieldCheck className="size-4" /> Pago seguro con Stripe · acceso inmediato
              </p>
            </div>
          </div>
        </section>

        {/* 6 · FAQ */}
        {faq.length > 0 && (
          <section className="container-x section-y">
            <div className="mx-auto max-w-3xl">
              <p className="eyebrow text-center text-muted-foreground">Dudas frecuentes</p>
              <h2
                className="display-lg mt-3 text-center"
                style={{ fontFamily: "var(--font-display-custom)" }}
              >
                Preguntas frecuentes
              </h2>
              <Accordion type="single" collapsible className="mt-10">
                {faq.map((item, i) => (
                  <AccordionItem key={item.q} value={`faq-${i}`}>
                    <AccordionTrigger className="text-left text-base font-semibold">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-border py-10">
        <div className="container-x flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} TuCurso.com · eCommerce Formation</span>
          <div className="flex items-center gap-5">
            <Link to="/clase-gratis" className="transition-colors hover:text-foreground">
              Clase gratuita
            </Link>
            <Link to="/comprar" className="transition-colors hover:text-foreground">
              Comprar
            </Link>
            <Link to="/creador" className="transition-colors hover:text-foreground">
              Acceso creador
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function TestimonialCard({
  testimonial,
}: {
  testimonial: { id: string; name: string; role: string; quote: string; photo_url: string | null };
}) {
  const { data: photo } = useQuery({
    queryKey: ["asset", testimonial.photo_url],
    queryFn: () => signedAssetUrl(testimonial.photo_url),
    enabled: !!testimonial.photo_url,
  });

  return (
    <figure className="surface card-lift flex h-full flex-col p-7">
      <div className="flex items-center gap-1" style={{ color: "var(--brand-accent)" }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="size-4 fill-current" />
        ))}
      </div>
      <Quote className="mt-5 size-5 text-muted-foreground/40" />
      <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-foreground/85">
        {testimonial.quote}
      </blockquote>
      <figcaption className="mt-7 flex items-center gap-3 border-t border-border pt-5">
        {photo ? (
          <img src={photo} alt={testimonial.name} className="size-11 rounded-full object-cover" />
        ) : (
          <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
            {testimonial.name.charAt(0)}
          </span>
        )}
        <span>
          <span className="block text-sm font-semibold">{testimonial.name}</span>
          <span className="block text-xs text-muted-foreground">{testimonial.role}</span>
        </span>
      </figcaption>
    </figure>
  );
}
