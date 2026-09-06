/**
 * Email Dispatch Service for ForStore
 * Supports Resend, SendGrid, and Dev Fallback
 */

export interface SendPinRecoveryEmailParams {
  to: string;
  storeName: string;
  pin: string;
  accessUrl: string;
}

export async function sendPinRecoveryEmail({
  to,
  storeName,
  pin,
  accessUrl,
}: SendPinRecoveryEmailParams): Promise<{ success: boolean; error?: string; simulated?: boolean }> {
  const subject = `🔐 Your Admin Portal Access PIN: ${pin} (${storeName})`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F6F3EB; margin: 0; padding: 30px; color: #111111; }
    .card { max-width: 520px; margin: 0 auto; background: #ffffff; border: 3px solid #000000; border-radius: 24px; padding: 32px; box-shadow: 6px 6px 0px 0px #000000; }
    .logo { display: inline-block; background: #FF4C29; color: #ffffff; font-weight: 900; font-size: 20px; width: 44px; height: 44px; line-height: 44px; text-align: center; border-radius: 12px; border: 2px solid #000000; margin-bottom: 20px; }
    h1 { font-size: 24px; font-weight: 900; margin: 0 0 8px 0; letter-spacing: -0.5px; }
    p { font-size: 14px; line-height: 1.6; color: #444444; margin: 0 0 20px 0; }
    .pin-box { background: #FBF9F4; border: 2px dashed #000000; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0; }
    .pin-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 800; color: #666666; margin-bottom: 6px; }
    .pin-code { font-family: monospace; font-size: 36px; font-weight: 900; letter-spacing: 6px; color: #FF4C29; }
    .btn { display: block; background: #000000; color: #ffffff !important; text-decoration: none; font-weight: 900; font-size: 15px; text-align: center; padding: 16px 24px; border-radius: 16px; border: 2px solid #000000; box-shadow: 4px 4px 0px 0px #FF4C29; margin-top: 24px; }
    .footer { font-size: 11px; color: #888888; text-align: center; margin-top: 28px; line-height: 1.5; border-top: 1px solid #eeeeee; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">F</div>
    <h1>Store Access PIN Recovery</h1>
    <p>Hello! A PIN recovery request was submitted for <strong>${storeName}</strong> on the ForStore Admin Portal.</p>
    
    <div class="pin-box">
      <div class="pin-label">Your Secret Store PIN</div>
      <div class="pin-code">${pin}</div>
    </div>

    <p>You can click the button below to directly unlock your admin dashboard on your browser:</p>

    <a href="${accessUrl}" class="btn" target="_blank">OPEN STORE ADMIN DASHBOARD 🚀</a>

    <div class="footer">
      This email was sent to <strong>${to}</strong>.<br/>
      If you did not request this email, please ignore it or check your store security settings.
      <br/><br/>
      © 2026 ForStore HQ • Cafe Game Store SaaS
    </div>
  </div>
</body>
</html>
  `;

  // 1. Try Resend API if configured
  if (process.env.RESEND_API_KEY) {
    try {
      const fromEmail = process.env.EMAIL_FROM || "ForStore Security <onboarding@resend.dev>";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject,
          html,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Resend API error:", errorData);
        return { success: false, error: errorData.message || "Failed to deliver email via Resend" };
      }

      console.log(`[EmailService] Recovery PIN email delivered to ${to} via Resend.`);
      return { success: true, simulated: false };
    } catch (err: any) {
      console.error("Error sending email via Resend:", err);
      return { success: false, error: err.message };
    }
  }

  // 2. Try SendGrid API if configured
  if (process.env.SENDGRID_API_KEY) {
    try {
      const fromEmail = process.env.EMAIL_FROM || "security@forstore.app";
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: fromEmail, name: "ForStore Security" },
          subject,
          content: [{ type: "text/html", value: html }],
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.error("SendGrid API error:", errText);
        return { success: false, error: "Failed to deliver email via SendGrid" };
      }

      console.log(`[EmailService] Recovery PIN email delivered to ${to} via SendGrid.`);
      return { success: true, simulated: false };
    } catch (err: any) {
      console.error("Error sending email via SendGrid:", err);
      return { success: false, error: err.message };
    }
  }

  // 3. Fallback: Local / Dev mode (Simulate email dispatch and log cleanly)
  console.log(`\n======================================================`);
  console.log(`[DEV EMAIL SIMULATION] 📧 PIN Recovery Email Dispatched`);
  console.log(`To: ${to}`);
  console.log(`Store: ${storeName}`);
  console.log(`PIN: ${pin}`);
  console.log(`Unlock URL: ${accessUrl}`);
  console.log(`======================================================\n`);

  return { success: true, simulated: true };
}

/**
 * Masks an email address for privacy:
 * manager@brewbites.com -> m*****r@brewbites.com
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return email;
  const [local, domain] = email.split("@");
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`;
  }
  const maskedLocal = local[0] + "*".repeat(Math.max(1, local.length - 2)) + local[local.length - 1];
  return `${maskedLocal}@${domain}`;
}
