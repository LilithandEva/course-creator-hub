import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, GraduationCap, PlayCircle, Quote, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
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
          "Aprende a lanzar y escalar tu tienda online paso a paso: módulos en vídeo, plantillas descargables, tests de autoevaluación y acceso de por vida.",
      },
      { property: "og:title", content: "eCommerce Formation · Curso online de eCommerce" },
      {
        property: "og:description",
        content:
          "Curso online completo para lanzar y escalar tu tienda: vídeo, plantillas, tests y campus privado.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { user } = useAuth();
  const { data } = useQuery({ queryKey: ["landing"], queryFn: fetchLanding });

  const settings = data?.settings;
  const course = data?.course;
  const fonts = fontStack(settings?.font_family);

  const galleryPaths = Array.isArray(settings?.gallery) ? (settings.gallery as string[]) : [];
  const { data: galleryUrls } = useQuery({
    queryKey: ["gallery", galleryPaths],
    queryFn: () => signedAssetUrls(galleryPaths),
    enabled: galleryPaths.length > 0,
  });

  const style = {
    "--brand": settings?.primary_color ?? "#0B1D33",
    "--brand-accent": settings?.accent_color ?? "#F5B544",
    "--font-display-custom": fonts.display,
    "--font-body-custom": fonts.body,
  } as React.CSSProperties;

  return (
    <div className="min-h-screen bg-background" style={style}>
      <SiteHeader />

      <main>
        <section
          className="relative overflow-hidden"
          style={{ backgroundColor: "var(--brand)", color: "#fff" }}
        >
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-[1.2fr_1fr] md:items-center">
            <div>
              <p
                className="eyebrow"
                style={{ color: "var(--brand-accent)", fontFamily: "var(--font-body-custom)" }}
              >
                Curso online
              </p>
              <h1
                className="mt-3 text-4xl font-bold leading-tight md:text-5xl"
                style={{ fontFamily: "var(--font-display-custom)" }}
              >
                {settings?.hero_title ?? course?.title ?? "eCommerce Formation"}
              </h1>
              <p
                className="mt-4 max-w-xl text-lg text-white/80"
                style={{ fontFamily: "var(--font-body-custom)" }}
              >
                {settings?.hero_subtitle ?? course?.subtitle}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button
                  asChild
                  size="lg"
                  style={{ backgroundColor: "var(--brand-accent)", color: "#0B1D33" }}
                >
                  <Link to={user ? "/comprar" : "/auth"}>
                    {settings?.hero_cta ?? "Apuntarme al curso"}
                  </Link>
                </Button>
                {course && (
                  <span className="text-lg font-semibold text-white/90">
                    {formatPrice(course.price_cents, course.currency)}
                  </span>
                )}
              </div>

              <ul className="mt-8 grid gap-2 text-sm text-white/75 sm:grid-cols-2">
                {[
                  "Acceso de por vida al campus",
                  "Plantillas y recursos descargables",
                  "Tests de autoevaluación por módulo",
                  "Progreso guardado automáticamente",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4" style={{ color: "var(--brand-accent)" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/5 p-8 backdrop-blur">
              <GraduationCap className="size-10" style={{ color: "var(--brand-accent)" }} />
              <p className="mt-4 text-sm text-white/70">
                Un campus privado con todo el material organizado por módulos y lecciones.
              </p>
              <div className="mt-6 space-y-3 text-sm">
                <p className="flex items-center gap-2">
                  <PlayCircle className="size-4" /> Lecciones en vídeo
                </p>
                <p className="flex items-center gap-2">
                  <ShieldCheck className="size-4" /> Acceso seguro y personal
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h2
            className="text-3xl font-bold"
            style={{ fontFamily: "var(--font-display-custom)", color: "var(--brand)" }}
          >
            {settings?.about_title ?? "Sobre el curso"}
          </h2>
          <p
            className="mt-4 whitespace-pre-wrap text-lg leading-relaxed text-muted-foreground"
            style={{ fontFamily: "var(--font-body-custom)" }}
          >
            {settings?.about_body ?? course?.description}
          </p>
        </section>

        {(galleryUrls ?? []).length > 0 && (
          <section className="mx-auto max-w-5xl px-4 pb-20">
            <Carousel className="w-full">
              <CarouselContent>
                {(galleryUrls ?? []).map((url) => (
                  <CarouselItem key={url} className="md:basis-1/2">
                    <img
                      src={url}
                      alt="Imagen del curso"
                      loading="lazy"
                      className="h-72 w-full rounded-xl object-cover"
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </section>
        )}

        {(data?.testimonials ?? []).length > 0 && (
          <section className="bg-secondary/50 py-20">
            <div className="mx-auto max-w-6xl px-4">
              <h2
                className="text-center text-3xl font-bold"
                style={{ fontFamily: "var(--font-display-custom)", color: "var(--brand)" }}
              >
                Lo que dicen los alumnos
              </h2>
              <div className="mt-10 grid gap-6 md:grid-cols-3">
                {(data?.testimonials ?? [])
                  .filter((t) => t.is_visible)
                  .map((t) => (
                    <TestimonialCard key={t.id} testimonial={t} />
                  ))}
              </div>
            </div>
          </section>
        )}

        <section className="py-20 text-center" style={{ backgroundColor: "var(--brand)" }}>
          <div className="mx-auto max-w-2xl px-4">
            <h2
              className="text-3xl font-bold text-white"
              style={{ fontFamily: "var(--font-display-custom)" }}
            >
              ¿Listo para empezar?
            </h2>
            <p className="mt-3 text-white/75">
              Crea tu cuenta y accede al campus en menos de un minuto.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8"
              style={{ backgroundColor: "var(--brand-accent)", color: "#0B1D33" }}
            >
              <Link to={user ? "/comprar" : "/auth"}>
                {settings?.hero_cta ?? "Apuntarme al curso"}
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} TuCurso.com · eCommerce Formation
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
    <figure className="surface flex h-full flex-col p-6">
      <Quote className="size-6" style={{ color: "var(--brand-accent)" }} />
      <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
        {testimonial.quote}
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3">
        {photo ? (
          <img src={photo} alt={testimonial.name} className="size-10 rounded-full object-cover" />
        ) : (
          <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
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
