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

// Access is granted here — never on the "thank you" screen.
async function fulfillCheckout(session: any, env: StripeEnv) {
  const supabase = getSupabase();
  const userId: string | undefined = session.metadata?.userId;
  const email: string | undefined =
    session.customer_details?.email ?? session.customer_email ?? undefined;

  const { data: course } = await supabase
    .from("courses")
    .select("id, title")
    .eq("slug", "ecommerce-formation")
    .maybeSingle();
  if (!course) return;

  await supabase.from("payments").upsert(
    {
      user_id: userId ?? null,
      email: email ?? null,
      course_id: course.id,
      provider: "stripe",
      provider_session_id: session.id,
      amount_cents: session.amount_total ?? 0,
      currency: session.currency ?? "eur",
      status: "paid",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "provider_session_id" },
  );

  if (!userId) {
    console.error("Checkout session without userId metadata", session.id);
    return;
  }

  const { data: existing } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", userId)
    .eq("course_id", course.id)
    .maybeSingle();

  if (!existing) {
    await supabase.from("enrollments").insert({
      user_id: userId,
      course_id: course.id,
      source: "stripe",
      stripe_session_id: session.id,
    });

    if (email) {
      await sendTransactionalEmail({
        to: email,
        subject: `Ya tienes acceso a ${course.title}`,
        heading: "¡Bienvenido al curso!",
        body: `Tu pago se ha confirmado y ya tienes acceso completo a <strong>${course.title}</strong>. Entra en el campus y empieza por el primer módulo.`,
      });
    }
    await sendTransactionalEmail({
      toAdmin: true,
      subject: "Nueva inscripción en el curso",
      heading: "Nueva compra",
      body: `${email ?? "Un alumno"} acaba de comprar ${course.title} (${env}).`,
    });
  }
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.payment_status !== "unpaid") {
        await fulfillCheckout(session, env);
      }
      break;
    }
    case "checkout.session.async_payment_succeeded":
      await fulfillCheckout(event.data.object, env);
      break;
    case "checkout.session.async_payment_failed": {
      const session = event.data.object;
      await getSupabase()
        .from("payments")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("provider_session_id", session.id);
      break;
    }
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
