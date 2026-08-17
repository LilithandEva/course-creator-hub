import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const tabs = [
  { to: "/admin", label: "Alumnos" },
  { to: "/admin/contenido", label: "Contenido" },
  { to: "/admin/pagina", label: "Página de venta" },
  { to: "/admin/precios", label: "Precios" },
  { to: "/admin/pagos", label: "Pagos" },
  { to: "/admin/tutor", label: "Tutor IA" },
] as const;

function AdminLayout() {
  const { isAdmin, loading, role } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (loading || role === null) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-5xl px-4 py-16 text-muted-foreground">Comprobando permisos…</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-xl px-4 py-20 text-center">
          <ShieldAlert className="mx-auto size-10 text-muted-foreground" />
          <h1 className="mt-4 font-display text-2xl font-bold">Zona restringida</h1>
          <p className="mt-2 text-muted-foreground">
            Solo el administrador puede acceder a este panel.
          </p>
          <Button asChild className="mt-6">
            <Link to="/curso">Ir a mi curso</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader variant="ink" />
      <div className="ink-panel border-b border-white/10">
        <div className="mx-auto flex max-w-6xl gap-1 px-4">
          {tabs.map((t) => {
            const active = pathname === t.to;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  active
                    ? "border-accent text-accent"
                    : "border-transparent text-ink-foreground/70 hover:text-ink-foreground"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <Outlet />
      </main>
    </div>
  );
}
