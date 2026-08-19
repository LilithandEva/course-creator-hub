import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Download, FileText, Lock, PlayCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { bunnyEmbedUrl, fetchLanding, fetchMyAccess } from "@/lib/course";
import { useAuth } from "@/hooks/useAuth";
import { fontStack, signedAssetUrl } from "@/lib/landing";

export const Route = createFileRoute("/clase-gratis")({
  head: () => ({
    meta: [
      { title: "Clase gratuita de eCommerce | TuCurso.com" },
      {
        name: "description",
        content:
          "Mira gratis la primera clase del curso eCommerce Formation y descarga el temario completo en PDF antes de decidir.",
      },
      { property: "og:title", content: "Clase gratuita de eCommerce | TuCurso.com" },
      {
        property: "og:description",
        content: "Primera clase en abierto y temario en PDF del curso eCommerce Formation.",
      },
      { property: "og:type", content: "video.other" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FreeLessonPage,
});

function FreeLessonPage() {
  const { user } = useAuth();
  const { data } = useQuery({ queryKey: ["landing"], queryFn: fetchLanding });
  const settings = data?.settings;
  const course = data?.course;
  const fonts = fontStack(settings?.font_family);
  const embed = bunnyEmbedUrl(settings?.free_lesson_video_url);

  useEffect(() => {
    try {
      sessionStorage.setItem("seen-free-class", "1");
    } catch {
      /* almacenamiento no disponible */
    }
  }, []);

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


  const style = {
    "--brand": settings?.primary_color ?? "#B3121B",
    "--brand-accent": settings?.accent_color ?? "#E11D2E",
    "--font-display-custom": fonts.display,
    "--font-body-custom": fonts.body,
    fontFamily: "var(--font-body-custom)",
  } as React.CSSProperties;

  return (
    <div className="min-h-screen bg-background" style={style}>
      <SiteHeader />

      <main>
        <section className="ink-gradient text-white">
          <div className="container-x py-16">
            <span
              className="chip glass"
              style={{ color: "var(--brand-accent)" }}
            >
              <PlayCircle className="size-3.5" /> Clase gratuita
            </span>
            <h1 className="display-lg mt-5" style={{ fontFamily: "var(--font-display-custom)" }}>
              {settings?.free_lesson_title ?? "Clase gratuita"}
            </h1>
            <p className="lede mt-4 max-w-2xl text-white/70">
              {settings?.free_lesson_subtitle ??
                "Mira la primera clase completa, sin registro y sin pagar nada."}
            </p>
          </div>
        </section>

        <section className="container-x -mt-10 pb-4">
          <div className="overflow-hidden rounded-2xl border border-border bg-black shadow-[var(--shadow-lift)]">
            {embed ? (
              <iframe
                src={embed}
                title={settings?.free_lesson_title ?? "Clase gratuita"}
                loading="lazy"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="aspect-video w-full"
              />
            ) : (
              <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 text-white/60">
                <PlayCircle className="size-10" />
                <p className="text-sm">La clase gratuita se publicará muy pronto.</p>
              </div>
            )}
          </div>
        </section>

        <section className="container-x grid gap-6 py-14 md:grid-cols-2">
          <article className="surface card-lift flex flex-col p-8">
            <span
              className="flex size-12 items-center justify-center rounded-2xl"
              style={{ backgroundColor: "var(--brand-accent)", color: "#fff" }}
            >
              {hasAccess ? <FileText className="size-6" /> : <Lock className="size-6" />}
            </span>
            <h2
              className="mt-6 text-xl font-bold"
              style={{ fontFamily: "var(--font-display-custom)" }}
            >
              {settings?.syllabus_title ?? "Temario completo en PDF"}
            </h2>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
              {hasAccess
                ? (settings?.syllabus_description ??
                  "Descarga el programa detallado: módulos, lecciones, duración y para quién es este curso.")
                : "El temario en PDF es material exclusivo para alumnos del curso."}
            </p>
            {!hasAccess ? (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="mt-7 w-fit rounded-full border-2 px-6 font-bold"
              >
                <Link to="/comprar">
                  <Lock className="size-4" /> Desbloquear con el curso
                </Link>
              </Button>
            ) : syllabusUrl ? (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="mt-7 w-fit rounded-full border-2 px-6 font-bold"
              >
                <a href={syllabusUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="size-4" /> Descargar temario
                </a>
              </Button>
            ) : (
              <p className="mt-7 text-sm text-muted-foreground">Disponible en breve.</p>
            )}
          </article>

          <article className="surface card-lift flex flex-col p-8">
            <h2
              className="text-xl font-bold"
              style={{ fontFamily: "var(--font-display-custom)" }}
            >
              ¿Te ha servido la clase?
            </h2>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
              El curso completo incluye todos los módulos en vídeo, plantillas descargables, tests
              con corrección automática y un tutor IA entrenado con la teoría del curso.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-full px-6"
                style={{ backgroundColor: "var(--brand)", color: "#fff" }}
              >
                <Link to="/comprar">
                  Ver el curso completo <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="rounded-full px-6">
                <Link to="/">Volver a la página del curso</Link>
              </Button>
            </div>
          </article>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} TuCurso.com · eCommerce Formation
      </footer>
    </div>
  );
}
