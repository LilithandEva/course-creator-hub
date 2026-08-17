import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Plus, Save, Trash2 } from "lucide-react";
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
import { fontStack, signedAssetUrl } from "@/lib/landing";

export const Route = createFileRoute("/_authenticated/admin/pagina")({
  component: AdminLanding,
});

const FONTS = [
  { value: "geometric", label: "Space Grotesk + DM Sans (geométrica)" },
  { value: "serif", label: "Fraunces + DM Sans (editorial)" },
  { value: "grotesk", label: "DM Sans (neutra)" },
];

type Benefit = { title: string; body: string };
type Faq = { q: string; a: string };

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
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [faq, setFaq] = useState<Faq[]>([]);
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
    setBenefits(Array.isArray(settings.benefits) ? (settings.benefits as Benefit[]) : []);
    setFaq(Array.isArray(settings.faq) ? (settings.faq as Faq[]) : []);
  }, [settings]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("landing_settings")
        .update({ ...form, gallery, benefits, faq })
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

  const fonts = fontStack(form.font_family);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-muted-foreground">Página de venta</p>
          <h1 className="display-lg mt-2">Diseño y textos</h1>
        </div>
        <Button
          size="lg"
          className="rounded-full px-7"
          onClick={() => save.mutate()}
          disabled={save.isPending || !settings}
        >
          <Save className="size-4" /> Guardar cambios
        </Button>
      </header>

      {/* Vista previa en vivo */}
      <section className="surface overflow-hidden">
        <p className="border-b border-border px-6 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Vista previa
        </p>
        <div
          className="ink-gradient px-8 py-12 text-white"
          style={
            {
              "--brand": form.primary_color,
              "--brand-accent": form.accent_color,
            } as React.CSSProperties
          }
        >
          <span
            className="chip"
            style={{ backgroundColor: form.accent_color, color: form.primary_color }}
          >
            Clase gratuita
          </span>
          <h2
            className="mt-4 text-3xl font-bold leading-tight"
            style={{ fontFamily: fonts.display }}
          >
            {form.hero_title || "Título principal"}
          </h2>
          <p className="mt-3 max-w-xl text-white/70" style={{ fontFamily: fonts.body }}>
            {form.hero_subtitle || "Subtítulo de la página de venta"}
          </p>
          <span
            className="mt-6 inline-flex rounded-full px-6 py-2.5 text-sm font-semibold"
            style={{ backgroundColor: form.accent_color, color: form.primary_color }}
          >
            {form.hero_cta || "Apuntarme al curso"}
          </span>
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
          <Label>Texto del botón de compra</Label>
          <Input
            value={form.hero_cta}
            onChange={(e) => setForm({ ...form, hero_cta: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Título de "Qué aprenderás"</Label>
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
        <h2 className="font-display text-lg font-bold">Beneficios</h2>
        {benefits.map((b, i) => (
          <div key={i} className="grid gap-2 rounded-lg border border-border p-4 sm:grid-cols-[1fr_2fr_auto]">
            <Input
              value={b.title}
              placeholder="Título"
              onChange={(e) =>
                setBenefits(benefits.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))
              }
            />
            <Input
              value={b.body}
              placeholder="Descripción"
              onChange={(e) =>
                setBenefits(benefits.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))
              }
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setBenefits(benefits.filter((_, j) => j !== i))}
              aria-label="Eliminar beneficio"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => setBenefits([...benefits, { title: "", body: "" }])}
        >
          <Plus className="size-4" /> Añadir beneficio
        </Button>
      </section>

      <section className="surface space-y-4 p-6">
        <h2 className="font-display text-lg font-bold">Preguntas frecuentes</h2>
        {faq.map((f, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-border p-4">
            <div className="flex gap-2">
              <Input
                value={f.q}
                placeholder="Pregunta"
                onChange={(e) => setFaq(faq.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFaq(faq.filter((_, j) => j !== i))}
                aria-label="Eliminar pregunta"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            <Textarea
              rows={2}
              value={f.a}
              placeholder="Respuesta"
              onChange={(e) => setFaq(faq.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))}
            />
          </div>
        ))}
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => setFaq([...faq, { q: "", a: "" }])}
        >
          <Plus className="size-4" /> Añadir pregunta
        </Button>
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
          <label className="flex h-24 w-32 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-xs text-muted-foreground transition-colors hover:bg-secondary">
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

function GalleryItem({ path, onRemove }: { path: string; onRemove: () => void }) {
  const { data: url } = useQuery({
    queryKey: ["asset", path],
    queryFn: () => signedAssetUrl(path),
  });
  return (
    <div className="relative h-24 w-32 overflow-hidden rounded-lg border border-border">
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
