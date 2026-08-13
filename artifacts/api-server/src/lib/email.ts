/**
 * Email sending — supports Brevo (primary, free 300/day) or Resend fallback
 *
 * Required secrets (at least one):
 *   BREVO_API_KEY   — from brevo.com → SMTP & API → API Keys (recommended, free)
 *   RESEND_API_KEY  — from resend.com (requires verified domain for production)
 *
 * Required env vars:
 *   FROM_EMAIL      — verified sender email, e.g. "yourgmail@gmail.com"
 *   FROM_NAME       — display name shown to recipients (default: "PortaSplit Alerts")
 *   APP_URL         — base URL of the app for links in emails
 */

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL ?? "onboarding@resend.dev";
const FROM_NAME = process.env.FROM_NAME ?? "PortaSplit Alerts";
const APP_URL = process.env.APP_URL ?? `https://${process.env.REPLIT_DEV_DOMAIN}`;

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendViaBrevo(opts: SendEmailOptions): Promise<void> {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: FROM_NAME, email: FROM_EMAIL },
      to: [{ email: opts.to }],
      subject: opts.subject,
      htmlContent: opts.html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo error ${res.status}: ${body}`);
  }
}

async function sendViaResend(opts: SendEmailOptions): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }
}

async function sendEmail(opts: SendEmailOptions): Promise<void> {
  if (!BREVO_API_KEY && !RESEND_API_KEY) {
    console.warn("[email] No email provider configured (BREVO_API_KEY or RESEND_API_KEY) — skipping email to", opts.to);
    return;
  }

  // Prefer Brevo (free, no domain needed); fall back to Resend
  if (BREVO_API_KEY) {
    await sendViaBrevo(opts);
  } else {
    await sendViaResend(opts);
  }
}

// ─── Email Templates ──────────────────────────────────────────────────────────

export async function sendVerificationEmail(opts: {
  to: string;
  token: string;
  planName: string;
}): Promise<void> {
  // Link to the frontend verify page (which calls the API itself)
  const verifyUrl = `${APP_URL}/verify/${opts.token}`;
  const unsubUrl = `${APP_URL}/api/alerts/${opts.token}`;

  await sendEmail({
    to: opts.to,
    subject: "✅ Confirm your PortaSplit stock alert",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:ui-monospace,monospace,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #222;border-radius:8px;overflow:hidden;max-width:560px;width:100%">
        <tr><td style="background:#111;border-bottom:1px solid #222;padding:24px 32px">
          <span style="color:#10b981;font-size:11px;letter-spacing:3px;text-transform:uppercase">● SYSTEM ACTIVE</span>
          <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px">PortaSplit Stock Alerts</h1>
        </td></tr>
        <tr><td style="padding:32px">
          <p style="margin:0 0 8px;color:#6b7280;font-size:12px;letter-spacing:2px;text-transform:uppercase">Action required</p>
          <h2 style="margin:0 0 16px;color:#fff;font-size:18px;font-weight:600">Confirm your alert subscription</h2>
          <p style="margin:0 0 24px;color:#9ca3af;font-size:14px;line-height:1.6">
            You signed up for the <strong style="color:#10b981">${opts.planName}</strong> monitoring plan.
            Click below to activate your alerts — we'll notify you the instant Midea PortaSplit appears near you.
          </p>
          <div style="text-align:center;margin:32px 0">
            <a href="${verifyUrl}" style="display:inline-block;background:#10b981;color:#000;font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;padding:14px 36px;border-radius:6px;text-decoration:none">
              Activate My Alerts →
            </a>
          </div>
          <p style="margin:24px 0 0;color:#4b5563;font-size:12px;line-height:1.5">
            Didn't sign up? Safely ignore this email or
            <a href="${unsubUrl}" style="color:#6b7280;text-decoration:underline">unsubscribe here</a>.
          </p>
        </td></tr>
        <tr><td style="border-top:1px solid #1f2937;padding:20px 32px">
          <p style="margin:0;color:#374151;font-size:11px">PortaSplit Stock Alerts · Monitoring Midea PortaSplit across France</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
  });
}

export async function sendRestockAlertEmail(opts: {
  to: string;
  token: string;
  storeName: string;
  storeChain: string;
  storeCity: string;
  storeUrl: string;
  status: string;
  qty: number | null;
}): Promise<void> {
  const unsubUrl = `${APP_URL}/api/alerts/${opts.token}`;
  const statusLabel =
    opts.status === "in_stock" ? "🟢 In Stock"
    : opts.status === "low_stock" ? "🟡 Low Stock"
    : "🟠 Reserved";

  await sendEmail({
    to: opts.to,
    subject: `🚨 Midea PortaSplit spotted at ${opts.storeName}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:ui-monospace,monospace,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #222;border-radius:8px;overflow:hidden;max-width:560px;width:100%">
        <tr><td style="background:#064e3b;padding:20px 32px;border-bottom:1px solid #065f46">
          <p style="margin:0;color:#6ee7b7;font-size:11px;letter-spacing:3px;text-transform:uppercase">● RESTOCK DETECTED</p>
        </td></tr>
        <tr><td style="padding:32px 32px 0">
          <h1 style="margin:0 0 8px;color:#fff;font-size:24px;font-weight:700">Midea PortaSplit is available!</h1>
          <p style="margin:0;color:#9ca3af;font-size:14px">Detected at ${opts.storeChain} — act fast, stock won't last long.</p>
        </td></tr>
        <tr><td style="padding:24px 32px">
          <div style="background:#1a1a1a;border:1px solid #2d2d2d;border-radius:6px;padding:20px">
            <p style="margin:0 0 4px;color:#6b7280;font-size:11px;letter-spacing:2px;text-transform:uppercase">Store</p>
            <h2 style="margin:0 0 12px;color:#fff;font-size:18px;font-weight:600">${opts.storeName}</h2>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right:24px">
                  <p style="margin:0 0 2px;color:#6b7280;font-size:11px">City</p>
                  <p style="margin:0;color:#e5e7eb;font-size:13px">${opts.storeCity}</p>
                </td>
                <td style="padding-right:24px">
                  <p style="margin:0 0 2px;color:#6b7280;font-size:11px">Status</p>
                  <p style="margin:0;color:#10b981;font-size:13px;font-weight:700">${statusLabel}</p>
                </td>
                ${opts.qty ? `<td><p style="margin:0 0 2px;color:#6b7280;font-size:11px">Qty</p><p style="margin:0;color:#e5e7eb;font-size:13px">${opts.qty} unit${opts.qty > 1 ? "s" : ""}</p></td>` : ""}
              </tr>
            </table>
          </div>
        </td></tr>
        <tr><td style="padding:0 32px 32px">
          <div style="text-align:center">
            <a href="${opts.storeUrl}" style="display:inline-block;background:#10b981;color:#000;font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;padding:14px 36px;border-radius:6px;text-decoration:none">
              Go to Store →
            </a>
          </div>
        </td></tr>
        <tr><td style="border-top:1px solid #1f2937;padding:20px 32px">
          <p style="margin:0;color:#374151;font-size:11px">
            <a href="${unsubUrl}" style="color:#4b5563;text-decoration:none">Unsubscribe</a> · PortaSplit Stock Alerts · Monitoring France
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
  });
}
