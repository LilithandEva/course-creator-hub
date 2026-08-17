import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  CreditCard,
  ExternalLink,
  LayoutGrid,
  MessageSquareQuote,
  Palette,
  PlayCircle,
  Receipt,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const nav = [
  { to: "/admin", label: "Alumnos", icon: Users, group: "Campus" },
  { to: "/admin/contenido", label: "Contenido del curso", icon: LayoutGrid, group: "Campus" },
  { to: "/admin/tutor", label: "Tutor IA", icon: Sparkles, group: "Campus" },
  { to: "/admin/clase", label: "Clase gratuita y temario", icon: PlayCircle, group: "Página de venta" },
  { to: "/admin/pagina", label: "Diseño y textos", icon: Palette, group: "Página de venta" },
  { to: "/admin/testimonios", label: "Testimonios", icon: MessageSquareQuote, group: "Página de venta" },
  { to: "/admin/precios", label: "Precios y planes", icon: CreditCard, group: "Negocio" },
  { to: "/admin/pagos", label: "Pagos y suscripciones", icon: Receipt, group: "Negocio" },
] as const;

const groups = ["Campus", "Página de venta", "Negocio"] as const;

function AdminLayout() {
  const { isAdmin, loading, role, user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/creador", replace: true });
  }

  if (loading || role === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Comprobando permisos…
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="surface max-w-md p-10 text-center">
          <ShieldAlert className="mx-auto size-10 text-muted-foreground" />
          <h1 className="mt-4 font-display text-2xl font-bold">Zona restringida</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Solo el creador del curso puede acceder a este panel.
          </p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/curso">Ir a mi curso</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 lg:grid lg:grid-cols-[268px_1fr]">
      <aside className="ink-panel flex flex-col border-r border-white/10 lg:min-h-screen">
        <div className="px-6 py-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Palette className="size-4" />
            </span>
            <span className="font-display text-base font-bold text-ink-foreground">
              Estudio del creador
            </span>
          </Link>
          <p className="mt-2 truncate text-xs text-ink-foreground/50">{user?.email}</p>
        </div>

        <nav className="flex-1 space-y-6 px-3 pb-6">
          {groups.map((group) => (
            <div key={group}>
              <p className="px-3 pb-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink-foreground/40">
                {group}
              </p>
              <ul className="space-y-1">
                {nav
                  .filter((n) => n.group === group)
                  .map((item) => {
                    const active = pathname === item.to;
                    const Icon = item.icon;
                    return (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-200 ${
                            active
                              ? "bg-accent/15 font-semibold text-accent"
                              : "text-ink-foreground/70 hover:bg-white/5 hover:text-ink-foreground"
                          }`}
                        >
                          <Icon className="size-4 shrink-0" />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="space-y-2 border-t border-white/10 px-3 py-4">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-foreground/70 transition-colors hover:bg-white/5 hover:text-ink-foreground"
          >
            <ExternalLink className="size-4" /> Ver página pública
          </a>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-foreground/70 transition-colors hover:bg-white/5 hover:text-ink-foreground"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="px-5 py-10 lg:px-10">
        <div className="mx-auto max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
