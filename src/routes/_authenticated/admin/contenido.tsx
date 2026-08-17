import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { fetchCourse } from "@/lib/course";

export const Route = createFileRoute("/_authenticated/admin/contenido")({
  component: AdminContent,
});

type AdminModule = {
  id: string;
  title: string;
  description: string;
  position: number;
  has_quiz: boolean;
  lessons: {
    id: string;
    title: string;
    content: string;
    video_url: string | null;
    duration_minutes: number | null;
    position: number;
    lesson_resources: { id: string; name: string; storage_path: string }[];
  }[];
  quizzes: {
    id: string;
    title: string;
    pass_score: number;
    quiz_questions: {
      id: string;
      prompt: string;
      position: number;
      quiz_options: { id: string; label: string; is_correct: boolean; position: number }[];
    }[];
  }[];
};

function AdminContent() {
  const queryClient = useQueryClient();
  const [newModule, setNewModule] = useState("");

  const { data: course } = useQuery({ queryKey: ["course"], queryFn: fetchCourse });

  const { data: modules, isLoading } = useQuery({
    queryKey: ["admin-modules", course?.id],
    enabled: !!course?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modules")
        .select(
          "id, title, description, position, has_quiz, lessons(id, title, content, video_url, duration_minutes, position, lesson_resources(id, name, storage_path)), quizzes(id, title, pass_score, quiz_questions(id, prompt, position, quiz_options(id, label, is_correct, position)))",
        )
        .eq("course_id", course!.id)
        .order("position", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as AdminModule[];
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-modules"] });

  const createModule = useMutation({
    mutationFn: async (title: string) => {
      const position = (modules ?? []).length + 1;
      const { error } = await supabase
        .from("modules")
        .insert({ course_id: course!.id, title, position, description: "" });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewModule("");
      refresh();
      toast.success("Módulo creado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow text-muted-foreground">Panel de administración</p>
        <h1 className="mt-1 font-display text-3xl font-bold">Contenido del curso</h1>
        <p className="mt-1 text-muted-foreground">
          Organiza módulos, lecciones, descargables y tests.
        </p>
      </div>

      <form
        className="surface flex flex-wrap items-end gap-3 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (newModule.trim()) createModule.mutate(newModule.trim());
        }}
      >
        <div className="min-w-64 flex-1">
          <Label htmlFor="new-module">Nuevo módulo</Label>
          <Input
            id="new-module"
            value={newModule}
            onChange={(e) => setNewModule(e.target.value)}
            placeholder="Ej. Fundamentos del eCommerce"
            className="mt-1"
          />
        </div>
        <Button type="submit" disabled={createModule.isPending}>
          <Plus className="mr-1 size-4" /> Añadir módulo
        </Button>
      </form>

      {isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}

      <div className="space-y-6">
        {(modules ?? []).map((m) => (
          <ModuleCard key={m.id} module={m} onChange={refresh} />
        ))}
      </div>
    </div>
  );
}

function ModuleCard({ module: m, onChange }: { module: AdminModule; onChange: () => void }) {
  const [title, setTitle] = useState(m.title);
  const [description, setDescription] = useState(m.description ?? "");
  const [newLesson, setNewLesson] = useState("");
  const [newVideo, setNewVideo] = useState("");
  const [newContent, setNewContent] = useState("");
  const quiz = m.quizzes?.[0] ?? null;

  async function run(fn: () => PromiseLike<{ error: unknown }>, msg: string) {
    const res = await fn();
    const error = res?.error ?? null;
    if (error) {
      toast.error((error as { message: string }).message);
      return;
    }
    toast.success(msg);
    onChange();
  }

  return (
    <section className="surface overflow-hidden">
      <div className="space-y-3 border-b border-border bg-secondary/50 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="max-w-md" />
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              run(
                () => supabase.from("modules").update({ title, description }).eq("id", m.id),
                "Módulo actualizado",
              )
            }
          >
            Guardar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (confirm("¿Eliminar este módulo y todo su contenido?")) {
                run(() => supabase.from("modules").delete().eq("id", m.id), "Módulo eliminado");
              }
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción del módulo"
          rows={2}
        />
        <div className="flex items-center gap-3">
          <Switch
            id={`quiz-${m.id}`}
            checked={m.has_quiz}
            onCheckedChange={async (checked) => {
              const { error } = await supabase
                .from("modules")
                .update({ has_quiz: checked })
                .eq("id", m.id);
              if (error) {
                toast.error(error.message);
                return;
              }
              if (checked && !quiz) {
                await supabase
                  .from("quizzes")
                  .insert({ module_id: m.id, title: `Test · ${m.title}`, pass_score: 70 });
              }
              onChange();
            }}
          />
          <Label htmlFor={`quiz-${m.id}`}>¿Añadir test a este módulo?</Label>
        </div>
      </div>

      <div className="divide-y divide-border">
        {[...m.lessons]
          .sort((a, b) => a.position - b.position)
          .map((l) => (
            <LessonEditor key={l.id} lesson={l} onChange={onChange} />
          ))}
      </div>

      <form
        className="space-y-3 border-t border-border p-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (!newLesson.trim()) return;
          run(
            () =>
              supabase.from("lessons").insert({
                module_id: m.id,
                title: newLesson.trim(),
                position: m.lessons.length + 1,
                content: newContent,
                video_url: newVideo.trim() || null,
              }),
            "Lección creada",
          ).then(() => {
            setNewLesson("");
            setNewVideo("");
            setNewContent("");
          });
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Nueva lección</Label>
            <Input
              value={newLesson}
              onChange={(e) => setNewLesson(e.target.value)}
              placeholder="Título de la lección"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Vídeo (URL de Bunny Stream)</Label>
            <Input
              value={newVideo}
              onChange={(e) => setNewVideo(e.target.value)}
              placeholder="https://iframe.mediadelivery.net/embed/…"
              className="mt-1"
            />
          </div>
        </div>
        <div>
          <Label>Texto de la lección</Label>
          <Textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={3}
            placeholder="Contenido explicativo (puedes ampliarlo después)"
            className="mt-1"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Los archivos descargables se añaden al editar la lección una vez creada.
        </p>
        <Button type="submit" variant="outline">
          <Plus className="mr-1 size-4" /> Añadir lección
        </Button>
      </form>


      {m.has_quiz && quiz && <QuizEditor quiz={quiz} onChange={onChange} />}
    </section>
  );
}

function LessonEditor({
  lesson,
  onChange,
}: {
  lesson: AdminModule["lessons"][number];
  onChange: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(lesson.title);
  const [content, setContent] = useState(lesson.content ?? "");
  const [video, setVideo] = useState(lesson.video_url ?? "");
  const [duration, setDuration] = useState(lesson.duration_minutes?.toString() ?? "");
  const [uploading, setUploading] = useState(false);

  async function save() {
    const { error } = await supabase
      .from("lessons")
      .update({
        title,
        content,
        video_url: video || null,
        duration_minutes: duration ? Number(duration) : null,
      })
      .eq("id", lesson.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Lección guardada");
    onChange();
  }

  async function uploadResources(files: File[]) {
    if (!files.length) return;
    setUploading(true);
    let ok = 0;
    for (const file of files) {
      const path = `lessons/${lesson.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("course-files").upload(path, file);
      if (error) {
        toast.error(`${file.name}: ${error.message}`);
        continue;
      }
      const { error: insertError } = await supabase
        .from("lesson_resources")
        .insert({ lesson_id: lesson.id, name: file.name, storage_path: path });
      if (insertError) {
        toast.error(`${file.name}: ${insertError.message}`);
        continue;
      }
      ok++;
    }
    setUploading(false);
    if (ok) toast.success(ok === 1 ? "Archivo subido" : `${ok} archivos subidos`);
    onChange();
  }


  return (
    <div className="p-6">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="font-medium">{lesson.title}</span>
        <span className="text-xs text-muted-foreground">{open ? "Cerrar" : "Editar"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <div>
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Vídeo (Bunny Stream: libraryId/videoId o URL embed)</Label>
              <Input value={video} onChange={(e) => setVideo(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Duración (minutos)</Label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label>Texto explicativo</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Descargables</Label>
            <ul className="mt-2 space-y-1 text-sm">
              {lesson.lesson_resources?.map((r) => (
                <li key={r.id} className="flex items-center justify-between">
                  <span>{r.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      await supabase.storage.from("course-files").remove([r.storage_path]);
                      await supabase.from("lesson_resources").delete().eq("id", r.id);
                      onChange();
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
            <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm">
              <FileUp className="size-4" />
              {uploading ? "Subiendo…" : "Subir archivo"}
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadResource(file);
                }}
              />
            </label>
          </div>

          <div className="flex gap-2">
            <Button onClick={save}>Guardar lección</Button>
            <Button
              variant="ghost"
              onClick={async () => {
                if (!confirm("¿Eliminar esta lección?")) return;
                await supabase.from("lessons").delete().eq("id", lesson.id);
                onChange();
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function QuizEditor({
  quiz,
  onChange,
}: {
  quiz: NonNullable<AdminModule["quizzes"][number]>;
  onChange: () => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState(0);

  async function addQuestion() {
    const filled = options.map((o) => o.trim()).filter(Boolean);
    if (!prompt.trim() || filled.length < 2) {
      toast.error("Escribe el enunciado y al menos dos opciones");
      return;
    }
    const { data: question, error } = await supabase
      .from("quiz_questions")
      .insert({
        quiz_id: quiz.id,
        prompt: prompt.trim(),
        position: (quiz.quiz_questions?.length ?? 0) + 1,
      })
      .select("id")
      .single();
    if (error || !question) {
      toast.error(error?.message ?? "Error");
      return;
    }
    const rows = options
      .map((label, i) => ({ label: label.trim(), i }))
      .filter((o) => o.label)
      .map((o, idx) => ({
        question_id: question.id,
        label: o.label,
        is_correct: o.i === correct,
        position: idx + 1,
      }));
    const { error: optError } = await supabase.from("quiz_options").insert(rows);
    if (optError) {
      toast.error(optError.message);
      return;
    }
    setPrompt("");
    setOptions(["", "", "", ""]);
    setCorrect(0);
    toast.success("Pregunta añadida");
    onChange();
  }

  return (
    <div className="border-t border-border bg-secondary/30 p-6">
      <h3 className="font-display text-base font-bold">Test del módulo</h3>
      <div className="mt-4 space-y-3">
        {[...(quiz.quiz_questions ?? [])]
          .sort((a, b) => a.position - b.position)
          .map((q, i) => (
            <div key={q.id} className="rounded-md border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">
                  {i + 1}. {q.prompt}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    await supabase.from("quiz_questions").delete().eq("id", q.id);
                    onChange();
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {[...(q.quiz_options ?? [])]
                  .sort((a, b) => a.position - b.position)
                  .map((o) => (
                    <li key={o.id} className={o.is_correct ? "font-medium text-success" : ""}>
                      {o.is_correct ? "✓" : "○"} {o.label}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
      </div>

      <div className="mt-6 space-y-3 rounded-md border border-dashed border-border p-4">
        <Label>Nueva pregunta</Label>
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enunciado de la pregunta"
        />
        {options.map((o, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              name={`correct-${quiz.id}`}
              checked={correct === i}
              onChange={() => setCorrect(i)}
              aria-label={`Opción correcta ${i + 1}`}
            />
            <Input
              value={o}
              onChange={(e) =>
                setOptions((prev) => prev.map((p, idx) => (idx === i ? e.target.value : p)))
              }
              placeholder={`Opción ${i + 1}`}
            />
          </div>
        ))}
        <Button onClick={addQuestion} variant="outline">
          <Plus className="mr-1 size-4" /> Añadir pregunta
        </Button>
      </div>
    </div>
  );
}
