// Email notifications via Resend — STUB until RESEND_API_KEY is set.
//
// TODO before going live:
//   1. Create a Resend account (resend.com), verify your sending domain
//   2. Set RESEND_API_KEY and EMAIL_FROM in .env
//   3. Remove the `if (!resendApiKey)` console-log fallback below once
//      confirmed working — it exists so the app never crashes on a missing
//      key, it just logs instead of sending.
//
// Every call site in this codebase (order status changes, low stock,
// password reset, email verification, ticket replies) already calls these
// functions — wiring up Resend here is the ONLY change needed to make real
// emails go out.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "FoxPrep <no-reply@foxprep.ca>";

async function send(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.log(`[email stub — no RESEND_API_KEY set] To: ${to} | Subject: ${subject}\n${html}\n`);
    return { ok: false, stub: true };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: EMAIL_FROM, to, subject, html }),
  });
  return { ok: res.ok, stub: false };
}

export async function sendVerificationEmail(to: string, name: string, token: string, baseUrl: string) {
  const link = `${baseUrl}/api/auth/verify?token=${token}`;
  return send(
    to,
    "Verify your FoxPrep account",
    `<p>Hi ${name},</p><p>Confirm your email to activate your FoxPrep account:</p><p><a href="${link}">${link}</a></p>`
  );
}

export async function sendPasswordResetEmail(to: string, name: string, token: string, baseUrl: string) {
  const link = `${baseUrl}/reset-password?token=${token}`;
  return send(
    to,
    "Reset your FoxPrep password",
    `<p>Hi ${name},</p><p>Reset your password (link expires in 1 hour):</p><p><a href="${link}">${link}</a></p><p>If you didn't request this, ignore this email.</p>`
  );
}

export async function sendOutboundStatusEmail(to: string, name: string, shipmentNumber: string, status: string) {
  return send(
    to,
    `Shipment ${shipmentNumber} — ${status.replaceAll("_", " ")}`,
    `<p>Hi ${name},</p><p>Your shipment <strong>${shipmentNumber}</strong> is now: <strong>${status.replaceAll("_", " ")}</strong>.</p>`
  );
}

export async function sendInboundReceivedEmail(to: string, name: string, shipmentNumber: string, hasDiscrepancy: boolean) {
  return send(
    to,
    `Inbound shipment ${shipmentNumber} received${hasDiscrepancy ? " — discrepancy found" : ""}`,
    hasDiscrepancy
      ? `<p>Hi ${name},</p><p>We received <strong>${shipmentNumber}</strong>, but the counted quantities didn't match what was expected. Check your dashboard for details.</p>`
      : `<p>Hi ${name},</p><p>We received <strong>${shipmentNumber}</strong> and it's now in your inventory, ready to ship.</p>`
  );
}

export async function sendLowStockAlert(to: string, name: string, productTitle: string, remaining: number) {
  return send(
    to,
    `Low stock: ${productTitle}`,
    `<p>Hi ${name},</p><p><strong>${productTitle}</strong> is running low in your FoxPrep inventory — only <strong>${remaining}</strong> units left.</p>`
  );
}

export async function sendTicketReplyEmail(to: string, name: string, subject: string) {
  return send(
    to,
    `New reply on your ticket: ${subject}`,
    `<p>Hi ${name},</p><p>The FoxPrep team replied to your support ticket "${subject}". Log in to view and respond.</p>`
  );
}
