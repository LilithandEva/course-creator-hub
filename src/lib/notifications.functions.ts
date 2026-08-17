import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type NotifyInput =
  | { kind: "quiz"; quizTitle: string; score: number; passed: boolean }
  | { kind: "course"; courseTitle: string };

export const notifyProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: NotifyInput) => {
    if (data?.kind !== "quiz" && data?.kind !== "course") {
      throw new Error("Tipo de notificación no válido");
    }
    return data;
  })
  .handler(async ({ data, context }) => {
    const { sendTransactionalEmail } = await import("@/lib/notifications.server");
    const {
      data: { user },
    } = await context.supabase.auth.getUser();
    const email = user?.email;
    if (!email) return { sent: false };

    if (data.kind === "quiz") {
      await sendTransactionalEmail({
        to: email,
        subject: `Resultado del test: ${data.quizTitle}`,
        heading: data.passed ? "¡Test superado!" : "Resultado de tu test",
        body: `Has obtenido un <strong>${data.score}%</strong> en «${data.quizTitle}». ${
          data.passed
            ? "¡Enhorabuena! Puedes continuar con el siguiente módulo."
            : "Puedes repetirlo cuando quieras desde el campus."
        }`,
      });
    } else {
      // One completion email per enrolment, ever.
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: updated } = await supabaseAdmin
        .from("enrollments")
        .update({ completion_email_sent_at: new Date().toISOString() })
        .eq("user_id", context.userId)
        .is("completion_email_sent_at", null)
        .select("id");
      if (!updated?.length) return { sent: false };

      await sendTransactionalEmail({
        to: email,
        subject: `¡Has completado ${data.courseTitle}!`,
        heading: "Curso completado",
        body: `Has terminado todas las lecciones de <strong>${data.courseTitle}</strong>. Enhorabuena por el trabajo.`,
      });
    }

    return { sent: true };
  });
