import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { fetchLanding, fetchMyAccess } from "@/lib/course";

export const Route = createFileRoute("/gracias")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } =>
    typeof search['session_id'] === "string"
      ? { session_id: search['session_id'] }
      : {},
  head: () => ({
    meta: [
      { title: "Compra confirmada | TuCurso.com" },
      {
        name: "description",
        content: "Confirmación de tu compra del curso eCommerce Formation y acceso al campus.",
      },
      { property: "og:title", content: "Compra confirmada · eCommerce Formation" },
      { property: "og:description", content: "Tu acceso al campus se activa en cuanto se confirma el pago." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ThanksPage,
});

function ThanksPage() {
  const { user, loading } = useAuth();
  const { data } = useQuery({ queryKey: ["landing"], queryFn: fetchLanding });
  const courseId = data?.course?.id;

  // Access is granted server-side by the payment webhook; this page only polls
  // the database until that confirmation lands.
  const { data: access } = useQuery({
    queryKey: ["access", user?.id, courseId],
    enabled: !!user?.id && !!courseId,
    refetchInterval: (query) => (query.state.data?.hasAccess ? false : 2000),
    queryFn: () => fetchMyAccess(courseId!),
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader variant="light" />
      <main className="mx-auto flex w-full max-w-2xl flex-col items-center px-6 py-20 text-center">
        {!loading && !user ? (
          <>
            <CheckCircle2 className="h-12 w-12 text-accent" />
            <h1 className="mt-6 font-display text-3xl font-semibold">¡Pago recibido!</h1>
            <p className="mt-3 text-muted-foreground">
              Crea tu cuenta usando el mismo email con el que has pagado y el acceso al curso se
              activará automáticamente. También te lo hemos enviado por email.
            </p>
            <Button asChild className="mt-8">
              <Link to="/auth">Crear mi cuenta</Link>
            </Button>
          </>
        ) : access?.hasAccess ? (
          <>
            <CheckCircle2 className="h-12 w-12 text-accent" />
            <h1 className="mt-6 font-display text-3xl font-semibold">¡Pago confirmado!</h1>
            <p className="mt-3 text-muted-foreground">
              Ya tienes acceso completo al curso. Te hemos enviado un email de bienvenida.
            </p>
            <Button asChild className="mt-8">
              <Link to="/curso">Entrar al campus</Link>
            </Button>
          </>
        ) : (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            <h1 className="mt-6 font-display text-2xl font-semibold">Confirmando tu pago…</h1>
            <p className="mt-3 text-muted-foreground">
              Estamos esperando la confirmación del banco. Esto suele tardar unos segundos; puedes
              dejar esta página abierta.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
