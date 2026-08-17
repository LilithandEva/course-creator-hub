import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileUp, PlayCircle, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { bunnyEmbedUrl } from "@/lib/course";
import { signedAssetUrl } from "@/lib/landing";

export const Route = createFileRoute("/_authenticated/admin/clase")({
  component: AdminFreeLesson,
});

function AdminFreeLesson() {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ["landing-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({
    free_lesson_title: "",
    free_lesson_subtitle: "",
    free_lesson_video_url: "",
    syllabus_title: "",
    syllabus_description: "",
    syllabus_pdf_path: "",
  });

  useEffect(() => {
    if (!settings) return;
    setForm({
      free_lesson_title: settings.free_lesson_title ?? "",
      free_lesson_subtitle: settings.free_lesson_subtitle ?? "",
      free_lesson_video_url: settings.free_lesson_video_url ?? "",
      syllabus_title: settings.syllabus_title ?? "",
      syllabus_description: settings.syllabus_description ?? "",
      syllabus_pdf_path: settings.syllabus_pdf_path ?? "",
    });
  }, [settings]);

  const { data: pdfUrl } = useQuery({
    queryKey: ["asset", form.syllabus_pdf_path],
    queryFn: () => signedAssetUrl(form.syllabus_pdf_path),
    enabled: !!form.syllabus_pdf_path,
  });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("landing_settings")
        .update({
          free_lesson_title: form.free_lesson_title,
          free_lesson_subtitle: form.free_lesson_subtitle,
          free_lesson_video_url: form.free_lesson_video_url || null,
          syllabus_title: form.syllabus_title,
          syllabus_description: form.syllabus_description,
          syllabus_pdf_path: form.syllabus_pdf_path || null,
        })
        .eq("id", settings!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landing-settings"] });
      queryClient.invalidateQueries({ queryKey: ["landing"] });
      toast.success("Clase gratuita actualizada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function uploadPdf(file: File) {
    setUploading(true);
    const path = `landing/temario-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from("public-assets")
      .upload(path, file, { contentType: "application/pdf" });
    setUploading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setForm((f) => ({ ...f, syllabus_pdf_path: path }));
    toast.success("PDF subido. Recuerda guardar los cambios.");
  }

  const embed = bunnyEmbedUrl(form.free_lesson_video_url);

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow text-muted-foreground">Página de venta</p>
        <h1 className="display-lg mt-2">Clase gratuita y temario</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Es lo primero que ve un visitante. Publica aquí la clase en abierto y el PDF que explica
          de qué trata el curso.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="surface space-y-4 p-6">
          <div className="flex items-center gap-2">
            <PlayCircle className="size-5 text-accent" />
            <h2 className="font-display text-lg font-bold">Clase gratuita</h2>
          </div>
          <div>
            <Label>Título</Label>
            <Input
              value={form.free_lesson_title}
              onChange={(e) => setForm({ ...form, free_lesson_title: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Descripción corta</Label>
            <Textarea
              rows={3}
              value={form.free_lesson_subtitle}
              onChange={(e) => setForm({ ...form, free_lesson_subtitle: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Vídeo (URL del reproductor o "libraryId/videoId" de Bunny Stream)</Label>
            <Input
              value={form.free_lesson_video_url}
              onChange={(e) => setForm({ ...form, free_lesson_video_url: e.target.value })}
              placeholder="123456/ab12cd34-..."
              className="mt-1"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Los vídeos se alojan en Bunny Stream, nunca en el almacenamiento del campus.
            </p>
          </div>
        </section>

        <section className="surface space-y-3 p-6">
          <h2 className="font-display text-lg font-bold">Vista previa</h2>
          <div className="overflow-hidden rounded-xl border border-border bg-black">
            {embed ? (
              <iframe
                src={embed}
                title="Vista previa clase gratuita"
                allowFullScreen
                className="aspect-video w-full"
              />
            ) : (
              <div className="flex aspect-video items-center justify-center text-sm text-white/50">
                Añade la URL del vídeo
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="surface space-y-4 p-6">
        <h2 className="font-display text-lg font-bold">PDF explicativo del curso</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Título</Label>
            <Input
              value={form.syllabus_title}
              onChange={(e) => setForm({ ...form, syllabus_title: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Descripción</Label>
            <Input
              value={form.syllabus_description}
              onChange={(e) => setForm({ ...form, syllabus_description: e.target.value })}
              className="mt-1"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-input px-4 py-2 text-sm transition-colors hover:bg-secondary">
            <FileUp className="size-4" />
            {uploading ? "Subiendo…" : form.syllabus_pdf_path ? "Reemplazar PDF" : "Subir PDF"}
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadPdf(file);
              }}
            />
          </label>
          {pdfUrl && (
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                <Download className="size-4" /> Ver PDF actual
              </a>
            </Button>
          )}
        </div>
      </section>

      <Button
        size="lg"
        className="rounded-full px-7"
        onClick={() => save.mutate()}
        disabled={save.isPending || !settings}
      >
        <Save className="size-4" /> Guardar cambios
      </Button>
    </div>
  );
}
