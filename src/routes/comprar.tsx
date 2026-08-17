import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { PaymentTestModeBanner } from "@/components/payment-test-mode-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { fetchLanding, formatPrice } from "@/lib/course";
import { getStripe, getStripeEnvironment, type CoursePlan } from "@/lib/stripe";
import { createCourseCheckoutSession } from "@/lib/payments.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/comprar")({
  head: () => ({
    meta: [
      { title: "Comprar eCommerce Formation | TuCurso.com" },
      {
        name: "description",
        content:
          "Compra el curso eCommerce Formation: pago único de por vida o suscripción mensual/anual, con acceso inmediato al campus.",
      },
      { property: "og:title", content: "Comprar eCommerce Formation" },
      {
        property: "og:description",
        content: "Pago único o suscripción. Acceso inmediato al campus: vídeo, plantillas, tests y tutor con IA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { user } = useAuth();
  const { data } = useQuery({ queryKey: ["landing"], queryFn: fetchLanding });
  const course = data?.course;

  const [plan, setPlan] = useState<CoursePlan>("onetime");
  const [guestEmail, setGuestEmail] = useState("");
  const [started, setStarted] = useState(false);

  const { data: access } = useQuery({
    queryKey: ["access", user?.id, course?.id],
    enabled: !!user?.id && !!course?.id,
    queryFn: async () => {
      const [{ data: enrollment }, { data: subs }] = await Promise.all([
        supabase
          .from("enrollments")
          .select("id")
          .eq("user_id", user!.id)
          .eq("course_id", course!.id)
          .maybeSingle(),
        supabase
          .from("subscriptions")
          .select("id, status, current_period_end")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(1),
      ]);
      const sub = subs?.[0];
      const subActive =
        !!sub &&
        ["active", "trialing", "past_due"].includes(sub.status) &&
        (!sub.current_period_end || new Date(sub.current_period_end) > new Date());
      return { enrolled: !!enrollment, subActive };
    },
  });

  const plans: { id: CoursePlan; label: string; note: string; cents?: number }[] = [
    {
      id: "onetime",
      label: "Pago único",
      note: "Acceso de por vida",
      ...(course ? { cents: course.price_cents } : {}),
    },
    ...(course?.subscription_enabled
      ? ([
          { id: "monthly", label: "Mensual", note: "Cancela cuando quieras", cents: course.monthly_price_cents },
          { id: "yearly", label: "Anual", note: "Ahorra frente al mensual", cents: course.yearly_price_cents },
        ] as const)
      : []),
  ];

  const fetchClientSecret = async () => {
    const result = await createCourseCheckoutSession({
      data: {
        returnUrl: `${window.location.origin}/gracias?session_id={CHECKOUT_SESSION_ID}`,
        environment: getStripeEnvironment(),
        plan,
        ...(user?.email
          ? { customerEmail: user.email }
          : guestEmail
            ? { customerEmail: guestEmail }
            : {}),
        ...(user?.id ? { userId: user.id } : {}),
      },
    });
    if ("error" in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error("No se pudo iniciar el pago");
    return result.clientSecret;
  };

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail);
  const canCheckout = !!user || (started && emailOk);

  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
      <SiteHeader variant="light" />
      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <h1 className="font-display text-3xl font-semibold">{course?.title ?? "Curso"}</h1>
        <p className="mt-2 text-muted-foreground">{course?.subtitle}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {plans.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setPlan(p.id);
                setStarted(false);
              }}
              className={`rounded-xl border p-4 text-left transition-colors ${
                plan === p.id ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"
              }`}
            >
              <p className="text-sm font-medium">{p.label}</p>
              <p className="mt-1 text-xl font-semibold text-primary">
                {p.cents !== undefined && course ? formatPrice(p.cents, course.currency) : "—"}
                {p.id === "monthly" && <span className="text-sm font-normal">/mes</span>}
                {p.id === "yearly" && <span className="text-sm font-normal">/año</span>}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{p.note}</p>
            </button>
          ))}
        </div>

        <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
          {[
            "Todos los módulos, vídeos y plantillas",
            "Tests con corrección automática",
            "Tutor con IA basado en el temario",
            plan === "onetime" ? "Acceso de por vida" : "Acceso mientras la suscripción esté activa",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-accent" /> {item}
            </li>
          ))}
        </ul>

        <div className="mt-10">
          {access?.enrolled || access?.subActive ? (
            <div className="rounded-xl border bg-card p-6">
              <p className="text-sm">Ya tienes acceso a este curso.</p>
              <Button asChild className="mt-4">
                <Link to="/curso">Ir al campus</Link>
              </Button>
            </div>
          ) : !user && plan !== "onetime" ? (
            <div className="rounded-xl border bg-card p-6">
              <p className="text-sm text-muted-foreground">
                Para suscribirte necesitas una cuenta, así podemos gestionar tu renovación y
                cancelación.
              </p>
              <Button asChild className="mt-4">
                <Link to="/auth">Entrar o registrarme</Link>
              </Button>
            </div>
          ) : !canCheckout ? (
            <div className="rounded-xl border bg-card p-6">
              <p className="text-sm text-muted-foreground">
                Puedes comprar ahora sin cuenta: te enviaremos el acceso a este email y crearás tu
                contraseña después.
              </p>
              <div className="mt-4 space-y-2">
                <Label htmlFor="guest-email">Tu email</Label>
                <Input
                  id="guest-email"
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="tu@email.com"
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button disabled={!emailOk} onClick={() => setStarted(true)}>
                  Continuar al pago
                </Button>
                <Button asChild variant="outline">
                  <Link to="/auth">Ya tengo cuenta</Link>
                </Button>
              </div>
            </div>
          ) : (
            <EmbeddedCheckoutProvider
              key={`${plan}-${user?.id ?? guestEmail}`}
              stripe={getStripe()}
              options={{ fetchClientSecret }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          )}
        </div>
      </main>
    </div>
  );
}
