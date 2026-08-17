import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { signedAssetUrl } from "@/lib/landing";

export const Route = createFileRoute("/_authenticated/admin/pagina")({
  component: AdminLanding,
});

const FONTS = [
  { value: "geometric", label: "Space Grotesk + DM Sans (geométrica)" },
  { value: "serif", label: "Fraunces + DM Sans (editorial)" },
  { value: "grotesk", label: "DM Sans (neutra)" },
];

function AdminLanding() {
  const queryClient = useQueryClient();

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

  const { data: testimonials } = useQuery({
    queryKey: ["admin-testimonials"],
    queryFn: async () => {
      const { data } = await supabase
        .from("testimonials")
        .select("*")
        .order("position", { ascending: true });
      return data ?? [];
    },
  });

  const [form, setForm] = useState({
    hero_title: "",
    hero_subtitle: "",
    hero_cta: "",
    about_title: "",
    about_body: "",
    primary_color: "#0B1D33",
    accent_color: "#F5B544",
    font_family: "geometric",
  });
  const [gallery, setGallery] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setForm({
      hero_title: settings.hero_title,
      hero_subtitle: settings.hero_subtitle,
      hero_cta: settings.hero_cta,
      about_title: settings.about_title,
      about_body: settings.about_body,
      primary_color: settings.primary_color,
      accent_color: settings.accent_color,
      font_family: settings.font_family,
    });
    setGallery(Array.isArray(settings.gallery) ? (settings.gallery as string[]) : []);
  }, [settings]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("landing_settings")
        .update({ ...form, gallery })
        .eq("id", settings!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landing-settings"] });
      queryClient.invalidateQueries({ queryKey: ["landing"] });
      toast.success("Página actualizada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function uploadImage(file: File, onDone: (path: string) => void) {
    setUploading(true);
    const path = `landing/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("public-assets").upload(path, file);
    setUploading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    onDone(path);
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow text-muted-foreground">Panel de administración</p>
        <h1 className="mt-1 font-display text-3xl font-bold">Página de venta</h1>
      </div>

      <section className="surface space-y-4 p-6">
        <h2 className="font-display text-lg font-bold">Textos</h2>
        <div>
          <Label>Título principal</Label>
          <Input
            value={form.hero_title}
            onChange={(e) => setForm({ ...form, hero_title: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Subtítulo</Label>
          <Textarea
            value={form.hero_subtitle}
            onChange={(e) => setForm({ ...form, hero_subtitle: e.target.value })}
            rows={2}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Texto del botón</Label>
          <Input
            value={form.hero_cta}
            onChange={(e) => setForm({ ...form, hero_cta: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Título de la sección "sobre el curso"</Label>
          <Input
            value={form.about_title}
            onChange={(e) => setForm({ ...form, about_title: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Descripción</Label>
          <Textarea
            value={form.about_body}
            onChange={(e) => setForm({ ...form, about_body: e.target.value })}
            rows={5}
            className="mt-1"
          />
        </div>
      </section>

      <section className="surface space-y-4 p-6">
        <h2 className="font-display text-lg font-bold">Diseño</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Color principal</Label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={form.primary_color}
                onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                className="h-10 w-12 cursor-pointer rounded border border-input"
                aria-label="Color principal"
              />
              <Input
                value={form.primary_color}
                onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Color de acento</Label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={form.accent_color}
                onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
                className="h-10 w-12 cursor-pointer rounded border border-input"
                aria-label="Color de acento"
              />
              <Input
                value={form.accent_color}
                onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Tipografía</Label>
            <Select
              value={form.font_family}
              onValueChange={(v) => setForm({ ...form, font_family: v })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONTS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="surface space-y-4 p-6">
        <h2 className="font-display text-lg font-bold">Galería / carrusel</h2>
        <div className="flex flex-wrap gap-3">
          {gallery.map((path) => (
            <GalleryItem
              key={path}
              path={path}
              onRemove={() => setGallery((g) => g.filter((p) => p !== path))}
            />
          ))}
          <label className="flex h-24 w-32 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-xs text-muted-foreground">
            <ImagePlus className="size-5" />
            {uploading ? "Subiendo…" : "Añadir foto"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadImage(file, (path) => setGallery((g) => [...g, path]));
              }}
            />
          </label>
        </div>
      </section>

      <Button size="lg" onClick={() => save.mutate()} disabled={save.isPending || !settings}>
        Guardar cambios
      </Button>

      <TestimonialsEditor
        testimonials={testimonials ?? []}
        onUpload={uploadImage}
        onChange={() => queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] })}
      />
    </div>
  );
}

function GalleryItem({ path, onRemove }: { path: string; onRemove: () => void }) {
  const { data: url } = useQuery({
    queryKey: ["asset", path],
    queryFn: () => signedAssetUrl(path),
  });
  return (
    <div className="relative h-24 w-32 overflow-hidden rounded-md border border-border">
      {url && <img src={url} alt="" className="h-full w-full object-cover" />}
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1 top-1 rounded bg-background/90 p-1"
        aria-label="Quitar imagen"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

type Testimonial = {
  id: string;
  name: string;
  role: string;
  quote: string;
  photo_url: string | null;
  position: number;
  is_visible: boolean;
};

function TestimonialsEditor({
  testimonials,
  onUpload,
  onChange,
}: {
  testimonials: Testimonial[];
  onUpload: (file: File, onDone: (path: string) => void) => void;
  onChange: () => void;
}) {
  const [draft, setDraft] = useState({ name: "", role: "", quote: "", photo_url: "" });

  async function add() {
    if (!draft.name.trim() || !draft.quote.trim()) {
      toast.error("Añade al menos nombre y testimonio");
      return;
    }
    const { error } = await supabase.from("testimonials").insert({
      name: draft.name.trim(),
      role: draft.role.trim(),
      quote: draft.quote.trim(),
      photo_url: draft.photo_url || null,
      position: testimonials.length + 1,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setDraft({ name: "", role: "", quote: "", photo_url: "" });
    toast.success("Testimonio añadido");
    onChange();
  }

  return (
    <section className="surface space-y-4 p-6">
      <h2 className="font-display text-lg font-bold">Testimonios</h2>

      <ul className="space-y-2">
        {testimonials.map((t) => (
          <li
            key={t.id}
            className="flex items-start justify-between gap-3 rounded-md border border-border p-4"
          >
            <div>
              <p className="font-medium">
                {t.name} <span className="text-muted-foreground">· {t.role}</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{t.quote}</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                await supabase.from("testimonials").delete().eq("id", t.id);
                onChange();
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>

      <div className="space-y-3 rounded-md border border-dashed border-border p-4">
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
            value={draft.quote}
            onChange={(e) => setDraft({ ...draft, quote: e.target.value })}
            rows={3}
            className="mt-1"
          />
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm">
          <ImagePlus className="size-4" />
          {draft.photo_url ? "Foto seleccionada" : "Subir foto"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file, (path) => setDraft((d) => ({ ...d, photo_url: path })));
            }}
          />
        </label>
        <div>
          <Button onClick={add} variant="outline">
            <Plus className="mr-1 size-4" /> Añadir testimonio
          </Button>
        </div>
      </div>
    </section>
  );
}
