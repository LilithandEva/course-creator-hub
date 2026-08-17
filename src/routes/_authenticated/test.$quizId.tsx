import { useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/test/$quizId")({
  component: QuizPage,
});

type StudentQuiz = {
  id: string;
  title: string;
  pass_score: number;
  questions: { id: string; prompt: string; options: { id: string; label: string }[] }[];
};

type QuizResult = {
  score: number;
  passed: boolean;
  total: number;
  correct: number;
  pass_score: number;
};

function QuizPage() {
  const { quizId } = useParams({ from: "/_authenticated/test/$quizId" });
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);

  const { data: quiz, isLoading } = useQuery({
    queryKey: ["quiz", quizId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_quiz_for_student", { _quiz_id: quizId });
      if (error) throw error;
      return data as unknown as StudentQuiz;
    },
  });

  const { data: attempts } = useQuery({
    queryKey: ["attempts", quizId],
    queryFn: async () => {
      const { data } = await supabase
        .from("quiz_attempts")
        .select("id, score, passed, created_at")
        .eq("quiz_id", quizId)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("submit_quiz", {
        _quiz_id: quizId,
        _answers: answers,
      });
      if (error) throw error;
      return data as unknown as QuizResult;
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["attempts"] });
      toast.success(`Nota: ${data.score}%`);
      void notify({
        data: {
          kind: "quiz",
          quizTitle: quiz?.title ?? "Test del módulo",
          score: data.score,
          passed: data.passed,
        },
      }).catch(() => undefined);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-4 py-16 text-muted-foreground">Cargando test…</div>
      </div>
    );
  }

  const questions = quiz?.questions ?? [];
  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Link
          to="/curso"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Volver al curso
        </Link>

        <h1 className="mt-6 font-display text-3xl font-bold">{quiz?.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {questions.length} preguntas · se aprueba con {quiz?.pass_score}%
        </p>

        {result ? (
          <div className="surface mt-8 p-8 text-center">
            <p className="eyebrow text-muted-foreground">Resultado</p>
            <p className="mt-2 font-display text-6xl font-bold">{result.score}%</p>
            <p className="mt-2 text-muted-foreground">
              {result.correct} de {result.total} respuestas correctas
            </p>
            <Badge className="mt-4" variant={result.passed ? "default" : "secondary"}>
              {result.passed ? "Aprobado" : "No superado"}
            </Badge>
            <div className="mt-6 flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setAnswers({});
                }}
              >
                <RotateCcw className="mr-2 size-4" /> Reintentar
              </Button>
              <Button asChild>
                <Link to="/curso">Volver al curso</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {questions.length === 0 && (
              <div className="surface p-8 text-center text-muted-foreground">
                Este test todavía no tiene preguntas.
              </div>
            )}
            {questions.map((q, i) => (
              <div key={q.id} className="surface p-6">
                <p className="font-medium">
                  {i + 1}. {q.prompt}
                </p>
                <RadioGroup
                  className="mt-4 space-y-2"
                  value={answers[q.id] ?? ""}
                  onValueChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
                >
                  {q.options.map((o) => (
                    <div key={o.id} className="flex items-center gap-3">
                      <RadioGroupItem value={o.id} id={o.id} />
                      <Label htmlFor={o.id} className="cursor-pointer font-normal">
                        {o.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}

            {questions.length > 0 && (
              <Button
                size="lg"
                className="w-full"
                disabled={!allAnswered || submit.isPending}
                onClick={() => submit.mutate()}
              >
                Enviar respuestas
              </Button>
            )}
          </div>
        )}

        {(attempts ?? []).length > 0 && (
          <section className="surface mt-10 p-6">
            <h2 className="font-display text-lg font-bold">Tus intentos anteriores</h2>
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
    </div>
  );
}
