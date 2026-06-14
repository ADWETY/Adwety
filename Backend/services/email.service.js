const nodemailer = require('nodemailer');
const env = require('../config/env');
const { AppError } = require('../utils/helpers');

let transporter = null;

function smtpConfigured() {
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
  throw new AppError('OTP delivery service is unavailable', 503);
}

async function sendOtpEmail({ to, otp, purpose, expiresInMinutes }) {
  assertOtpDeliveryReady();
  const subject = purpose === 'change_email'
    ? 'Adwety email verification code'
    : 'Adwety password reset code';
  const action = purpose === 'change_email'
    ? 'confirm your new email address'
    : 'reset your password';
  const text = `Your Adwety verification code is ${otp}. Use it to ${action}. It expires in ${expiresInMinutes} minutes. If you did not request this action, ignore this email.`;
  const html = `<p>Your Adwety verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${otp}</p><p>Use it to ${action}. It expires in ${expiresInMinutes} minutes.</p><p>If you did not request this action, ignore this email.</p>`;

  const mailer = getTransporter();
  if (mailer) {
    await mailer.sendMail({ from: env.smtpFrom, to, subject, text, html });
    return { channel: 'email' };
  }

  // Explicitly opt-in development fallback. Never enabled by default and never used in production.
  console.warn(`[DEV OTP] purpose=${purpose} destination=${to} code=${otp}`);
  return { channel: 'development_console' };
}

module.exports = { smtpConfigured, assertOtpDeliveryReady, sendOtpEmail };
