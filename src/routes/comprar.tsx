import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { PaymentTestModeBanner } from "@/components/payment-test-mode-banner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { fetchLanding, formatPrice } from "@/lib/course";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createCourseCheckoutSession } from "@/lib/payments.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/comprar")({
  head: () => ({
    meta: [
      { title: "Comprar eCommerce Formation | TuCurso.com" },
      {
        name: "description",
        content:
          "Compra el curso eCommerce Formation y accede al instante al campus: módulos en vídeo, plantillas, tests y tutor con IA.",
      },
      { property: "og:title", content: "Comprar eCommerce Formation" },
      {
        property: "og:description",
        content: "Acceso inmediato al campus tras el pago: vídeo, plantillas, tests y tutor con IA.",
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

  const { data: enrollment } = useQuery({
    queryKey: ["enrollment", user?.id, course?.id],
    enabled: !!user?.id && !!course?.id,
    queryFn: async () => {
      const { data: row } = await supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", user!.id)
        .eq("course_id", course!.id)
        .maybeSingle();
      return row;
    },
  });

  const fetchClientSecret = async () => {
    const result = await createCourseCheckoutSession({
      data: {
        returnUrl: `${window.location.origin}/gracias?session_id={CHECKOUT_SESSION_ID}`,
        environment: getStripeEnvironment(),
        ...(user?.email ? { customerEmail: user.email } : {}),
        ...(user?.id ? { userId: user.id } : {}),
      },
    });
    if ("error" in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error("No se pudo iniciar el pago");
    return result.clientSecret;
  };

  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
      <SiteHeader variant="light" />
      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <h1 className="font-display text-3xl font-semibold">{course?.title ?? "Curso"}</h1>
        <p className="mt-2 text-muted-foreground">{course?.subtitle}</p>
        <p className="mt-4 text-2xl font-semibold text-primary">
          {course ? formatPrice(course.price_cents, course.currency) : ""}
        </p>

        <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
          {["Acceso de por vida al campus", "Plantillas y recursos descargables", "Tests con corrección automática", "Tutor con IA basado en el temario"].map(
            (item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" /> {item}
              </li>
            ),
          )}
        </ul>

        <div className="mt-10">
          {!user ? (
            <div className="rounded-xl border bg-card p-6">
              <p className="text-sm text-muted-foreground">
                Crea tu cuenta o inicia sesión para completar la compra y recibir el acceso automáticamente.
              </p>
              <Button asChild className="mt-4">
                <Link to="/auth">Entrar o registrarme</Link>
              </Button>
            </div>
          ) : enrollment ? (
            <div className="rounded-xl border bg-card p-6">
              <p className="text-sm">Ya tienes acceso a este curso.</p>
              <Button asChild className="mt-4">
                <Link to="/curso">Ir al campus</Link>
              </Button>
            </div>
          ) : (
            <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          )}
        </div>
      </main>
    </div>
  );
}
