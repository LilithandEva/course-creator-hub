import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { KeyRound, LayoutPanelLeft, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/creador")({
  head: () => ({
    meta: [
      { title: "Acceso creador | TuCurso.com" },
      {
        name: "description",
        content:
          "Zona privada del creador del curso: gestiona módulos, vídeos, testimonios y la página de venta de eCommerce Formation.",
      },
      { property: "og:title", content: "Acceso creador | TuCurso.com" },
      {
        property: "og:description",
        content: "Panel privado de gestión de contenido del campus eCommerce Formation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CreatorLogin,
});

function CreatorLogin() {
  const navigate = useNavigate();
  const { user, isAdmin, role } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (user && isAdmin) navigate({ to: "/admin", replace: true });
  }, [user, isAdmin, navigate]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setPending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Bienvenido de nuevo");
  }

  const signedInAsStudent = !!user && role === "student";

  return (
    <div className="ink-gradient flex min-h-screen items-center justify-center px-5 py-14 text-white">
      <div className="grid w-full max-w-4xl gap-10 md:grid-cols-[1fr_0.9fr] md:items-center">
        <div className="reveal">
          <span className="chip glass text-accent">
            <ShieldCheck className="size-3.5" /> Zona privada
          </span>
          <h1 className="display-lg mt-6">Panel del creador</h1>
          <p className="lede mt-4 max-w-md text-white/70">
            Accede a tu estudio de contenido: estructura del curso, vídeos, clase gratuita,
            temario, testimonios y diseño de la página de venta.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/70">
            {[
              "Editor de módulos y lecciones",
              "Gestión de vídeos y recursos",
              "Diseño de la landing con vista previa",
              "Testimonios, precios y alumnos",
            ].map((i) => (
              <li key={i} className="flex items-center gap-2">
                <LayoutPanelLeft className="size-4 text-accent" />
                {i}
              </li>
            ))}
          </ul>
        </div>

        <div className="glass rounded-3xl p-8">
          <h2 className="font-display text-xl font-bold">Iniciar sesión como creador</h2>
          <p className="mt-1 text-sm text-white/60">
            Esta entrada es distinta a la de los alumnos.
          </p>

          <form onSubmit={signIn} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="creator-email" className="text-white/80">
                Email
              </Label>
              <Input
                id="creator-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 border-white/20 bg-white/10 text-white placeholder:text-white/40"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <Label htmlFor="creator-password" className="text-white/80">
                Contraseña
              </Label>
              <Input
                id="creator-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 border-white/20 bg-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={pending}
              className="w-full rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
              Entrar al panel
            </Button>
          </form>

          {signedInAsStudent && (
            <p className="mt-5 rounded-xl border border-white/15 bg-white/5 p-3 text-xs text-white/70">
              Esta cuenta no tiene permisos de creador. Puedes{" "}
              <Link to="/curso" className="underline">
                ir a tu curso
              </Link>{" "}
              o iniciar sesión con la cuenta de administrador.
            </p>
          )}

          <div className="mt-6 flex items-center justify-between text-xs text-white/50">
            <Link to="/auth" className="transition-colors hover:text-white">
              Soy alumno
            </Link>
            <Link to="/reset-password" className="transition-colors hover:text-white">
              He olvidado la contraseña
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
