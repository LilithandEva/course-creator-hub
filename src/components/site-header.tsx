import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader({ variant = "light" }: { variant?: "light" | "ink" }) {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const ink = variant === "ink";

  return (
    <header
      className={
        ink
          ? "ink-panel border-b border-white/10"
          : "border-b border-border bg-background/80 backdrop-blur"
      }
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <GraduationCap className="size-5" />
          </span>
          <span className={`font-display text-lg font-bold ${ink ? "text-ink-foreground" : ""}`}>
            TuCurso<span className="text-accent">.com</span>
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          {user ? (
            <>
              {isAdmin && (
                <Button asChild variant={ink ? "secondary" : "ghost"} size="sm">
                  <Link to="/admin">Panel admin</Link>
                </Button>
              )}
              <Button asChild variant={ink ? "secondary" : "ghost"} size="sm">
                <Link to="/curso">Mi curso</Link>
              </Button>
              <Button asChild variant={ink ? "secondary" : "ghost"} size="sm">
                <Link to="/cuenta">Mi cuenta</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={signOut}>
                Salir
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant={ink ? "secondary" : "ghost"} size="sm">
                <Link to="/auth">Iniciar sesión</Link>
              </Button>
              <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/auth">Crear cuenta</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
