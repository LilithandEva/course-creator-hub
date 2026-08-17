import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nueva contraseña | TuCurso.com" },
      { name: "description", content: "Define una nueva contraseña para tu cuenta del campus." },
      { property: "og:title", content: "Nueva contraseña | TuCurso.com" },
      {
        property: "og:description",
        content: "Define una nueva contraseña para tu cuenta del campus.",
      },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Contraseña actualizada");
    navigate({ to: "/curso" });
  }

  return (
    <main className="ink-panel flex min-h-screen items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="surface w-full max-w-md space-y-4 p-6">
        <h1 className="font-display text-xl font-bold">Nueva contraseña</h1>
        <p className="text-sm text-muted-foreground">
          Escribe la nueva contraseña de tu cuenta. Si has llegado aquí sin pedir un
          restablecimiento, puedes cerrar esta página.
        </p>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          Guardar contraseña
        </Button>
      </form>
    </main>
  );
}
