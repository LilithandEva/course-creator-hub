// Transactional emails. Uses Resend when RESEND_API_KEY is configured;
// otherwise it logs so the app keeps working without email set up.
type EmailInput = {
  to?: string;
  toAdmin?: boolean;
  subject: string;
  heading: string;
  body: string;
};

function template(heading: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f6f7f9;padding:32px;font-family:'DM Sans',Helvetica,Arial,sans-serif;color:#0B1D33">
  <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden">
    <tr><td style="background:#0B1D33;padding:24px 28px">
      <span style="color:#F5B544;font-weight:700;font-size:18px">TuCurso.com</span>
    </td></tr>
    <tr><td style="padding:28px">
      <h1 style="margin:0 0 12px;font-size:22px">${heading}</h1>
      <p style="margin:0;line-height:1.6;font-size:15px">${body}</p>
    </td></tr>
    <tr><td style="padding:18px 28px;background:#f6f7f9;font-size:12px;color:#5b6577">
      eCommerce Formation · TuCurso.com
    </td></tr>
  </table></body></html>`;
}

export async function sendTransactionalEmail(input: EmailInput): Promise<void> {
  const apiKey = process.env['RESEND_API_KEY'];
  const from = process.env['NOTIFICATIONS_FROM_EMAIL'] ?? "TuCurso <onboarding@resend.dev>";
  const adminEmail = process.env['ADMIN_NOTIFICATION_EMAIL'];
  const to = input.toAdmin ? adminEmail : input.to;

  if (!apiKey || !to) {
    console.log("[email skipped]", { to, subject: input.subject, hasKey: !!apiKey });
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: input.subject,
        html: template(input.heading, input.body),
      }),
    });
    if (!res.ok) {
      console.error("[email failed]", res.status, await res.text());
    }
  } catch (error) {
    console.error("[email error]", error);
  }
}
