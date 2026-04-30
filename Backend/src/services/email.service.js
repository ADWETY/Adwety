const env = require('../config/env');

async function sendMail(payload) {
  // Development-safe mail adapter. In production, replace this function with SMTP/SendGrid/Mailgun.
  console.log('[ADWETY MAIL]', {
    from: env.emailFrom,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
  });
  return true;
}

async function sendSms({ to, message }) {
  // Development-safe SMS adapter. In production, connect Twilio/Vonage/etc. through env variables.
  console.log('[ADWETY SMS]', {
    provider: env.smsProvider,
    from: env.smsFrom,
    to,
    message,
  });
  return true;
}

async function sendOtp({ email, phoneNumber, otp, purpose }) {
  const normalizedPurpose = purpose.replace(/_/g, ' ');
  const message = `Your ADWETY ${normalizedPurpose} OTP is ${otp}. It expires in ${env.otpExpiresMinutes} minutes.`;

  if (env.otpDeliveryChannel === 'sms' && phoneNumber) {
    await sendSms({ to: phoneNumber, message });
    return { channel: 'sms', destination: phoneNumber };
  }

  await sendMail({
    to: email,
    subject: `ADWETY OTP: ${normalizedPurpose}`,
    text: message,
  });
  return { channel: 'email', destination: email };
}

module.exports = { sendMail, sendSms, sendOtp };
