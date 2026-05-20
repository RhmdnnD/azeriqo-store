import nodemailer from "nodemailer";

function getTransporter() {
  const host = process.env["SMTP_HOST"];
  const port = process.env["SMTP_PORT"];
  const user = process.env["SMTP_USER"];
  const pass = process.env["SMTP_PASS"];

  if (!host || !port || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass },
  });
}

export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  const transporter = getTransporter();

  if (!transporter) {
    console.log(`[DEV] Verification code for ${email}: ${code}`);
    return false;
  }

  const from = process.env["SMTP_FROM"] || process.env["SMTP_USER"];

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject: "Azeriqo Store - Email Verification",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#1e293b;margin-bottom:8px">Azeriqo Store</h2>
          <p style="color:#475569;font-size:14px">Your verification code is:</p>
          <div style="font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;padding:24px;background:#f1f5f9;border-radius:12px;margin:16px 0;color:#4f46e5">
            ${code}
          </div>
          <p style="color:#94a3b8;font-size:12px">This code expires in 10 minutes.</p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error("Failed to send email:", err);
    return false;
  }
}
