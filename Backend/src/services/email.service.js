const env = require('../config/env');
const { AppError } = require('../utils/error-handling');

let cachedTransporter = null;

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function maskDestination(value = '') {
  const text = String(value || '');
  const [name, domain] = text.split('@');
  if (!domain) return text.replace(/.(?=.{2})/g, '*');
  return `${name.slice(0, 2)}***@${domain}`;
}

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  if (env.mailDriver === 'console') {
    cachedTransporter = {
      async sendMail(payload) {
        console.log('[ADWETY MAIL CONSOLE]', payload);
        return { messageId: `console-${Date.now()}` };
      },
    };
    return cachedTransporter;
  }

  if (env.mailDriver !== 'smtp') {
    throw new AppError('Mail driver is not configured. Set MAIL_DRIVER=smtp or MAIL_DRIVER=console.', 503);
  }

  if (!env.smtpHost || !env.smtpPort || !env.smtpUser || !env.smtpPass) {
    throw new AppError('SMTP settings are incomplete. Check SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS in Backend/.env.', 503);
  }

  let nodemailer;
  try {
    nodemailer = require('nodemailer');
  } catch (_error) {
    throw new AppError('Nodemailer is not installed. Run npm install inside Backend.', 503);
  }

  cachedTransporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
    connectionTimeout: env.smtpConnectionTimeoutMs,
    greetingTimeout: env.smtpGreetingTimeoutMs,
    socketTimeout: env.smtpSocketTimeoutMs,
    tls: {
      rejectUnauthorized: env.smtpRejectUnauthorized,
    },
  });

  return cachedTransporter;
}

function buildOtpEmail({ otp, purpose, destination }) {
  const purposeMap = {
    register: {
      arTitle: 'تأكيد حساب ADWETY',
      enTitle: 'Verify your ADWETY account',
      arLead: 'استخدم الكود التالي لتأكيد بريدك الإلكتروني وتفعيل الحساب.',
      enLead: 'Use the following code to verify your email and continue account activation.',
      subject: 'ADWETY verification code',
    },
    login: {
      arTitle: 'كود تسجيل الدخول إلى ADWETY',
      enTitle: 'ADWETY login code',
      arLead: 'استخدم الكود التالي لإكمال تسجيل الدخول.',
      enLead: 'Use the following code to complete your login.',
      subject: 'ADWETY login code',
    },
    password_reset: {
      arTitle: 'كود إعادة تعيين كلمة المرور',
      enTitle: 'Password reset code',
      arLead: 'استخدم الكود التالي لإعادة تعيين كلمة المرور الخاصة بك.',
      enLead: 'Use the following code to reset your password.',
      subject: 'ADWETY password reset code',
    },
    profile_update: {
      arTitle: 'تأكيد تعديل البريد الإلكتروني',
      enTitle: 'Confirm profile email update',
      arLead: 'استخدم الكود التالي لتأكيد البريد الإلكتروني الجديد في حسابك.',
      enLead: 'Use the following code to confirm the new email address on your account.',
      subject: 'ADWETY profile verification code',
    },
  };

  const copy = purposeMap[purpose] || purposeMap.register;
  const safeOtp = escapeHtml(otp);
  const safeDestination = escapeHtml(destination);
  const expires = env.otpExpiresMinutes;
  const text = `${copy.enTitle}\n\nYour ADWETY code is: ${otp}\nThis code expires in ${expires} minutes.\n\nSent to: ${destination}`;

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(copy.subject)}</title>
</head>
<body style="margin:0;background:#eef7f8;font-family:Arial,Tahoma,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef7f8;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #dbeafe;border-radius:28px;overflow:hidden;box-shadow:0 22px 70px rgba(15,23,42,.12);">
          <tr>
            <td style="background:linear-gradient(135deg,#0891b2,#0f766e);padding:34px 28px;text-align:center;color:white;">
              <div style="letter-spacing:8px;font-weight:700;font-size:13px;margin-bottom:14px;">ADWETY</div>
              <h1 style="margin:0;font-size:30px;line-height:1.35;font-weight:800;">${escapeHtml(copy.arTitle)}</h1>
              <p style="margin:14px 0 0;font-size:15px;line-height:1.8;color:#dffcff;">${escapeHtml(copy.arLead)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px;text-align:center;">
              <p style="margin:0 0 18px;font-size:14px;color:#64748b;">تم إرسال هذا الكود إلى: <strong style="color:#0f172a;direction:ltr;unicode-bidi:bidi-override;">${safeDestination}</strong></p>
              <div style="display:inline-block;background:#f8fafc;border:1px solid #cbd5e1;border-radius:22px;padding:18px 30px;font-size:38px;letter-spacing:12px;font-weight:900;color:#020617;direction:ltr;">${safeOtp}</div>
              <p style="margin:22px 0 0;font-size:14px;color:#64748b;">ينتهي الكود خلال <strong>${expires}</strong> دقائق. لا تشارك هذا الكود مع أي شخص.</p>
              <div style="height:1px;background:#e2e8f0;margin:30px 0;"></div>
              <h2 style="margin:0;font-size:19px;color:#0f172a;direction:ltr;text-align:left;">${escapeHtml(copy.enTitle)}</h2>
              <p style="margin:10px 0 0;font-size:14px;line-height:1.7;color:#64748b;direction:ltr;text-align:left;">${escapeHtml(copy.enLead)} The code expires in ${expires} minutes.</p>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:18px 28px;text-align:center;font-size:12px;color:#94a3b8;">
              This is an automatic security message from ADWETY.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject: copy.subject, text, html };
}

