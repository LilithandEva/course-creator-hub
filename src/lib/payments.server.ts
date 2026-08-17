import type Stripe from "stripe";
import { createStripeClient } from "@/lib/stripe.server";

export type CoursePlan = "onetime" | "monthly" | "yearly";

// Lookup keys are the single source of truth for what gets charged. The
// browser only sends a plan name; the amount always comes from the gateway.
export const PLAN_LOOKUP_KEYS: Record<CoursePlan, string> = {
  onetime: "ecommerce_formation_onetime",
  monthly: "ecommerce_formation_monthly",
  yearly: "ecommerce_formation_yearly",
};

export function isCoursePlan(value: unknown): value is CoursePlan {
  return value === "onetime" || value === "monthly" || value === "yearly";
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    throw new Error("Invalid userId");
  }
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length && found.data[0]) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    const customer = existing.data[0];
    if (customer) {
      if (options.userId && customer.metadata?.['userId'] !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

export async function resolvePlanPrice(
  stripe: ReturnType<typeof createStripeClient>,
  plan: CoursePlan,
): Promise<Stripe.Price> {
  const prices = await stripe.prices.list({ lookup_keys: [PLAN_LOOKUP_KEYS[plan]] });
  const price = prices.data[0];
  if (!price) throw new Error("El precio de este plan no está configurado");
  return price;
}
