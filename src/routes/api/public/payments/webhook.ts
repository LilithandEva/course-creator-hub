import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";
import { sendTransactionalEmail } from "@/lib/notifications.server";

let _supabase: ReturnType<typeof createClient<Database>> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient<Database>(
      process.env['SUPABASE_URL']!,
      process.env['SUPABASE_SERVICE_ROLE_KEY']!,
    );
  }
  return _supabase;
}

async function getCourse() {
  const { data } = await getSupabase()
    .from("courses")
    .select("id, title")
    .eq("slug", "ecommerce-formation")
    .maybeSingle();
  return data;
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  const { data } = await getSupabase()
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .maybeSingle();
  return data?.id ?? null;
}

async function grantEnrollment(opts: {
  userId: string;
  courseId: string;
  courseTitle: string;
  sessionId: string | null;
  email?: string;
  env: StripeEnv;
}) {
  const supabase = getSupabase();
  const { data: existing } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", opts.userId)
    .eq("course_id", opts.courseId)
    .maybeSingle();
  if (existing) return;

  await supabase.from("enrollments").insert({
    user_id: opts.userId,
    course_id: opts.courseId,
    source: "stripe",
    stripe_session_id: opts.sessionId,
  });

  if (opts.email) {
    await sendTransactionalEmail({
      to: opts.email,
      subject: `Ya tienes acceso a ${opts.courseTitle}`,
      heading: "¡Bienvenido al curso!",
      body: `Tu pago se ha confirmado y ya tienes acceso completo a <strong>${opts.courseTitle}</strong>. Entra en el campus y empieza por el primer módulo.`,
    });
  }
  await sendTransactionalEmail({
    toAdmin: true,
    subject: "Nueva inscripción en el curso",
    heading: "Nueva compra",
    body: `${opts.email ?? "Un alumno"} acaba de comprar ${opts.courseTitle} (${opts.env}).`,
  });
}

// Access is granted here — never on the "thank you" screen.
async function fulfillCheckout(session: any, env: StripeEnv) {
  const supabase = getSupabase();
  const course = await getCourse();
  if (!course) return;

  const email: string | undefined =
    session.customer_details?.email ??
    session.customer_email ??
    session.metadata?.buyerEmail ??
    undefined;

  const paymentIntent: string | null =
    typeof session.payment_intent === "string" ? session.payment_intent : null;

  let userId: string | null = session.metadata?.userId ?? null;
  if (!userId && email) userId = await findUserIdByEmail(email);

  await supabase.from("payments").upsert(
    {
      user_id: userId,
      email: email ?? null,
      course_id: course.id,
      provider: "stripe",
      provider_session_id: session.id,
      provider_payment_intent: paymentIntent,
      amount_cents: session.amount_total ?? 0,
      currency: session.currency ?? "eur",
      status: "paid",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "provider_session_id" },
  );

  // Subscriptions grant access through the customer.subscription.* events.
  if (session.mode === "subscription") return;

  if (userId) {
    await grantEnrollment({
      userId,
      courseId: course.id,
      courseTitle: course.title,
      sessionId: session.id,
      ...(email ? { email } : {}),
      env,
    });
    return;
  }

  if (!email) {
    console.error("Checkout session without userId or email", session.id);
    await sendTransactionalEmail({
      toAdmin: true,
      subject: "Pago sin datos de alumno",
      heading: "Revisión manual necesaria",
      body: `El pago ${session.id} se ha cobrado pero no tiene email ni usuario asociado.`,
    });
    return;
  }

  // Guest purchase: reserve the access and invite them to create the account.
  await supabase.from("pending_access").upsert(
    { email, course_id: course.id, stripe_session_id: session.id },
    { onConflict: "email,course_id", ignoreDuplicates: true },
  );

  await sendTransactionalEmail({
    to: email,
    subject: `Crea tu cuenta para entrar en ${course.title}`,
    heading: "¡Pago confirmado!",
    body: `Tu compra de <strong>${course.title}</strong> está confirmada. Para entrar en el campus, crea tu cuenta usando exactamente este email (<strong>${email}</strong>) y el acceso se activará automáticamente.`,
  });
  await sendTransactionalEmail({
    toAdmin: true,
    subject: "Nueva compra (sin cuenta todavía)",
    heading: "Nueva compra",
    body: `${email} ha comprado ${course.title} (${env}) y aún tiene que crear su cuenta.`,
  });
}

async function upsertSubscription(subscription: any, env: StripeEnv) {
  const supabase = getSupabase();
  const course = await getCourse();
  const userId: string | undefined = subscription.metadata?.userId;
  if (!userId) {
    console.error("Subscription without userId metadata", subscription.id);
    return;
  }

  const item = subscription.items?.data?.[0];
  const priceId =
    item?.price?.lookup_key || item?.price?.metadata?.lovable_external_id || item?.price?.id;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      course_id: course?.id ?? null,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      product_id: item?.price?.product ?? null,
      price_id: priceId,
      status: subscription.status,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end ?? false,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );
}

async function revokeAccess(reason: "reembolso" | "disputa", paymentIntent: string | null) {
  if (!paymentIntent) return;
  const supabase = getSupabase();
  const { data: payment } = await supabase
    .from("payments")
    .select("id, user_id, email, course_id")
    .eq("provider_payment_intent", paymentIntent)
    .maybeSingle();
  if (!payment) return;

  await supabase
    .from("payments")
    .update({
      status: reason === "reembolso" ? "refunded" : "disputed",
      refunded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", payment.id);

  if (payment.user_id) {
    await supabase
      .from("enrollments")
      .delete()
      .eq("user_id", payment.user_id)
      .eq("course_id", payment.course_id);
  }
  if (payment.email) {
    await supabase
      .from("pending_access")
      .delete()
      .ilike("email", payment.email)
      .eq("course_id", payment.course_id);
  }

  await sendTransactionalEmail({
    toAdmin: true,
    subject: `Acceso retirado por ${reason}`,
    heading: `Se ha registrado un ${reason}`,
    body: `Se ha retirado el acceso al curso de ${payment.email ?? "un alumno"} tras un ${reason}.`,
  });
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  const supabase = getSupabase();

  // Idempotency ledger: Stripe retries, we only process once.
  const { error: ledgerError } = await supabase
    .from("webhook_events")
    .insert({ id: event.id, type: event.type, environment: env });
  if (ledgerError) {
    console.log("Evento ya procesado o no registrable:", event.id, ledgerError.message);
    if (ledgerError.code === "23505") return;
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.payment_status !== "unpaid") await fulfillCheckout(session, env);
      break;
    }
    case "checkout.session.async_payment_succeeded":
      await fulfillCheckout(event.data.object, env);
      break;
    case "checkout.session.async_payment_failed": {
      await supabase
        .from("payments")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("provider_session_id", event.data.object.id);
      break;
    }
    case "checkout.session.expired":
      console.log("Checkout expirado:", event.data.object.id);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await upsertSubscription(event.data.object, env);
      break;
    case "customer.subscription.deleted":
      await supabase
        .from("subscriptions")
        .update({ status: "canceled", updated_at: new Date().toISOString() })
        .eq("stripe_subscription_id", event.data.object.id);
      break;
    case "charge.refunded":
      await revokeAccess("reembolso", event.data.object.payment_intent ?? null);
      break;
    case "charge.dispute.created":
      await revokeAccess("disputa", event.data.object.payment_intent ?? null);
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("Webhook with invalid env:", rawEnv);
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await handleWebhook(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
