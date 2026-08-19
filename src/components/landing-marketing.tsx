import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CreditCard, Flame, LifeBuoy, PlayCircle, ShieldCheck, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Fila discreta de sellos de confianza bajo el CTA de compra. */
export function TrustRow({ tone = "light" }: { tone?: "light" | "dark" }) {
  const cls = tone === "dark" ? "text-white/60" : "text-muted-foreground";
  const items = [
    { icon: CreditCard, label: "Pago seguro con Stripe" },
    { icon: ShieldCheck, label: "Garantía de devolución" },
    { icon: LifeBuoy, label: "Soporte del creador" },
  ];
  return (
    <ul
      className={`flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium ${cls}`}
    >
      {items.map(({ icon: Icon, label }) => (
        <li key={label} className="flex items-center gap-1.5">
          <Icon className="size-3.5" style={{ color: "var(--brand-accent)" }} />
          {label}
        </li>
      ))}
    </ul>
  );
}

/** Contador visual de plazas limitadas (valor configurado por el creador). */
export function ScarcityMeter({
  remaining,
  total,
  note,
  tone = "dark",
}: {
  remaining: number;
  total: number;
  note?: string | null;
  tone?: "light" | "dark";
}) {
  const safeTotal = Math.max(total, 1);
  const start = Math.max(Math.min(remaining, safeTotal), 1);
  const floor = Math.max(Math.ceil(start / 2), 1);
  const [safeRemaining, setSafeRemaining] = useState(start);
  const takenPct = Math.round(((safeTotal - safeRemaining) / safeTotal) * 100);
  const dark = tone === "dark";

  // Descenso muy lento de plazas; al llegar al mínimo vuelve a empezar.
  useEffect(() => {
    setSafeRemaining(start);
    const timer = setInterval(() => {
      setSafeRemaining((prev) => (prev <= floor ? start : prev - 1));
    }, 45000);
    return () => clearInterval(timer);
  }, [start, floor]);

  return (
    <div
      className={`rounded-2xl p-5 text-left ${dark ? "glass" : "surface"}`}
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-3">
        <p className={`flex items-center gap-2 text-sm font-bold ${dark ? "" : "text-foreground"}`}>
          <Flame className="size-4" style={{ color: "var(--brand-accent)" }} />
          Solo quedan {safeRemaining} plazas
        </p>
      </div>

      <div
        className={`mt-3 h-2 w-full overflow-hidden rounded-full ${dark ? "bg-white/15" : "bg-secondary"}`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeTotal}
        aria-valuenow={safeTotal - safeRemaining}
      >
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{ width: `${takenPct}%`, backgroundColor: "var(--brand-accent)" }}
        />
      </div>
      {note && (
        <p className={`mt-2 text-xs ${dark ? "text-white/60" : "text-muted-foreground"}`}>{note}</p>
      )}
    </div>
  );
}

const SOCIAL_MESSAGES = [
  "Lucía M. acaba de apuntarse a la clase gratuita",
  "Carlos R. se acaba de inscribir en el curso",
  "Marta G. está viendo la clase gratuita ahora mismo",
  "Javier P. acaba de descargar el temario del curso",
  "Ana S. se acaba de inscribir en el curso",
  "David L. acaba de apuntarse a la clase gratuita",
];


/** Aviso flotante genérico de actividad (sin datos personales inventados). */
export function LiveSocialProof() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    let hideTimer: ReturnType<typeof setTimeout>;
    const show = () => {
      setVisible(true);
      hideTimer = setTimeout(() => {
        setVisible(false);
        setIndex((i) => (i + 1) % SOCIAL_MESSAGES.length);
      }, 6000);
    };
    const first = setTimeout(show, 12000);
    const loop = setInterval(show, 30000);
    return () => {
      clearTimeout(first);
      clearTimeout(hideTimer);
      clearInterval(loop);
    };
  }, [dismissed]);

  if (dismissed) return null;

  return (
    <div
      className={`pointer-events-none fixed bottom-5 left-5 z-40 max-w-xs transition-all duration-500 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
      aria-hidden={!visible}
    >
      <div className="surface pointer-events-auto flex items-start gap-3 rounded-2xl p-4 shadow-[var(--shadow-soft)]">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--brand-accent)", color: "#fff" }}
        >
          <Sparkles className="size-4" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold leading-snug">{SOCIAL_MESSAGES[index]}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Hace unos minutos</p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Cerrar aviso"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

const EXIT_KEY = "exit-intent-free-class";

/** Recordatorio discreto de la clase gratuita al detectar intención de salida. */
export function ExitIntentReminder({ disabled = false }: { disabled?: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (disabled) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (sessionStorage.getItem(EXIT_KEY)) return;

    const onLeave = (e: MouseEvent) => {
      if (e.clientY > 0 || e.relatedTarget) return;
      sessionStorage.setItem(EXIT_KEY, "1");
      setOpen(true);
      document.removeEventListener("mouseout", onLeave);
    };
    document.addEventListener("mouseout", onLeave);
    return () => document.removeEventListener("mouseout", onLeave);
  }, [disabled]);

  if (!open) return null;

  return (
    <div className="fixed inset-x-4 bottom-5 z-50 mx-auto max-w-md sm:inset-x-auto sm:right-5">
      <div className="surface relative rounded-3xl p-6 shadow-[var(--shadow-lift)]">
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Cerrar recordatorio"
          className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" />
        </button>
        <span
          className="flex size-11 items-center justify-center rounded-2xl"
          style={{ backgroundColor: "var(--brand-accent)", color: "#fff" }}
        >
          <PlayCircle className="size-6" />
        </span>
        <h3 className="mt-4 text-lg font-extrabold" style={{ fontFamily: "var(--font-display-custom)" }}>
          ¿Te vas sin ver la clase gratuita?
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Una clase completa del curso, en abierto y sin pagar nada. Míralas antes de decidir.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            asChild
            className="rounded-full px-5 font-bold"
            style={{ backgroundColor: "var(--brand-accent)", color: "#fff" }}
          >
            <Link to="/clase-gratis" onClick={() => setOpen(false)}>
              Ver la clase gratis
            </Link>
          </Button>
          <Button variant="ghost" className="rounded-full" onClick={() => setOpen(false)}>
            Ahora no
          </Button>
        </div>
      </div>
    </div>
  );
}
