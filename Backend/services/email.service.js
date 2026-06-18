const nodemailer = require('nodemailer');
const env = require('../config/env');
const { AppError } = require('../utils/helpers');

let transporter = null;

function smtpConfigured() {
  if (env.mailDriver && env.mailDriver !== 'smtp') return false;
  return Boolean(env.smtpHost && env.smtpPort && env.smtpFrom && (env.smtpUser ? env.smtpPass : true));
}

function getTransporter() {
  if (!smtpConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPass } : undefined,
      connectionTimeout: env.smtpTimeoutMs,
      greetingTimeout: env.smtpTimeoutMs,
      socketTimeout: env.smtpTimeoutMs,
      tls: env.smtpRejectUnauthorized ? undefined : { rejectUnauthorized: false }
    });
  }
  return transporter;
}

function assertOtpDeliveryReady() {
  if (smtpConfigured()) return;
  if (env.nodeEnv !== 'production' && env.otpDevConsole) return;
  throw new AppError('OTP delivery service is unavailable', 503, { code: 'OTP_DELIVERY_UNAVAILABLE' });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function otpEmailContent({ otp, purpose, expiresInMinutes }) {
  const isEmailChange = purpose === 'change_email';
  const subject = isEmailChange
    ? 'ADWETY Email Verification Code'
    : 'ADWETY Password Reset Code';
  const title = isEmailChange
    ? 'Verify your new email address'
    : 'Reset your ADWETY password';
  const action = isEmailChange
    ? 'confirm your new email address'
    : 'reset your password';
  const safeOtp = escapeHtml(otp);
  const safeMinutes = escapeHtml(expiresInMinutes);

  const text = [
    title,
    '',
    `Your ADWETY verification code is: ${otp}`,
    '',
    `Use this code to ${action}.`,
    `This code expires in ${expiresInMinutes} minutes.`,
    '',
    'If you did not request this action, ignore this email.'
  ].join('\n');

  const html = `
  <div style="margin:0;padding:0;background:#f6f8fb;font-family:Arial,Helvetica,sans-serif;color:#111827">
    <div style="max-width:560px;margin:0 auto;padding:28px 16px">
      <div style="background:#0f172a;border-radius:18px;padding:28px;border:1px solid #1e293b">
        <div style="font-size:13px;letter-spacing:4px;color:#22d3ee;font-weight:700;margin-bottom:14px">ADWETY</div>
        <h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;color:#ffffff">${escapeHtml(title)}</h1>
        <p style="margin:0 0 18px;color:#cbd5e1;font-size:15px;line-height:1.7">Use the following verification code to ${escapeHtml(action)}.</p>
        <div style="background:#020617;border:1px solid #334155;border-radius:16px;padding:20px;text-align:center;margin:18px 0">
          <div style="font-size:13px;color:#94a3b8;margin-bottom:8px">Verification code</div>
          <div style="font-size:38px;line-height:1;font-weight:800;letter-spacing:10px;color:#67e8f9">${safeOtp}</div>
        </div>
        <p style="margin:16px 0 0;color:#cbd5e1;font-size:14px;line-height:1.7">This code expires in <strong style="color:#ffffff">${safeMinutes} minutes</strong>.</p>
        <p style="margin:12px 0 0;color:#94a3b8;font-size:13px;line-height:1.7">If you did not request this action, ignore this email.</p>
      </div>
    </div>
  </div>`;

  return { subject, text, html };
}

async function sendOtpEmail({ to, otp, purpose, expiresInMinutes }) {
  assertOtpDeliveryReady();
  const { subject, text, html } = otpEmailContent({ otp, purpose, expiresInMinutes });

  const mailer = getTransporter();
  if (mailer) {
    await mailer.sendMail({
      from: env.smtpFrom,
      to,
      subject,
      text,
      html
    });
    return { channel: 'email' };
  }

  // Explicitly opt-in development fallback. Never enabled by default and never used in production.
  console.warn(`[DEV OTP] purpose=${purpose} destination=${to} code=${otp}`);
  return { channel: 'development_console' };
}

module.exports = { smtpConfigured, assertOtpDeliveryReady, sendOtpEmail, otpEmailContent };