async function sendMail(payload) {
  try {
    const transporter = getTransporter();
    const fromName = env.mailFromName || 'ADWETY';
    const fromEmail = env.mailFromEmail || env.smtpUser;
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
      replyTo: fromEmail,
    });

    console.log('[ADWETY MAIL SENT]', {
      to: maskDestination(payload.to),
      subject: payload.subject,
      messageId: info.messageId,
      driver: env.mailDriver,
    });

    return info;
  } catch (error) {
    cachedTransporter = null;
    console.error('[ADWETY MAIL ERROR]', {
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
      response: error.response,
      message: error.message,
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      user: env.smtpUser ? maskDestination(env.smtpUser) : '',
    });

    const message = String(error.message || error.response || '');
    const isAuthError = message.includes('535') || error.responseCode === 535 || error.code === 'EAUTH';
    const isConnectionError = ['ECONNECTION', 'ETIMEDOUT', 'ESOCKET', 'ECONNREFUSED'].includes(error.code);

    if (isAuthError) {
      throw new AppError('SMTP authentication failed. For Gmail use a valid 16-character App Password in SMTP_PASS, not the normal Gmail password.', 503);
    }

    if (isConnectionError) {
      throw new AppError('SMTP connection failed. Check SMTP_HOST, SMTP_PORT, SMTP_SECURE and network access.', 503);
    }

    throw new AppError(`Unable to send OTP email: ${message}`, 503);
  }
}

async function sendSms({ to, message }) {
  console.log('[ADWETY SMS]', {
    provider: env.smsProvider,
    from: env.smsFrom,
    to,
    message,
  });
  return true;
}

async function sendOtp({ email, phoneNumber, otp, purpose }) {
  if (env.showDevOtp) {
    console.log('[ADWETY DEV OTP]', { email: maskDestination(email), phoneNumber, purpose, otp });
  }

  const normalizedPurpose = String(purpose || '').replace(/_/g, ' ');

  if (env.otpDeliveryChannel === 'sms' && phoneNumber) {
    const message = `Your ADWETY ${normalizedPurpose} OTP is ${otp}. It expires in ${env.otpExpiresMinutes} minutes.`;
    await sendSms({ to: phoneNumber, message });
    return { channel: 'sms', destination: phoneNumber };
  }

  if (!email) throw new AppError('OTP email destination is missing.', 422);

  const emailMessage = buildOtpEmail({ otp, purpose, destination: email });
  await sendMail({
    to: email,
    ...emailMessage,
  });

  return { channel: 'email', destination: email };
}

module.exports = { sendMail, sendSms, sendOtp, buildOtpEmail, getTransporter };
