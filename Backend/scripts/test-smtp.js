const env = require('../src/config/env');
const { sendMail } = require('../src/services/email.service');

async function main() {
  const to = process.argv[2] || env.smtpUser || env.mailFromEmail;
  if (!to) {
    throw new Error('Usage: npm run test:smtp -- your-email@gmail.com');
  }

  await sendMail({
    to,
    subject: 'ADWETY SMTP test message',
    text: 'SMTP is configured correctly. This is a test email from ADWETY.',
    html: `
      <div style="font-family:Arial,Tahoma,sans-serif;background:#eef7f8;padding:24px">
        <div style="max-width:560px;margin:auto;background:white;border-radius:24px;padding:28px;border:1px solid #dbeafe">
          <div style="letter-spacing:6px;color:#0891b2;font-weight:800">ADWETY</div>
          <h1 style="color:#0f172a">SMTP is working</h1>
          <p style="color:#64748b;line-height:1.7">If you received this message, Gmail SMTP is configured correctly.</p>
        </div>
      </div>
    `,
  });

  console.log(`[OK] Test email sent to ${to}`);
}

main().catch((error) => {
  console.error('[SMTP TEST FAILED]', error.message);
  process.exit(1);
});
