import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { fetchCourse } from "@/lib/course";
import { getStripeEnvironment } from "@/lib/stripe";
import { updateCoursePricing } from "@/lib/payments.functions";

export const Route = createFileRoute("/_authenticated/admin/precios")({
  component: PricingAdmin,
});

function PricingAdmin() {
  const queryClient = useQueryClient();
  const save = useServerFn(updateCoursePricing);
  const { data: course } = useQuery({ queryKey: ["course"], queryFn: fetchCourse });

  const [onetime, setOnetime] = useState("");
  const [monthly, setMonthly] = useState("");
  const [yearly, setYearly] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!course) return;
    setOnetime((course.price_cents / 100).toString());
    setMonthly((course.monthly_price_cents / 100).toString());
    setYearly((course.yearly_price_cents / 100).toString());
    setEnabled(course.subscription_enabled);
  }, [course]);

  async function submit() {
    const toCents = (v: string) => Math.round(parseFloat(v.replace(",", ".")) * 100);
    const payload = {
      environment: getStripeEnvironment(),
      onetimeCents: toCents(onetime),
      monthlyCents: toCents(monthly),
      yearlyCents: toCents(yearly),
      subscriptionEnabled: enabled,
    };
    if ([payload.onetimeCents, payload.monthlyCents, payload.yearlyCents].some(Number.isNaN)) {
      toast.error("Revisa los importes");
      return;
    }
    setSaving(true);
    try {
      const result = await save({ data: payload });
      if ("error" in result) throw new Error(result.error);
      toast.success("Precios actualizados en la web y en la pasarela de pago");
      void queryClient.invalidateQueries();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudieron guardar los precios");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Precios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Al guardar, el importe se actualiza a la vez en la web y en la pasarela de pago, así nunca
          anuncias un precio distinto del que se cobra. Los alumnos que ya compraron no se ven
          afectados.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="onetime">Pago único (€)</Label>
        <Input id="onetime" value={onetime} onChange={(e) => setOnetime(e.target.value)} />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <p className="text-sm font-medium">Vender también por suscripción</p>
          <p className="text-xs text-muted-foreground">Muestra los planes mensual y anual en la web.</p>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="monthly">Mensual (€)</Label>
          <Input id="monthly" value={monthly} onChange={(e) => setMonthly(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="yearly">Anual (€)</Label>
          <Input id="yearly" value={yearly} onChange={(e) => setYearly(e.target.value)} />
        </div>
      </div>

      <Button onClick={submit} disabled={saving}>
        {saving ? "Guardando…" : "Guardar precios"}
      </Button>
    </div>
  );
}
