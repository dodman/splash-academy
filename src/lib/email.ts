import nodemailer from "nodemailer";

const smtpConfigured = !!(
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
);

function createTransport() {
  if (!smtpConfigured) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<{ sent: boolean; verifyUrl: string }> {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/verify-email?token=${token}`;

  const transport = createTransport();

  if (!transport) {
    // Smart fallback: log the link when SMTP is not configured
    console.log(`\n📧 Email verification (SMTP not configured)`);
    console.log(`   To: ${email}`);
    console.log(`   Verify URL: ${verifyUrl}\n`);
    return { sent: false, verifyUrl };
  }

  await transport.sendMail({
    from: process.env.SMTP_FROM || `"Splash Academy" <noreply@splashacademy.com>`,
    to: email,
    subject: "Verify your email - Splash Academy",
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Welcome to Splash Academy!</h2>
        <p style="color: #666; line-height: 1.6;">
          Please verify your email address by clicking the button below.
          This link will expire in 24 hours.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}"
             style="background: #6366f1; color: white; padding: 12px 32px;
                    border-radius: 8px; text-decoration: none; font-weight: 600;">
            Verify Email
          </a>
        </div>
        <p style="color: #999; font-size: 13px;">
          If the button doesn't work, copy and paste this link:<br/>
          <a href="${verifyUrl}" style="color: #6366f1;">${verifyUrl}</a>
        </p>
      </div>
    `,
  });

  return { sent: true, verifyUrl };
}
