import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  CheckCircle2,
  Download,
  FileText,
  Lock,
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
import {
  bunnyEmbedUrl,
  fetchLanding,
  fetchMyAccess,
  fetchPublicCurriculum,
  formatPrice,
} from "@/lib/course";
import { fontStack, signedAssetUrl, signedAssetUrls } from "@/lib/landing";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";


export const Route = createFileRoute("/")({
  loader: async () => {
    const { data } = await supabase
      .from("landing_settings")
      .select("og_image_url")
      .limit(1)
      .maybeSingle();
    return { ogImage: data?.og_image_url ?? null };
  },
  head: ({ loaderData }) => {
    const ogImage = loaderData?.ogImage;
    return {
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
        ...(ogImage && ogImage.startsWith("https://")
          ? [
              { property: "og:image", content: ogImage },
              { name: "twitter:image", content: ogImage },
            ]
          : []),
      ],
    };
  },
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

  const { data: access } = useQuery({
    queryKey: ["my-access", course?.id, user?.id],
    queryFn: () => fetchMyAccess(course!.id),
    enabled: !!course?.id && !!user,
  });
  const hasAccess = !!access?.hasAccess;

  const { data: syllabusUrl } = useQuery({
    queryKey: ["syllabus", settings?.syllabus_pdf_path, user?.id],
    queryFn: () => signedAssetUrl(settings?.syllabus_pdf_path),
    enabled: !!settings?.syllabus_pdf_path && hasAccess,
  });

  const { data: publicCurriculum } = useQuery({
    queryKey: ["public-curriculum", course?.id],
    queryFn: () => fetchPublicCurriculum(course!.id),
    enabled: !!course?.id,
  });

  const logos = (Array.isArray(settings?.featured_logos)
    ? settings.featured_logos
    : []) as string[];
  const rating = Number(settings?.rating_average ?? 0);
  const [priceRevealed, setPriceRevealed] = useState(false);
  const hasDiscount =
    !!course?.compare_at_price_cents && course.compare_at_price_cents > course.price_cents;



  const heroEmbed = bunnyEmbedUrl(settings?.free_lesson_video_url);


  const testimonials = (data?.testimonials ?? []).filter((t) => t.is_visible);

  const style = {
    "--brand": settings?.primary_color ?? "#B3121B",
    "--brand-accent": settings?.accent_color ?? "#E11D2E",
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
        {/* 1 · Eslogan + vídeo protagonista */}
        <section className="blaze-gradient relative overflow-hidden">
          <div className="container-x pb-16 pt-14 text-center">
            <span
              className="chip reveal"
              style={{ backgroundColor: "var(--brand-accent)", color: "#fff" }}
            >
              <Sparkles className="size-3.5" />
              Formación en eCommerce
            </span>

            <h1
              className="display-xl reveal mx-auto mt-6 max-w-4xl"
              style={{ fontFamily: "var(--font-display-custom)" }}
            >
              {settings?.hero_title ?? course?.title ?? "Monta tu tienda online y véndele al mundo"}
            </h1>

            <p className="lede reveal mx-auto mt-5 max-w-2xl font-medium text-muted-foreground">
              {settings?.hero_subtitle ??
                course?.subtitle ??
                "Sin humo: el método completo para lanzar, gestionar y escalar tu eCommerce."}
            </p>

            {/* Vídeo protagonista */}
            <div className="reveal mx-auto mt-10 max-w-4xl">
              <div
                className="overflow-hidden rounded-3xl border-4 bg-black shadow-[var(--shadow-lift)]"
                style={{ borderColor: "var(--brand-accent)" }}
              >
                {heroEmbed ? (
                  <iframe
                    src={heroEmbed}
                    title={settings?.free_lesson_title ?? "Vídeo de presentación"}
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                    className="aspect-video w-full"
                  />
                ) : (
                  <Link
                    to="/clase-gratis"
                    className="group flex aspect-video w-full flex-col items-center justify-center gap-4 text-white/80"
                  >
                    <span
                      className="flex size-20 items-center justify-center rounded-full transition-transform group-hover:scale-110"
                      style={{ backgroundColor: "var(--brand-accent)", color: "#fff" }}
                    >
                      <PlayCircle className="size-10" />
                    </span>
                    <span className="text-sm font-semibold uppercase tracking-widest">
                      Ver el vídeo de presentación
                    </span>
                  </Link>
                )}
              </div>

              {/* CTA de compra justo debajo del vídeo */}
              <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Button
                  asChild
                  size="lg"
                  className="glow-cta h-14 rounded-full px-9 text-base font-extrabold uppercase tracking-wide transition-transform hover:-translate-y-0.5"
                  style={{ backgroundColor: "var(--brand-accent)", color: "#fff" }}
                >
                  <Link to={buyLink}>
                    {settings?.hero_cta ?? "Quiero el curso"}
                    <ArrowRight className="size-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-14 rounded-full border-2 px-7 text-base font-bold"
                >
                  <Link to="/clase-gratis">
                    <PlayCircle className="size-5" />
                    Clase gratuita
                  </Link>
                </Button>
              </div>
              {course && (
                <p className="mt-4 text-sm font-medium text-muted-foreground">
                  Acceso completo desde{" "}
                  <span className="font-bold text-foreground">
                    {formatPrice(course.price_cents, course.currency)}
                  </span>{" "}
                  · pago seguro con Stripe
                </p>
              )}
            </div>

            <ul className="mx-auto mt-12 flex max-w-3xl flex-wrap justify-center gap-x-7 gap-y-3 text-sm font-semibold text-muted-foreground">
              {[
                "Acceso de por vida",
                "Plantillas descargables",
                "Tests por módulo",
                "Tutor IA del curso",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="size-4" style={{ color: "var(--brand-accent)" }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 1b · Prueba social cuantificada */}
        {(settings?.students_count || rating > 0 || logos.length > 0) && (
          <section className="border-y border-border bg-secondary/40">
            <div className="container-x py-10">
              <div className="grid items-center gap-8 md:grid-cols-[auto_1fr]">
                <div className="flex flex-wrap items-center justify-center gap-10">
                  {!!settings?.students_count && (
                    <div className="text-center">
                      <p
                        className="text-4xl font-extrabold"
                        style={{ fontFamily: "var(--font-display-custom)" }}
                      >
                        {new Intl.NumberFormat("es-ES").format(settings.students_count)}+
                      </p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Alumnos
                      </p>
                    </div>
                  )}
                  {rating > 0 && (
                    <div className="text-center">
                      <div
                        className="flex items-center justify-center gap-1"
                        style={{ color: "var(--brand-accent)" }}
                        aria-label={`Valoración media ${rating} sobre 5`}
                      >
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`size-5 ${i < Math.round(rating) ? "fill-current" : "opacity-30"}`}
                          />
                        ))}
                      </div>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        {rating.toFixed(1)}/5
                        {!!settings?.reviews_count && ` · ${settings.reviews_count} reseñas`}
                      </p>
                    </div>
                  )}
                </div>

                {logos.length > 0 && (
                  <div className="text-center md:text-right">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Como visto en
                    </p>
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 md:justify-end">
                      {logos.map((logo) => (
                        <span key={logo} className="text-lg font-bold text-foreground/60">
                          {logo}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {settings?.social_proof_note && (
                <p className="mt-6 text-center text-sm text-muted-foreground">
                  {settings.social_proof_note}
                </p>
              )}
            </div>
          </section>
        )}



        {/* 2 · Clase gratuita + temario (solo alumnos) */}
        <section id="temario" className="container-x section-y">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow" style={{ color: "var(--brand-accent)" }}>
              Empieza sin pagar
            </p>
            <h2 className="display-lg mt-3" style={{ fontFamily: "var(--font-display-custom)" }}>
              Conoce el curso antes de comprarlo
            </h2>
            <p className="lede mt-4 text-muted-foreground">
              Una clase completa en abierto. El temario detallado en PDF es material del curso.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <article className="surface card-lift flex flex-col p-8">
              <span
                className="flex size-12 items-center justify-center rounded-2xl"
                style={{ backgroundColor: "var(--brand-accent)", color: "#fff" }}
              >
                <PlayCircle className="size-6" />
              </span>
              <h3
                className="mt-6 text-xl font-extrabold"
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
                className="mt-7 w-fit rounded-full px-6 font-bold"
                style={{ backgroundColor: "var(--brand-accent)", color: "#fff" }}
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
                style={{ backgroundColor: "var(--brand)", color: "#fff" }}
              >
                {hasAccess ? <FileText className="size-6" /> : <Lock className="size-6" />}
              </span>
              <h3
                className="mt-6 text-xl font-extrabold"
                style={{ fontFamily: "var(--font-display-custom)" }}
              >
                {settings?.syllabus_title ?? "Temario completo en PDF"}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                {hasAccess
                  ? (settings?.syllabus_description ??
                    "Módulos, lecciones, duración y para quién es este curso.")
                  : "Material exclusivo para alumnos: al comprar el curso podrás descargar el temario completo en PDF."}
              </p>
              {hasAccess ? (
                syllabusUrl ? (
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="mt-7 w-fit rounded-full border-2 px-6 font-bold"
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
                )
              ) : (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="mt-7 w-fit rounded-full border-2 px-6 font-bold"
                >
                  <Link to={buyLink}>
                    <Lock className="size-4" />
                    Desbloquear con el curso
                  </Link>
                </Button>
              )}
            </article>
          </div>
        </section>


        {/* 2b · Temario en la página (acordeón) */}
        {(publicCurriculum ?? []).length > 0 && (
          <section className="bg-background">
            <div className="container-x section-y">
              <div className="mx-auto max-w-2xl text-center">
                <p className="eyebrow" style={{ color: "var(--brand-accent)" }}>
                  Programa completo
                </p>
                <h2
                  className="display-lg mt-3"
                  style={{ fontFamily: "var(--font-display-custom)" }}
                >
                  {settings?.curriculum_title ?? "El temario, módulo a módulo"}
                </h2>
                <p className="lede mt-4 text-muted-foreground">
                  {settings?.curriculum_description ??
                    "Esto es exactamente lo que vas a ver dentro del campus."}
                </p>
              </div>

              <div className="surface mx-auto mt-10 max-w-3xl px-6 py-2">
                <Accordion type="single" collapsible>
                  {(publicCurriculum ?? []).map((mod, i) => (
                    <AccordionItem key={mod.id} value={mod.id}>
                      <AccordionTrigger className="text-left">
                        <span className="flex flex-1 items-center gap-3 pr-3">
                          <span
                            className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                            style={{ backgroundColor: "var(--brand-accent)", color: "#fff" }}
                          >
                            {i + 1}
                          </span>
                          <span className="text-base font-bold">{mod.title}</span>
                          <span className="ml-auto whitespace-nowrap text-xs font-medium text-muted-foreground">
                            {mod.lessons.length} lecciones
                            {mod.has_quiz && " · test"}
                          </span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        {mod.description && (
                          <p className="mb-3 text-sm text-muted-foreground">{mod.description}</p>
                        )}
                        <ul className="space-y-2">
                          {mod.lessons.map((l) => (
                            <li key={l.id} className="flex items-center gap-2 text-sm">
                              <PlayCircle
                                className="size-4 shrink-0"
                                style={{ color: "var(--brand-accent)" }}
                              />
                              <span className="flex-1">{l.title}</span>
                              {l.duration_minutes ? (
                                <span className="text-xs text-muted-foreground">
                                  {l.duration_minutes} min
                                </span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          </section>
        )}

        {/* 2c · Certificación */}
        <section className="container-x pb-4">
          <div className="surface flex flex-col items-center gap-6 p-8 text-center sm:flex-row sm:text-left">
            <span
              className="flex size-16 shrink-0 items-center justify-center rounded-2xl"
              style={{ backgroundColor: "var(--brand)", color: "#fff" }}
            >
              <Award className="size-8" />
            </span>
            <div>
              <h3
                className="text-xl font-extrabold"
                style={{ fontFamily: "var(--font-display-custom)" }}
              >
                {settings?.certificate_title ?? "Certificado de finalización"}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {settings?.certificate_body ??
                  "Al superar todos los tests recibes un certificado digital con tu nombre."}
              </p>
            </div>
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
              {!priceRevealed ? (
                <>
                  <p className="text-sm uppercase tracking-widest text-white/60">
                    Oferta de acceso
                  </p>
                  <p
                    className="mt-3 text-4xl font-bold"
                    style={{ fontFamily: "var(--font-display-custom)" }}
                  >
                    Precio oculto
                  </p>
                  <p className="mt-4 text-sm text-white/70">
                    Pulsa el botón y te enseñamos el precio y todo lo que incluye.
                  </p>
                </>
              ) : (
                <>
                  {course && (
                    <>
                      <p className="text-sm uppercase tracking-widest text-white/60">Pago único</p>
                      <div className="mt-3 flex items-baseline justify-center gap-3">
                        {hasDiscount && (
                          <span className="text-2xl font-semibold text-white/45 line-through">
                            {formatPrice(course.compare_at_price_cents!, course.currency)}
                          </span>
                        )}
                        <span
                          className="text-5xl font-bold"
                          style={{ fontFamily: "var(--font-display-custom)" }}
                        >
                          {formatPrice(course.price_cents, course.currency)}
                        </span>
                      </div>
                      {hasDiscount && (
                        <p
                          className="mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
                          style={{ backgroundColor: "var(--brand-accent)", color: "#fff" }}
                        >
                          Ahorras{" "}
                          {formatPrice(
                            course.compare_at_price_cents! - course.price_cents,
                            course.currency,
                          )}
                        </p>
                      )}
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
                </>
              )}

              {priceRevealed ? (
                <Button
                  asChild
                  size="lg"
                  className="mt-9 h-12 w-full rounded-full text-base font-semibold transition-transform hover:-translate-y-0.5"
                  style={{ backgroundColor: "var(--brand-accent)", color: "#fff" }}
                >
                  <Link to={buyLink}>Quiero empezar ya</Link>
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={() => setPriceRevealed(true)}
                  className="mt-9 h-12 w-full rounded-full text-base font-semibold transition-transform hover:-translate-y-0.5"
                  style={{ backgroundColor: "var(--brand-accent)", color: "#fff" }}
                >
                  Quiero empezar ya
                </Button>
              )}
              <p className="mt-4 flex items-center justify-center gap-2 text-xs text-white/55">
                <ShieldCheck className="size-4" /> Pago seguro con Stripe · acceso inmediato
              </p>
            </div>

            {/* Garantía / reembolso */}
            <div className="glass mx-auto mt-8 flex max-w-xl items-start gap-4 rounded-2xl p-6 text-left">
              <ShieldCheck
                className="mt-0.5 size-8 shrink-0"
                style={{ color: "var(--brand-accent)" }}
              />
              <div>
                <p className="text-base font-bold">
                  {settings?.guarantee_title ?? "Garantía de 14 días"}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-white/70">
                  {settings?.guarantee_body ??
                    "Si el curso no es para ti, escríbenos dentro de los primeros 14 días y te devolvemos el importe íntegro."}
                </p>
              </div>
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
