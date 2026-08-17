import { createServerFn } from "@tanstack/react-start";
import {
  type StripeEnv,
  createStripeClient,
  getStripeErrorMessage,
} from "@/lib/stripe.server";

type CheckoutInput = {
  returnUrl: string;
  environment: StripeEnv;
  customerEmail?: string;
  userId?: string;
};

type CheckoutSessionResult = { clientSecret: string } | { error: string };

// The price is resolved server-side from a fixed lookup key. The browser can
// never influence the amount charged.
const COURSE_PRICE_LOOKUP_KEY = "ecommerce_formation_onetime";

async function resolveOrCreateCustomer(
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

export const createCourseCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator((data: CheckoutInput) => {
    if (!data?.returnUrl) throw new Error("Falta la URL de retorno");
    if (data.environment !== "sandbox" && data.environment !== "live") {
      throw new Error("Entorno de pago no válido");
    }
    return data;
  })
  .handler(async ({ data }): Promise<CheckoutSessionResult> => {
    try {
      const stripe = createStripeClient(data.environment);

      const prices = await stripe.prices.list({
        lookup_keys: [COURSE_PRICE_LOOKUP_KEY],
      });
      const stripePrice = prices.data[0];
      if (!stripePrice) throw new Error("El precio del curso no está configurado");

      const customerId =
        data.customerEmail || data.userId
          ? await resolveOrCreateCustomer(stripe, {
              ...(data.customerEmail ? { email: data.customerEmail } : {}),
              ...(data.userId ? { userId: data.userId } : {}),
            })
          : undefined;

      const productId =
        typeof stripePrice.product === "string"
          ? stripePrice.product
          : stripePrice.product.id;
      const product = await stripe.products.retrieve(productId);

      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: stripePrice.id, quantity: 1 }],
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        ...(customerId && { customer: customerId }),
        payment_intent_data: { description: product.name },
        managed_payments: { enabled: true },
        metadata: {
          ...(data.userId ? { userId: data.userId } : {}),
          managed_payments: "true",
        },
      } as never);

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
