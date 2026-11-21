// Transactional email through Resend's REST API. Without RESEND_API_KEY nothing is sent (logged instead),
// so the app keeps working before email is set up.
import { appUrl } from "./stripe";

export async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[email skipped, no RESEND_API_KEY] to=${to} subject=${subject}`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "FoxPrep <orders@foxprepcenter.com>",
        to: [to],
        reply_to: process.env.EMAIL_REPLY_TO || undefined,
        subject,
        html,
      }),
    });
    if (!res.ok) console.error("[email failed]", res.status, await res.text());
    return res.ok;
  } catch (e) {
    console.error("[email failed]", e);
    return false;
  }
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Plain, readable email layout that renders the same in Gmail, Outlook and phones. */
export function layout(opts: { heading: string; intro: string; rows?: [string, string][]; photos?: string[]; cta?: { label: string; href: string }; footer?: string }) {
  const rows = (opts.rows || [])
    .map(([k, v]) => `<tr><td style="padding:6px 0;color:#5C6670;width:150px;vertical-align:top">${esc(k)}</td><td style="padding:6px 0;color:#14213D;font-weight:600">${v}</td></tr>`)
    .join("");
  const photos = (opts.photos || [])
    .slice(0, 6)
    .map((u) => `<a href="${u}"><img src="${u}" width="180" style="width:180px;height:135px;object-fit:cover;border-radius:6px;margin:0 8px 8px 0;border:1px solid #DCDFE3" alt="Shipment photo"/></a>`)
    .join("");
  return `<!doctype html><html><body style="margin:0;background:#FBFBF8;font-family:-apple-system,Segoe UI,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border:1px solid #DCDFE3;border-radius:10px">
<tr><td style="background:#14213D;padding:16px 24px;border-radius:10px 10px 0 0"><span style="color:#fff;font-size:20px;font-weight:800">Fox<span style="color:#E8590C">Prep</span></span></td></tr>
<tr><td style="padding:24px">
<h1 style="margin:0 0 8px;font-size:22px;color:#14213D">${esc(opts.heading)}</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:1.5;color:#2A3A5E">${opts.intro}</p>
${rows ? `<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px;margin-bottom:16px">${rows}</table>` : ""}
${photos ? `<div style="margin:8px 0 16px">${photos}</div>` : ""}
${opts.cta ? `<a href="${opts.cta.href}" style="display:inline-block;background:#E8590C;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:6px">${esc(opts.cta.label)}</a>` : ""}
${opts.footer ? `<p style="margin:20px 0 0;font-size:13px;color:#5C6670;line-height:1.5">${opts.footer}</p>` : ""}
</td></tr></table>
<p style="font-size:12px;color:#5C6670;margin:16px 0 0">FoxPrep prep center, Hamilton, Ontario</p>
</td></tr></table></body></html>`;
}

export const orderLink = (id: string) => `${appUrl()}/dashboard/orders/${id}`;
export { esc };
