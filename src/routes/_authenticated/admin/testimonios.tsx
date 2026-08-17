import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, ImagePlus, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { signedAssetUrl } from "@/lib/landing";

export const Route = createFileRoute("/_authenticated/admin/testimonios")({
  component: AdminTestimonials,
});

type Testimonial = {
  id: string;
  name: string;
  role: string;
  quote: string;
  photo_url: string | null;
  position: number;
  is_visible: boolean;
};

async function uploadPhoto(file: File) {
  const path = `testimonios/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from("public-assets").upload(path, file);
  if (error) throw error;
  return path;
}

function AdminTestimonials() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });

  const { data: testimonials } = useQuery({
    queryKey: ["admin-testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("position", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Testimonial[];
    },
  });

  const [draft, setDraft] = useState({ name: "", role: "", quote: "", photo_url: "" });
  const [uploading, setUploading] = useState(false);

  const add = useMutation({
    mutationFn: async () => {
      if (!draft.name.trim() || !draft.quote.trim())
        throw new Error("Añade al menos nombre y testimonio");
      const { error } = await supabase.from("testimonials").insert({
        name: draft.name.trim(),
        role: draft.role.trim(),
        quote: draft.quote.trim(),
        photo_url: draft.photo_url || null,
        position: (testimonials?.length ?? 0) + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setDraft({ name: "", role: "", quote: "", photo_url: "" });
      toast.success("Testimonio añadido");
      refresh();
      queryClient.invalidateQueries({ queryKey: ["landing"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow text-muted-foreground">Página de venta</p>
        <h1 className="display-lg mt-2">Testimonios</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Edita, oculta o elimina los testimonios que se muestran en la página pública.
        </p>
      </header>

      <section className="surface space-y-4 p-6">
        <h2 className="font-display text-lg font-bold">Nuevo testimonio</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Nombre</Label>
            <Input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Rol / descripción</Label>
            <Input
              value={draft.role}
              onChange={(e) => setDraft({ ...draft, role: e.target.value })}
              className="mt-1"
            />
          </div>
        </div>
        <div>
          <Label>Testimonio</Label>
          <Textarea
            rows={3}
            value={draft.quote}
            onChange={(e) => setDraft({ ...draft, quote: e.target.value })}
            className="mt-1"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-input px-4 py-2 text-sm transition-colors hover:bg-secondary">
            <ImagePlus className="size-4" />
            {uploading ? "Subiendo…" : draft.photo_url ? "Foto lista" : "Subir foto"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                try {
                  const path = await uploadPhoto(file);
                  setDraft((d) => ({ ...d, photo_url: path }));
                } catch (err) {
                  toast.error((err as Error).message);
                } finally {
                  setUploading(false);
                }
              }}
            />
          </label>
          <Button
            className="rounded-full"
            onClick={() => add.mutate()}
            disabled={add.isPending}
          >
            <Plus className="size-4" /> Añadir testimonio
          </Button>
        </div>
      </section>

      <div className="grid gap-4">
        {(testimonials ?? []).map((t) => (
          <TestimonialRow key={t.id} testimonial={t} onChanged={refresh} />
        ))}
        {testimonials?.length === 0 && (
          <p className="text-sm text-muted-foreground">Todavía no hay testimonios.</p>
        )}
      </div>
    </div>
  );
}

function TestimonialRow({
  testimonial,
  onChanged,
}: {
  testimonial: Testimonial;
  onChanged: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: testimonial.name,
    role: testimonial.role,
    quote: testimonial.quote,
    photo_url: testimonial.photo_url ?? "",
  });
  const [busy, setBusy] = useState(false);

  const { data: photo } = useQuery({
    queryKey: ["asset", form.photo_url],
    queryFn: () => signedAssetUrl(form.photo_url),
    enabled: !!form.photo_url,
  });

  async function run(fn: () => PromiseLike<{ error: { message: string } | null }>, msg: string) {
    setBusy(true);
    const { error } = await fn();
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(msg);
    onChanged();
    queryClient.invalidateQueries({ queryKey: ["landing"] });
  }

  return (
    <section className="surface card-lift grid gap-4 p-6 sm:grid-cols-[auto_1fr]">
      <div className="flex flex-col items-center gap-2">
        {photo ? (
          <img src={photo} alt={form.name} className="size-16 rounded-full object-cover" />
        ) : (
          <span className="flex size-16 items-center justify-center rounded-full bg-secondary text-lg font-semibold">
            {form.name.charAt(0) || "?"}
          </span>
        )}
        <label className="cursor-pointer text-xs text-muted-foreground underline">
          Cambiar foto
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const path = await uploadPhoto(file);
                setForm((f) => ({ ...f, photo_url: path }));
              } catch (err) {
                toast.error((err as Error).message);
              }
            }}
          />
        </label>
      </div>

      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
        </div>
        <Textarea
          rows={3}
          value={form.quote}
          onChange={(e) => setForm({ ...form, quote: e.target.value })}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            className="rounded-full"
            disabled={busy}
            onClick={() =>
              run(
                () =>
                  supabase
                    .from("testimonials")
                    .update({ ...form, photo_url: form.photo_url || null })
                    .eq("id", testimonial.id),
                "Testimonio guardado",
              )
            }
          >
            <Save className="size-4" /> Guardar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            disabled={busy}
            onClick={() =>
              run(
                () =>
                  supabase
                    .from("testimonials")
                    .update({ is_visible: !testimonial.is_visible })
                    .eq("id", testimonial.id),
                testimonial.is_visible ? "Testimonio oculto" : "Testimonio visible",
              )
            }
          >
            {testimonial.is_visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            {testimonial.is_visible ? "Visible" : "Oculto"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="rounded-full text-destructive"
            disabled={busy}
            onClick={() =>
              run(
                () => supabase.from("testimonials").delete().eq("id", testimonial.id),
                "Testimonio eliminado",
              )
            }
          >
            <Trash2 className="size-4" /> Eliminar
          </Button>
        </div>
      </div>
    </section>
  );
}
