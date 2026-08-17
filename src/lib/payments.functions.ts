import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  type StripeEnv,
  createStripeClient,
  getStripeErrorMessage,
} from "@/lib/stripe.server";
import {
  type CoursePlan,
  PLAN_LOOKUP_KEYS,
  isCoursePlan,
  isValidEmail,
  resolveOrCreateCustomer,
  resolvePlanPrice,
} from "@/lib/payments.server";

type CheckoutInput = {
  returnUrl: string;
  environment: StripeEnv;
  plan: CoursePlan;
  customerEmail?: string;
  userId?: string;
};

type CheckoutSessionResult = { clientSecret: string } | { error: string };

export const createCourseCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator((data: CheckoutInput) => {
    if (!data?.returnUrl) throw new Error("Falta la URL de retorno");
    if (data.environment !== "sandbox" && data.environment !== "live") {
      throw new Error("Entorno de pago no válido");
    }
    if (!isCoursePlan(data.plan)) throw new Error("Plan no válido");
    if (data.plan !== "onetime" && !data.userId) {
      throw new Error("Para suscribirte necesitas iniciar sesión");
    }
    if (!data.userId) {
      if (!data.customerEmail || !isValidEmail(data.customerEmail)) {
        throw new Error("Introduce un email válido para recibir tu acceso");
      }
    }
    return data;
  })
  .handler(async ({ data }): Promise<CheckoutSessionResult> => {
    try {
      const stripe = createStripeClient(data.environment);
      const stripePrice = await resolvePlanPrice(stripe, data.plan);
      const isRecurring = stripePrice.type === "recurring";

      const customerId = await resolveOrCreateCustomer(stripe, {
        ...(data.customerEmail ? { email: data.customerEmail } : {}),
        ...(data.userId ? { userId: data.userId } : {}),
      });

      const productId =
        typeof stripePrice.product === "string" ? stripePrice.product : stripePrice.product.id;
      const product = await stripe.products.retrieve(productId);

      const metadata: Record<string, string> = {
        ...(data.userId ? { userId: data.userId } : {}),
        ...(data.customerEmail ? { buyerEmail: data.customerEmail } : {}),
        plan: data.plan,
        managed_payments: "true",
      };

      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: stripePrice.id, quantity: 1 }],
        mode: isRecurring ? "subscription" : "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer: customerId,
        ...(isRecurring
          ? { subscription_data: { metadata } }
          : { payment_intent_data: { description: product.name } }),
        managed_payments: { enabled: true },
        metadata,
      } as never);

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

type PortalResult = { url: string } | { error: string };

export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { returnUrl?: string; environment: StripeEnv }) => {
    if (data.environment !== "sandbox" && data.environment !== "live") {
      throw new Error("Entorno de pago no válido");
    }
    return data;
  })
  .handler(async ({ data, context }): Promise<PortalResult> => {
    const { supabase, userId } = context;
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub?.stripe_customer_id) return { error: "No hay ninguna suscripción activa" };

    try {
      const stripe = createStripeClient(data.environment);
      const portal = await stripe.billingPortal.sessions.create({
        customer: sub.stripe_customer_id,
        ...(data.returnUrl && { return_url: data.returnUrl }),
      });
      return { url: portal.url };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

type PricingInput = {
  environment: StripeEnv;
  onetimeCents: number;
  monthlyCents: number;
  yearlyCents: number;
  subscriptionEnabled: boolean;
};

type PricingResult = { ok: true } | { error: string };

// Admin-only. Updates the gateway catalogue first, then mirrors the amounts in
// the database so the public page can never advertise a price we don't charge.
export const updateCoursePricing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: PricingInput) => {
    const amounts = [data.onetimeCents, data.monthlyCents, data.yearlyCents];
    if (amounts.some((a) => !Number.isInteger(a) || a < 100 || a > 5_000_00)) {
      throw new Error("Los importes deben estar entre 1 € y 5.000 €");
    }
    if (data.environment !== "sandbox" && data.environment !== "live") {
      throw new Error("Entorno de pago no válido");
    }
    return data;
  })
  .handler(async ({ data, context }): Promise<PricingResult> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) return { error: "Solo el administrador puede cambiar los precios" };

    try {
      const stripe = createStripeClient(data.environment);

      const plans: { plan: CoursePlan; amount: number; interval?: "month" | "year" }[] = [
        { plan: "onetime", amount: data.onetimeCents },
        { plan: "monthly", amount: data.monthlyCents, interval: "month" },
        { plan: "yearly", amount: data.yearlyCents, interval: "year" },
      ];

      for (const entry of plans) {
        const current = await resolvePlanPrice(stripe, entry.plan);
        if (current.unit_amount === entry.amount) continue;
        const productId =
          typeof current.product === "string" ? current.product : current.product.id;
        await stripe.prices.create({
          product: productId,
          currency: current.currency,
          unit_amount: entry.amount,
          lookup_key: PLAN_LOOKUP_KEYS[entry.plan],
          transfer_lookup_key: true,
          ...(entry.interval ? { recurring: { interval: entry.interval } } : {}),
        });
        await stripe.prices.update(current.id, { active: false });
      }

      const { error } = await context.supabase
        .from("courses")
        .update({
          price_cents: data.onetimeCents,
          monthly_price_cents: data.monthlyCents,
          yearly_price_cents: data.yearlyCents,
          subscription_enabled: data.subscriptionEnabled,
        })
        .eq("slug", "ecommerce-formation");
      if (error) return { error: error.message };

      return { ok: true };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
