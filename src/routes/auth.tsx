import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acceder al campus | TuCurso.com" },
      {
        name: "description",
        content: "Inicia sesión o crea tu cuenta para acceder al campus de eCommerce Formation.",
      },
      { property: "og:title", content: "Acceder al campus | TuCurso.com" },
      {
        property: "og:description",
        content: "Inicia sesión o crea tu cuenta para acceder al campus de eCommerce Formation.",
      },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { next?: string } => {
    const next = typeof s['next'] === "string" ? s['next'] : "";
    // Only same-origin relative paths are allowed as a return target.
    return next.startsWith("/") && !next.startsWith("//") ? { next } : {};
  },
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmSent, setConfirmSent] = useState(false);

  function goAfterAuth() {
    if (next) {
      window.location.href = next;
      return;
    }
    navigate({ to: "/curso" });
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Sesión iniciada");
    goAfterAuth();
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: next ? `${window.location.origin}${next}` : window.location.origin,
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      setConfirmSent(true);
      toast.success("Revisa tu email para confirmar la cuenta");
      return;
    }
    goAfterAuth();
  }

  async function handleReset() {
    if (!email) {
      toast.error("Escribe tu email primero");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Te hemos enviado un enlace para restablecer la contraseña");
  }

  return (
    <main className="ink-panel flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <GraduationCap className="size-5" />
          </span>
          <span className="font-display text-xl font-bold text-ink-foreground">
            TuCurso<span className="text-accent">.com</span>
          </span>
        </Link>

        <div className="surface p-6">
          {confirmSent ? (
            <div className="space-y-3 text-center">
              <h1 className="font-display text-xl font-bold">Confirma tu email</h1>
              <p className="text-sm text-muted-foreground">
                Te hemos enviado un enlace a <strong>{email}</strong>. Ábrelo para activar tu cuenta
                y poder entrar al campus.
              </p>
              <Button variant="outline" onClick={() => setConfirmSent(false)}>
                Volver
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
                <TabsTrigger value="signup">Crear cuenta</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-6">
                <form className="space-y-4" onSubmit={handleLogin}>
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <Input
                      id="login-password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    Entrar
                  </Button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
                  >
                    He olvidado mi contraseña
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-6">
                <form className="space-y-4" onSubmit={handleSignup}>
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nombre completo</Label>
                    <Input
                      id="signup-name"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Contraseña</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    Crear cuenta
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </main>
  );
}
