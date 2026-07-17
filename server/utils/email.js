const nodemailer = require('nodemailer');

let _transporter = null;

/**
 * Returns a nodemailer transporter.
 * - If SMTP_HOST is set in .env, uses those credentials (production / real SMTP).
 * - Otherwise auto-creates an Ethereal test account (development).
 *   Preview URLs are printed to the console after each send.
 */
async function getTransporter() {
  if (_transporter) return _transporter;

  if (process.env.SMTP_HOST) {
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log(`✓ Nodemailer: using configured SMTP (${process.env.SMTP_HOST})`);
  } else {
    // Auto-create a free Ethereal test account
    const testAccount = await nodemailer.createTestAccount();
    _transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('✓ Nodemailer: using Ethereal test account');
    console.log(`  Ethereal inbox → https://ethereal.email/messages`);
    console.log(`  Login: ${testAccount.user} / ${testAccount.pass}`);
  }

  return _transporter;
}

/**
 * Send the email-verification link to a newly approved caregiver.
 * @param {string} toEmail
 * @param {string} toName
 * @param {string} token  - the raw verification token
 */
async function sendVerificationEmail(toEmail, toName, token) {
  const transport = await getTransporter();

  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  const verifyUrl = `${appUrl}/verify?token=${token}`;

  const info = await transport.sendMail({
    from: `"CommuniCare" <no-reply@communicare.app>`,
    to: toEmail,
    subject: 'CommuniCare — Please verify your email address',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
        <div style="background:#1e3a5f;padding:24px 32px;border-radius:10px 10px 0 0">
          <h1 style="color:#fff;margin:0;font-size:22px">🩺 CommuniCare</h1>
        </div>
        <div style="background:#f8fafc;padding:32px;border:1px solid #e2e8f0;border-radius:0 0 10px 10px">
          <p style="font-size:16px;color:#1e293b">Hi <strong>${toName}</strong>,</p>
          <p style="color:#475569">Your caregiver account has been approved by the administrator.
             Please verify your email address to complete registration and log in.</p>
          <div style="text-align:center;margin:32px 0">
            <a href="${verifyUrl}"
               style="background:#1e3a5f;color:#fff;padding:14px 32px;border-radius:8px;
                      text-decoration:none;font-weight:700;font-size:15px;display:inline-block">
              Verify Email Address
            </a>
          </div>
          <p style="color:#94a3b8;font-size:13px">
            This link expires in <strong>24 hours</strong>.<br>
            If you did not register for CommuniCare, you can ignore this email.
          </p>
          <p style="color:#94a3b8;font-size:12px;word-break:break-all">
            Or copy this link: ${verifyUrl}
          </p>
        </div>
      </div>
    `,
    text: `Hi ${toName},\n\nYour CommuniCare account has been approved.\nVerify your email here:\n${verifyUrl}\n\nThis link expires in 24 hours.`,
  });

  // Log Ethereal preview URL (only works for Ethereal accounts)
  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) {
    console.log(`\n📧 Email preview (Ethereal): ${preview}\n`);
  }

  return info;
}

module.exports = { sendVerificationEmail };
