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
type ComparisonRow = { before: string; after: string };

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
    primary_color: "#B3121B",
    accent_color: "#E11D2E",
    font_family: "geometric",
    students_count: 0,
    rating_average: 0,
    reviews_count: 0,
    social_proof_note: "",
    curriculum_title: "",
    curriculum_description: "",
    guarantee_title: "",
    guarantee_body: "",
    certificate_title: "",
    certificate_body: "",
    og_image_url: "",
    comparison_title: "",
    comparison_before_label: "",
    comparison_after_label: "",
    scarcity_enabled: true,
    scarcity_total: 30,
    scarcity_remaining: 30,
    scarcity_note: "",
  });

  const [gallery, setGallery] = useState<string[]>([]);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [faq, setFaq] = useState<Faq[]>([]);
  const [logos, setLogos] = useState<string[]>([]);
  const [comparison, setComparison] = useState<ComparisonRow[]>([]);
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
      students_count: settings.students_count ?? 0,
      rating_average: Number(settings.rating_average ?? 0),
      reviews_count: settings.reviews_count ?? 0,
      social_proof_note: settings.social_proof_note ?? "",
      curriculum_title: settings.curriculum_title ?? "",
      curriculum_description: settings.curriculum_description ?? "",
      guarantee_title: settings.guarantee_title ?? "",
      guarantee_body: settings.guarantee_body ?? "",
      certificate_title: settings.certificate_title ?? "",
      certificate_body: settings.certificate_body ?? "",
      og_image_url: settings.og_image_url ?? "",
      comparison_title: settings.comparison_title ?? "",
      comparison_before_label: settings.comparison_before_label ?? "",
      comparison_after_label: settings.comparison_after_label ?? "",
      scarcity_enabled: settings.scarcity_enabled ?? true,
      scarcity_total: settings.scarcity_total ?? 30,
      scarcity_remaining: settings.scarcity_remaining ?? 30,
      scarcity_note: settings.scarcity_note ?? "",
    });
    setComparison(
      Array.isArray(settings.comparison_rows) ? (settings.comparison_rows as ComparisonRow[]) : [],
    );
    setGallery(Array.isArray(settings.gallery) ? (settings.gallery as string[]) : []);
    setBenefits(Array.isArray(settings.benefits) ? (settings.benefits as Benefit[]) : []);
    setFaq(Array.isArray(settings.faq) ? (settings.faq as Faq[]) : []);
    setLogos(
      Array.isArray(settings.featured_logos) ? (settings.featured_logos as string[]) : [],
    );
  }, [settings]);


  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("landing_settings")
        .update({ ...form, gallery, benefits, faq, featured_logos: logos, comparison_rows: comparison })
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
        <h2 className="font-display text-lg font-bold">Prueba social</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Nº de alumnos</Label>
            <Input
              type="number"
              value={form.students_count}
              onChange={(e) => setForm({ ...form, students_count: Number(e.target.value) })}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Valoración media (0-5)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={form.rating_average}
              onChange={(e) => setForm({ ...form, rating_average: Number(e.target.value) })}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Nº de reseñas</Label>
            <Input
              type="number"
              value={form.reviews_count}
              onChange={(e) => setForm({ ...form, reviews_count: Number(e.target.value) })}
              className="mt-1"
            />
          </div>
        </div>
        <div>
          <Label>Nota debajo de la prueba social</Label>
          <Input
            value={form.social_proof_note}
            onChange={(e) => setForm({ ...form, social_proof_note: e.target.value })}
            className="mt-1"
            placeholder="Ej. Valoración media de los alumnos del último año"
          />
        </div>
        <div>
          <Label>Logos "como visto en" (nombres de marca)</Label>
          <div className="mt-2 space-y-2">
            {logos.map((l, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={l}
                  onChange={(e) => setLogos(logos.map((x, j) => (j === i ? e.target.value : x)))}
                  placeholder="Ej. Forbes"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLogos(logos.filter((_, j) => j !== i))}
                  aria-label="Eliminar logo"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" className="rounded-full" onClick={() => setLogos([...logos, ""])}>
              <Plus className="size-4" /> Añadir marca
            </Button>
          </div>
        </div>
      </section>

      <section className="surface space-y-4 p-6">
        <h2 className="font-display text-lg font-bold">Comparativa "sin curso / con curso"</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Título de la sección</Label>
            <Input
              value={form.comparison_title}
              onChange={(e) => setForm({ ...form, comparison_title: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Etiqueta columna izquierda</Label>
            <Input
              value={form.comparison_before_label}
              onChange={(e) => setForm({ ...form, comparison_before_label: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Etiqueta columna derecha</Label>
            <Input
              value={form.comparison_after_label}
              onChange={(e) => setForm({ ...form, comparison_after_label: e.target.value })}
              className="mt-1"
            />
          </div>
        </div>
        <div className="space-y-3">
          {comparison.map((row, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <Input
                value={row.before}
                placeholder="Sin el curso…"
                onChange={(e) =>
                  setComparison(
                    comparison.map((r, j) => (j === i ? { ...r, before: e.target.value } : r)),
                  )
                }
              />
              <Input
                value={row.after}
                placeholder="Con el curso…"
                onChange={(e) =>
                  setComparison(
                    comparison.map((r, j) => (j === i ? { ...r, after: e.target.value } : r)),
                  )
                }
              />
              <Button
                variant="ghost"
                size="icon"
                aria-label="Eliminar fila"
                onClick={() => setComparison(comparison.filter((_, j) => j !== i))}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => setComparison([...comparison, { before: "", after: "" }])}
          >
            <Plus className="size-4" /> Añadir fila
          </Button>
        </div>
      </section>

      <section className="surface space-y-4 p-6">
        <h2 className="font-display text-lg font-bold">Plazas limitadas (escasez)</h2>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={form.scarcity_enabled}
            onChange={(e) => setForm({ ...form, scarcity_enabled: e.target.checked })}
          />
          Mostrar el contador de plazas en la página de venta
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Plazas totales</Label>
            <Input
              type="number"
              min="1"
              value={form.scarcity_total}
              onChange={(e) => setForm({ ...form, scarcity_total: Number(e.target.value) })}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Plazas restantes</Label>
            <Input
              type="number"
              min="0"
              value={form.scarcity_remaining}
              onChange={(e) => setForm({ ...form, scarcity_remaining: Number(e.target.value) })}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Nota</Label>
            <Input
              value={form.scarcity_note}
              onChange={(e) => setForm({ ...form, scarcity_note: e.target.value })}
              className="mt-1"
              placeholder="Plazas limitadas a este precio"
            />
          </div>
        </div>
      </section>

      <section className="surface space-y-4 p-6">
        <h2 className="font-display text-lg font-bold">Temario, garantía y certificado</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Título del temario</Label>
            <Input
              value={form.curriculum_title}
              onChange={(e) => setForm({ ...form, curriculum_title: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Descripción del temario</Label>
            <Input
              value={form.curriculum_description}
              onChange={(e) => setForm({ ...form, curriculum_description: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Título de la garantía</Label>
            <Input
              value={form.guarantee_title}
              onChange={(e) => setForm({ ...form, guarantee_title: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Título del certificado</Label>
            <Input
              value={form.certificate_title}
              onChange={(e) => setForm({ ...form, certificate_title: e.target.value })}
              className="mt-1"
            />
          </div>
        </div>
        <div>
          <Label>Texto de la garantía / reembolso</Label>
          <Textarea
            rows={3}
            value={form.guarantee_body}
            onChange={(e) => setForm({ ...form, guarantee_body: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Texto del certificado</Label>
          <Textarea
            rows={3}
            value={form.certificate_body}
            onChange={(e) => setForm({ ...form, certificate_body: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Imagen para compartir en redes (URL https pública)</Label>
          <Input
            value={form.og_image_url}
            onChange={(e) => setForm({ ...form, og_image_url: e.target.value })}
            className="mt-1"
            placeholder="https://…/portada.jpg"
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
