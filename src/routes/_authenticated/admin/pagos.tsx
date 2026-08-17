import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { formatPrice } from "@/lib/course";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/pagos")({
  component: PaymentsAdmin,
});

const STATUS_LABEL: Record<string, string> = {
  paid: "Pagado",
  pending: "Pendiente",
  failed: "Fallido",
  refunded: "Reembolsado",
  disputed: "En disputa",
};

function PaymentsAdmin() {
  const { data: payments } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("payments")
        .select("id, email, amount_cents, currency, status, created_at, refunded_at")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: subscriptions } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("id, user_id, price_id, status, current_period_end, cancel_at_period_end")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: pending } = useQuery({
    queryKey: ["admin-pending"],
    queryFn: async () => {
      const { data } = await supabase
        .from("pending_access")
        .select("id, email, claimed_at, created_at")
        .is("claimed_at", null)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="space-y-10">
      <section>
        <h1 className="font-display text-2xl font-semibold">Pagos</h1>
        <div className="mt-4 overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Importe</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(payments ?? []).map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">{new Date(p.created_at).toLocaleDateString("es-ES")}</td>
                  <td className="px-4 py-3">{p.email ?? "—"}</td>
                  <td className="px-4 py-3">{formatPrice(p.amount_cents, p.currency)}</td>
                  <td className="px-4 py-3">{STATUS_LABEL[p.status] ?? p.status}</td>
                </tr>
              ))}
              {!payments?.length && (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={4}>
                    Todavía no hay pagos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold">Suscripciones</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Próxima renovación</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(subscriptions ?? []).map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3">{s.price_id}</td>
                  <td className="px-4 py-3">
                    {s.status}
                    {s.cancel_at_period_end ? " (cancelará al final del periodo)" : ""}
                  </td>
                  <td className="px-4 py-3">
                    {s.current_period_end
                      ? new Date(s.current_period_end).toLocaleDateString("es-ES")
                      : "—"}
                  </td>
                </tr>
              ))}
              {!subscriptions?.length && (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={3}>
                    Todavía no hay suscripciones.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold">Compras sin cuenta</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Han pagado pero aún no se han registrado. El acceso se activa solo cuando creen su cuenta
          con ese mismo email.
        </p>
        <ul className="mt-4 divide-y rounded-xl border">
          {(pending ?? []).map((p) => (
            <li key={p.id} className="flex justify-between px-4 py-3 text-sm">
              <span>{p.email}</span>
              <span className="text-muted-foreground">
                {new Date(p.created_at).toLocaleDateString("es-ES")}
              </span>
            </li>
          ))}
          {!pending?.length && (
            <li className="px-4 py-6 text-sm text-muted-foreground">Ninguna pendiente.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
