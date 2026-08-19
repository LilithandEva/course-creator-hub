import { useState, type CSSProperties, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Question = { id: string; title: string; options: string[] };

const QUESTIONS: Question[] = [
  {
    id: "situacion",
    title: "¿Cuál es tu situación actual con el eCommerce?",
    options: [
      "Todavía no tengo tienda, estoy empezando de cero",
      "Tengo tienda pero apenas vendo",
      "Ya vendo, pero quiero escalar",
      "Vendo en otras plataformas (Amazon, marketplaces) y quiero mi propia tienda",
    ],
  },
  {
    id: "ingresos",
    title: "¿Cuántos ingresos mensuales te gustaría alcanzar con tu tienda?",
    options: [
      "Menos de 1.000 €",
      "Entre 1.000 € y 3.000 €",
      "Entre 3.000 € y 10.000 €",
      "Más de 10.000 €",
    ],
  },
  {
    id: "tiempo",
    title: "¿Cuántas horas al día puedes dedicarle a esto?",
    options: [
      "Menos de 1 hora",
      "1-2 horas",
      "3-5 horas",
      "Es mi prioridad, le dedico el tiempo que haga falta",
    ],
  },
  {
    id: "freno",
    title: "¿Cuál es tu mayor freno ahora mismo?",
    options: [
      "No sé por dónde empezar",
      "No tengo proveedores/producto claro",
      "Sé montar la tienda pero no consigo ventas",
      "Tengo ventas pero no controlo márgenes ni escalo",
    ],
  },
  {
    id: "decision",
    title: "¿Cuánto de decidido estás a cambiar esto en los próximos meses?",
    options: [
      "Solo estoy curioseando",
      "Bastante decidido, buscando el método correcto",
      "Muy decidido, quiero empezar ya",
      "Es innegociable, voy a hacerlo sí o sí",
    ],
  },
];

/** CTA de compra que abre un mini cuestionario de 5 preguntas antes del checkout. */
export function BuyQuizCta({
  children,
  className,
  style,
  size = "lg",
  variant,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "secondary" | "ghost";
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const question = QUESTIONS[step]!;
  const progress = Math.round((step / QUESTIONS.length) * 100);

  function choose(option: string) {
    const next = { ...answers, [question.id]: option };
    setAnswers(next);
    if (step + 1 < QUESTIONS.length) {
      setStep(step + 1);
      return;
    }
    try {
      sessionStorage.setItem("buy-quiz-answers", JSON.stringify(next));
    } catch {
      /* almacenamiento no disponible */
    }
    setOpen(false);
    navigate({ to: "/comprar" });
  }

  return (
    <>
      <Button
        size={size}
        {...(variant ? { variant } : {})}
        {...(className ? { className } : {})}
        {...(style ? { style } : {})}
        onClick={() => {
          setStep(0);
          setAnswers({});
          setOpen(true);
        }}
      >
        {children}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-left text-xl font-extrabold">
              {question.title}
            </DialogTitle>
            <DialogDescription className="text-left">
              Pregunta {step + 1} de {QUESTIONS.length} · así adaptamos el curso a tu punto de
              partida.
            </DialogDescription>
          </DialogHeader>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full transition-[width] duration-300"
              style={{ width: `${progress}%`, backgroundColor: "var(--brand-accent)" }}
            />
          </div>

          <div className="mt-2 grid gap-2.5">
            {question.options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => choose(option)}
                className="rounded-xl border border-border p-4 text-left text-sm font-medium transition-colors hover:border-transparent hover:bg-accent/10"
              >
                {option}
              </button>
            ))}
          </div>

          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="mt-1 text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              Volver
            </button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
