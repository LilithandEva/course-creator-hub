import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/course";
import { getStripeEnvironment } from "@/lib/stripe";
import { createPortalSession } from "@/lib/payments.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/cuenta")({
  head: () => ({
    meta: [
      { title: "Mi cuenta | TuCurso.com" },
      {
        name: "description",
        content: "Gestiona tus datos, tu contraseña, tu suscripción y tus compras del curso eCommerce Formation.",
      },
      { property: "og:title", content: "Mi cuenta · TuCurso.com" },
      { property: "og:description", content: "Datos personales, contraseña, suscripción y facturación." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccountPage,
});

const STATUS_LABEL: Record<string, string> = {
  active: "Activa",
  trialing: "En prueba",
  past_due: "Pago pendiente",
  canceled: "Cancelada",
  unpaid: "Impagada",
  paused: "En pausa",
  incomplete: "Incompleta",
};

function AccountPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const portal = useServerFn(createPortalSession);

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
  }, [profile?.full_name]);

  const { data: payments } = useQuery({
    queryKey: ["my-payments", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("payments")
        .select("id, amount_cents, currency, status, created_at")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: subscription } = useQuery({
    queryKey: ["my-subscription", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("id, price_id, status, current_period_end, cancel_at_period_end")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  async function saveProfile() {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", user!.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Datos actualizados");
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    }
  }

  async function changePassword() {
    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) toast.error(error.message);
    else {
      setPassword("");
      toast.success("Contraseña actualizada");
    }
  }

  async function openPortal() {
    try {
      const result = await portal({
        data: { environment: getStripeEnvironment(), returnUrl: window.location.href },
      });
      if ("error" in result) throw new Error(result.error);
      window.open(result.url, "_blank", "noopener");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo abrir la gestión de pagos");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-8 px-4 py-10">
        <div>
          <h1 className="font-display text-3xl font-semibold">Mi cuenta</h1>
          <p className="mt-1 text-muted-foreground">{profile?.email ?? user?.email}</p>
        </div>

        <section className="rounded-xl border bg-card p-6">
          <h2 className="font-display text-lg font-semibold">Datos personales</h2>
          <div className="mt-4 space-y-2">
            <Label htmlFor="name">Nombre completo</Label>
            <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <Button className="mt-4" onClick={saveProfile} disabled={saving}>
            Guardar cambios
          </Button>
        </section>

        <section className="rounded-xl border bg-card p-6">
          <h2 className="font-display text-lg font-semibold">Contraseña</h2>
          <div className="mt-4 space-y-2">
            <Label htmlFor="pass">Nueva contraseña</Label>
            <Input
              id="pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <Button className="mt-4" variant="outline" onClick={changePassword}>
            Cambiar contraseña
          </Button>
        </section>

        <section className="rounded-xl border bg-card p-6">
          <h2 className="font-display text-lg font-semibold">Suscripción</h2>
          {subscription ? (
            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
              <p>
                Plan: <span className="text-foreground">{subscription.price_id}</span> ·{" "}
                {STATUS_LABEL[subscription.status] ?? subscription.status}
              </p>
              {subscription.current_period_end && (
                <p>
                  {subscription.cancel_at_period_end ? "Acceso hasta el " : "Se renueva el "}
                  {new Date(subscription.current_period_end).toLocaleDateString("es-ES")}
                </p>
              )}
              <Button className="mt-4" variant="outline" onClick={openPortal}>
                Gestionar suscripción y facturas
              </Button>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              No tienes ninguna suscripción activa.{" "}
              <Link to="/comprar" className="underline">
                Ver planes
              </Link>
            </p>
          )}
        </section>

        <section className="rounded-xl border bg-card p-6">
          <h2 className="font-display text-lg font-semibold">Mis compras</h2>
          {payments?.length ? (
            <ul className="mt-4 divide-y text-sm">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3">
                  <span>{new Date(p.created_at).toLocaleDateString("es-ES")}</span>
                  <span>{formatPrice(p.amount_cents, p.currency)}</span>
                  <span className="text-muted-foreground">{p.status}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Todavía no hay compras registradas.</p>
          )}
        </section>
      </main>
    </div>
  );
}
