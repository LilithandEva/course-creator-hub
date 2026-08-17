import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileUp, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { fetchCourse } from "@/lib/course";
import { extractPdfChunks } from "@/lib/pdf";

export const Route = createFileRoute("/_authenticated/admin/tutor")({
  component: AdminTutor,
});

function AdminTutor() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string | null>(null);

  const { data: course } = useQuery({ queryKey: ["course"], queryFn: fetchCourse });

  const { data: documents } = useQuery({
    queryKey: ["course-documents"],
    queryFn: async () => {
      const { data } = await supabase
        .from("course_documents")
        .select("id, name, chunk_count, created_at, storage_path")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      setStatus("Leyendo el PDF…");
      const chunks = await extractPdfChunks(file);
      if (chunks.length === 0) {
        throw new Error("No se ha podido extraer texto del PDF (¿es un PDF escaneado?).");
      }

      setStatus("Guardando el archivo…");
      const path = `theory/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("course-files")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data: doc, error: docError } = await supabase
        .from("course_documents")
        .insert({
          course_id: course!.id,
          name: file.name,
          storage_path: path,
          chunk_count: chunks.length,
        })
        .select("id")
        .single();
      if (docError || !doc) throw docError ?? new Error("Error al guardar el documento");

      setStatus(`Indexando ${chunks.length} fragmentos…`);
      for (let i = 0; i < chunks.length; i += 100) {
        const batch = chunks.slice(i, i + 100).map((content, idx) => ({
          document_id: doc.id,
          course_id: course!.id,
          position: i + idx,
          content,
        }));
        const { error } = await supabase.from("course_chunks").insert(batch);
        if (error) throw error;
      }
      return chunks.length;
    },
    onSuccess: (count) => {
      setStatus(null);
      queryClient.invalidateQueries({ queryKey: ["course-documents"] });
      toast.success(`PDF indexado: ${count} fragmentos disponibles para el tutor`);
    },
    onError: (e: Error) => {
      setStatus(null);
      toast.error(e.message);
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow text-muted-foreground">Panel de administración</p>
        <h1 className="mt-1 font-display text-3xl font-bold">Tutor con IA</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Sube el PDF con la teoría del curso. El chatbot responderá a los alumnos inscritos
          usando exclusivamente ese contenido.
        </p>
      </div>

      <section className="surface p-6">
        <Label>Subir PDF de teoría</Label>
        <div className="mt-3 flex items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input px-4 py-2 text-sm">
            <FileUp className="size-4" />
            {upload.isPending ? (status ?? "Procesando…") : "Seleccionar PDF"}
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              disabled={upload.isPending || !course}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload.mutate(file);
              }}
            />
          </label>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          El PDF se guarda en almacenamiento privado; ni el archivo ni las respuestas son
          accesibles para visitantes o alumnos sin acceso.
        </p>
      </section>

      <section className="surface overflow-hidden">
        <h2 className="border-b border-border px-6 py-4 font-display text-lg font-bold">
          Documentos indexados
        </h2>
        {(documents ?? []).length === 0 ? (
          <p className="px-6 py-8 text-sm text-muted-foreground">Todavía no hay material.</p>
        ) : (
          <ul className="divide-y divide-border">
            {(documents ?? []).map((d) => (
              <li key={d.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium">{d.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.chunk_count} fragmentos ·{" "}
                    {new Date(d.created_at).toLocaleDateString("es-ES")}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    if (!confirm("¿Eliminar este documento del tutor?")) return;
                    await supabase.storage.from("course-files").remove([d.storage_path]);
                    await supabase.from("course_documents").delete().eq("id", d.id);
                    queryClient.invalidateQueries({ queryKey: ["course-documents"] });
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
