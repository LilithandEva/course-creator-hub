import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { CourseChatbot } from "@/components/course-chatbot";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { bunnyEmbedUrl, toggleLessonComplete } from "@/lib/course";
import { useAuth } from "@/hooks/useAuth";
import { fetchCourse } from "@/lib/course";

export const Route = createFileRoute("/_authenticated/leccion/$lessonId")({
  component: LessonPage,
});

function LessonPage() {
  const { lessonId } = useParams({ from: "/_authenticated/leccion/$lessonId" });
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: lesson, isLoading } = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("*, modules(id, title), lesson_resources(id, name, storage_path)")
        .eq("id", lessonId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: course } = useQuery({ queryKey: ["course"], queryFn: fetchCourse });
  const courseId = course?.id;

  const { data: progress } = useQuery({
    queryKey: ["progress"],
    queryFn: async () => {
      const { data } = await supabase.from("lesson_progress").select("lesson_id");
      return data ?? [];
    },
  });

  const isDone = (progress ?? []).some((p) => p.lesson_id === lessonId);

  const toggle = useMutation({
    mutationFn: () => toggleLessonComplete(lessonId, !isDone, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      toast.success(isDone ? "Lección marcada como pendiente" : "¡Lección completada!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function downloadResource(path: string, name: string) {
    const { data, error } = await supabase.storage
      .from("course-files")
      .createSignedUrl(path, 60, { download: name });
    if (error || !data) {
      toast.error("No se ha podido preparar la descarga");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  const embed = bunnyEmbedUrl(lesson?.video_url);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-4xl px-4 py-16 text-muted-foreground">Cargando…</div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="font-display text-2xl font-bold">Lección no disponible</h1>
          <p className="mt-2 text-muted-foreground">
            No tienes acceso a esta lección o no existe.
          </p>
          <Button asChild className="mt-6">
            <Link to="/curso">Volver al curso</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <Link
          to="/curso"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Volver al curso
        </Link>

        <p className="eyebrow mt-6 text-muted-foreground">
          {(lesson.modules as { title: string } | null)?.title}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold">{lesson.title}</h1>

        {embed && (
          <div className="mt-6 aspect-video w-full overflow-hidden rounded-xl bg-ink">
            <iframe
              src={embed}
              title={lesson.title}
              loading="lazy"
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="h-full w-full border-0"
            />
          </div>
        )}

        {lesson.content && (
          <article className="surface mt-6 whitespace-pre-wrap p-6 leading-relaxed">
            {lesson.content}
          </article>
        )}

        {(lesson.lesson_resources ?? []).length > 0 && (
          <section className="surface mt-6 p-6">
            <h2 className="font-display text-lg font-bold">Descargables</h2>
            <ul className="mt-4 space-y-2">
              {(lesson.lesson_resources ?? []).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm">
                    <FileText className="size-4 text-muted-foreground" />
                    {r.name}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadResource(r.storage_path, r.name)}
                  >
                    <Download className="mr-1 size-4" /> Descargar
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-8">
          <Button
            onClick={() => toggle.mutate()}
            disabled={toggle.isPending}
            variant={isDone ? "outline" : "default"}
            size="lg"
          >
            <CheckCircle2 className="mr-2 size-5" />
            {isDone ? "Marcar como pendiente" : "Marcar como completada"}
          </Button>
        </div>
      </main>
      <CourseChatbot courseId={courseId} />
    </div>
  );
}
