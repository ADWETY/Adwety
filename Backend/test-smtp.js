const nodemailer = require('nodemailer');
require('dotenv').config();

(async () => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.verify();
  console.log('SMTP OK');

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.EMAIL_FROM,
    to: 'omarmohamedelsawy7@gmail.com',
    subject: 'ADWETY SMTP Test',
    text: 'Test email from ADWETY backend.'
  });

  console.log('TEST EMAIL SENT');
})().catch((err) => {
  console.error('SMTP FAILED');
  console.error(err.message);
  process.exit(1);
});
