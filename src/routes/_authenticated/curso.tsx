import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, CheckCircle2, ClipboardList, Clock, Lock, PlayCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { CourseChatbot } from "@/components/course-chatbot";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  fetchCourse,
  fetchCurriculum,
  fetchMyEnrollment,
  fetchMyProgress,
} from "@/lib/course";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/curso")({
  component: CoursePage,
});

function CoursePage() {
  const { data: course } = useQuery({ queryKey: ["course"], queryFn: fetchCourse });

  const { data: enrollment, isLoading: loadingEnrollment } = useQuery({
    queryKey: ["enrollment", course?.id],
    queryFn: () => fetchMyEnrollment(course!.id),
    enabled: !!course?.id,
  });

  const { data: modules } = useQuery({
    queryKey: ["curriculum", course?.id],
    queryFn: () => fetchCurriculum(course!.id),
    enabled: !!course?.id,
  });

  const { data: progress } = useQuery({ queryKey: ["progress"], queryFn: fetchMyProgress });

  const { data: attempts } = useQuery({
    queryKey: ["attempts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("quiz_attempts")
        .select("id, quiz_id, score, passed, created_at")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const completed = new Set((progress ?? []).map((p) => p.lesson_id));
  const allLessons = (modules ?? []).flatMap((m) => m.lessons);
  const pct = allLessons.length
    ? Math.round((allLessons.filter((l) => completed.has(l.id)).length / allLessons.length) * 100)
    : 0;

  if (!loadingEnrollment && !enrollment) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <Lock className="mx-auto size-10 text-muted-foreground" />
          <h1 className="mt-4 font-display text-2xl font-bold">Aún no tienes acceso al curso</h1>
          <p className="mt-2 text-muted-foreground">
            Tu cuenta está creada, pero todavía no estás inscrito en {course?.title}. Cuando
            completes la compra, el acceso se activa automáticamente.
          </p>
          <Button asChild className="mt-6">
            <Link to="/">Ver la página del curso</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <p className="eyebrow text-muted-foreground">Mi campus</p>
        <h1 className="mt-2 font-display text-3xl font-bold">{course?.title}</h1>
        <p className="mt-1 text-muted-foreground">{course?.subtitle}</p>

        <div className="surface mt-8 p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Tu progreso</p>
              <p className="text-sm text-muted-foreground">
                {allLessons.filter((l) => completed.has(l.id)).length} de {allLessons.length}{" "}
                lecciones completadas
              </p>
            </div>
            <span className="font-display text-3xl font-bold">{pct}%</span>
          </div>
          <Progress value={pct} className="mt-4" />
        </div>

        <div className="mt-10 space-y-6">
          {(modules ?? []).length === 0 && (
            <div className="surface p-8 text-center text-muted-foreground">
              Todavía no hay módulos publicados.
            </div>
          )}

          {(modules ?? []).map((m, i) => {
            const moduleAttempts = (attempts ?? []).filter((a) => a.quiz_id === m.quiz?.id);
            const best = moduleAttempts.reduce<number | null>(
              (acc, a) => (acc === null || a.score > acc ? a.score : acc),
              null,
            );
            return (
              <section key={m.id} className="surface overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-secondary/60 px-6 py-4">
                  <div>
                    <p className="eyebrow text-muted-foreground">Módulo {i + 1}</p>
                    <h2 className="font-display text-lg font-bold">{m.title}</h2>
                    {m.description && (
                      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                        {m.description}
                      </p>
                    )}
                  </div>
                  {m.has_quiz && m.quiz && (
                    <div className="flex items-center gap-3">
                      {best !== null && (
                        <Badge variant="secondary">Mejor nota: {best}%</Badge>
                      )}
                      <Button asChild size="sm" variant="outline">
                        <Link to="/test/$quizId" params={{ quizId: m.quiz.id }}>
                          <ClipboardList className="mr-1 size-4" />
                          Hacer test
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>

                <ul className="divide-y divide-border">
                  {m.lessons.length === 0 && (
                    <li className="px-6 py-4 text-sm text-muted-foreground">
                      Sin lecciones todavía.
                    </li>
                  )}
                  {m.lessons.map((l) => (
                    <li key={l.id}>
                      <Link
                        to="/leccion/$lessonId"
                        params={{ lessonId: l.id }}
                        className="flex items-center gap-3 px-6 py-4 transition-colors hover:bg-secondary/50"
                      >
                        {completed.has(l.id) ? (
                          <CheckCircle2 className="size-5 text-success" />
                        ) : (
                          <PlayCircle className="size-5 text-muted-foreground" />
                        )}
                        <span className="flex-1 text-sm font-medium">{l.title}</span>
                        {l.duration_minutes ? (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="size-3.5" />
                            {l.duration_minutes} min
                          </span>
                        ) : (
                          <BookOpen className="size-4 text-muted-foreground" />
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        {(attempts ?? []).length > 0 && (
          <section className="surface mt-10 p-6">
            <h2 className="font-display text-lg font-bold">Historial de tests</h2>
            <ul className="mt-4 divide-y divide-border text-sm">
              {(attempts ?? []).map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">
                    {new Date(a.created_at).toLocaleString("es-ES")}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="font-medium">{a.score}%</span>
                    <Badge variant={a.passed ? "default" : "secondary"}>
                      {a.passed ? "Aprobado" : "No superado"}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <CourseChatbot courseId={course?.id} />
    </div>
  );
}
