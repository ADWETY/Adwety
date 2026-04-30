const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../../../DB/Models/user.model');
const Admin = require('../../../DB/Models/admin.model');
const OtpChallenge = require('../../../DB/Models/otp.model');
const env = require('../../config/env');
const { signToken } = require('../../services/token.service');
const { sendOtp } = require('../../services/email.service');
const { AppError } = require('../../utils/error-handling');
const { sanitizeEmail } = require('../../utils/security');

function hashValue(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function generateOtp() {
  const length = Math.max(4, Math.min(env.otpLength, 10));
  const max = 10 ** length;
  return String(crypto.randomInt(0, max)).padStart(length, '0');
}

function generateChallengeToken() {
  return crypto.randomBytes(32).toString('hex');
}

function serializeAccount(account, { token = null, role = 'user', accountType = 'user' } = {}) {
  return {
    id: account._id.toString(),
    name: account.fullName,
    email: account.email,
    phone_number: account.phoneNumber || '',
    role,
    account_type: accountType,
    email_verified: Boolean(account.isEmailVerified),
    phone_verified: Boolean(account.isPhoneVerified),
    token,
  };
}

async function findAccountByEmail(email) {
  const user = await User.findOne({ email });
  if (user) return { account: user, accountType: 'user', role: 'user', model: User };

  const admin = await Admin.findOne({ email });
  if (admin) return { account: admin, accountType: 'admin', role: admin.role, model: Admin };

  return null;
}

async function createOtpChallenge({ account, accountType, role, purpose }) {
  const otp = generateOtp();
  const challengeToken = generateChallengeToken();
  const expiresAt = new Date(Date.now() + env.otpExpiresMinutes * 60 * 1000);

  await OtpChallenge.deleteMany({
    accountId: account._id,
    accountType,
    purpose,
    consumedAt: null,
  });

  await OtpChallenge.create({
    email: account.email,
    phoneNumber: account.phoneNumber || '',
    accountType,
    accountId: account._id,
    role,
    purpose,
    otpHash: hashValue(otp),
    tokenHash: hashValue(challengeToken),
    expiresAt,
    maxAttempts: env.otpMaxAttempts,
  });

  const delivery = await sendOtp({
    email: account.email,
    phoneNumber: account.phoneNumber || '',
    otp,
    purpose,
  });

  return {
    requires_otp: true,
    otp_token: challengeToken,
    expires_in_minutes: env.otpExpiresMinutes,
    delivery,
  };
}

async function consumeOtpChallenge({ otpToken, otp, purpose }) {
  const challenge = await OtpChallenge.findOne({
    tokenHash: hashValue(otpToken),
    purpose,
    consumedAt: null,
  });

  if (!challenge) throw new AppError('Invalid or expired OTP request', 400);
  if (challenge.expiresAt.getTime() <= Date.now()) throw new AppError('OTP expired. Please request a new code.', 400);
  if (challenge.attempts >= challenge.maxAttempts) throw new AppError('Too many OTP attempts. Please request a new code.', 429);

  const matches = hashValue(otp) === challenge.otpHash;
  if (!matches) {
    challenge.attempts += 1;
    await challenge.save();
    throw new AppError('Invalid OTP code', 400);
  }

  challenge.consumedAt = new Date();
  await challenge.save();
  return challenge;
}

async function registerUser(payload) {
  const email = sanitizeEmail(payload.email);
  const exists = await User.findOne({ email });
  if (exists) throw new AppError('Email already registered', 409);

  const passwordHash = await bcrypt.hash(payload.password, env.bcryptSaltRounds);
  const user = await User.create({
    fullName: payload.full_name,
    email,
    passwordHash,
    phoneNumber: payload.phone_number || '',
    isActive: !env.requireRegisterOtp,
    isEmailVerified: !env.requireRegisterOtp,
  });

  if (env.requireRegisterOtp) {
    return createOtpChallenge({ account: user, accountType: 'user', role: 'user', purpose: 'register' });
  }

  const token = signToken({ sub: user._id.toString(), type: 'user', role: 'user' });
  return serializeAccount(user, { token, role: 'user', accountType: 'user' });
}

async function verifyRegisterOtp(payload) {
  const challenge = await consumeOtpChallenge({ otpToken: payload.otp_token, otp: payload.otp, purpose: 'register' });
  const user = await User.findById(challenge.accountId);
  if (!user) throw new AppError('Account not found', 404);

  user.isActive = true;
  user.isEmailVerified = true;
  if (user.phoneNumber) user.isPhoneVerified = env.otpDeliveryChannel === 'sms';
  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken({ sub: user._id.toString(), type: 'user', role: 'user' });
  return serializeAccount(user, { token, role: 'user', accountType: 'user' });
}

async function loginUser(payload) {
  const email = sanitizeEmail(payload.email);
  const invalid = new AppError('Invalid email or password', 401);
  const found = await findAccountByEmail(email);
  if (!found) throw invalid;

  const { account, accountType, role } = found;
  if (account.isActive === false) throw new AppError('Account is not active or not verified yet', 403);

  const ok = await bcrypt.compare(payload.password, account.passwordHash);
  if (!ok) throw invalid;

  if (env.requireLoginOtp) {
    return createOtpChallenge({ account, accountType, role, purpose: 'login' });
  }

  account.lastLoginAt = new Date();
  await account.save();
  const token = signToken({ sub: account._id.toString(), type: accountType, role });
  return serializeAccount(account, { token, role, accountType });
}

async function verifyLoginOtp(payload) {
  const challenge = await consumeOtpChallenge({ otpToken: payload.otp_token, otp: payload.otp, purpose: 'login' });
  const model = challenge.accountType === 'admin' ? Admin : User;
  const account = await model.findById(challenge.accountId);
  if (!account || account.isActive === false) throw new AppError('Account is not available', 403);

  account.lastLoginAt = new Date();
  await account.save();
  const role = challenge.accountType === 'admin' ? account.role : 'user';
  const token = signToken({ sub: account._id.toString(), type: challenge.accountType, role });
  return serializeAccount(account, { token, role, accountType: challenge.accountType });
}

async function forgotPassword(payload) {
  const email = sanitizeEmail(payload.email);
  const found = await findAccountByEmail(email);
  if (!found) {
    return { queued: true, message: 'If this account exists, an OTP will be sent.' };
  }

  const challenge = await createOtpChallenge({
    account: found.account,
    accountType: found.accountType,
    role: found.role,
    purpose: 'password_reset',
  });

  return {
    queued: true,
    ...challenge,
  };
}

async function resetPassword(payload) {
  const challenge = await consumeOtpChallenge({ otpToken: payload.otp_token, otp: payload.otp, purpose: 'password_reset' });
  const model = challenge.accountType === 'admin' ? Admin : User;
  const account = await model.findById(challenge.accountId);
  if (!account) throw new AppError('Account not found', 404);

  account.passwordHash = await bcrypt.hash(payload.new_password, env.bcryptSaltRounds);
  account.isActive = true;
  account.isEmailVerified = true;
  await account.save();

  return { reset: true };
}

module.exports = {
  registerUser,
  verifyRegisterOtp,
  loginUser,
  verifyLoginOtp,
  forgotPassword,
  resetPassword,
};
