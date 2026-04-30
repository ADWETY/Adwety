const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../../../DB/Models/user.model');
const Admin = require('../../../DB/Models/admin.model');
const Pharmacy = require('../../../DB/Models/pharmacy.model');
const ApprovalRequest = require('../../../DB/Models/pharmacyrequest.model');
const OtpChallenge = require('../../../DB/Models/otp.model');
const env = require('../../config/env');
const { signToken } = require('../../services/token.service');
const { sendOtp } = require('../../services/email.service');
const { AppError } = require('../../utils/error-handling');
const { sanitizeEmail } = require('../../utils/security');

const ADMIN_ROLES = ['owner', 'super_admin', 'pharmacy_admin', 'support_admin'];

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
    approval_status: account.approvalStatus || (accountType === 'admin' ? 'pending' : 'approved'),
    pending_approval: accountType === 'admin' && account.approvalStatus !== 'approved',
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

async function assertOwnerCanBeCreated() {
  const existingOwner = await Admin.findOne({ role: 'owner' });
  if (existingOwner) {
    throw new AppError('Only one Owner account is allowed for this system', 409);
  }
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

async function createApprovalRequestForAdmin(admin) {
  const existing = await ApprovalRequest.findOne({ adminId: admin._id, status: 'pending' });
  if (existing) return existing;

  const pharmacy = admin.pharmacyId ? await Pharmacy.findById(admin.pharmacyId) : null;
  return ApprovalRequest.create({
    requestType: admin.role === 'pharmacy_admin' ? 'pharmacy_admin' : 'admin_account',
    adminId: admin._id,
    pharmacyId: admin.pharmacyId || null,
    requestedRole: admin.role,
    requestedName: admin.fullName,
    requestedEmail: admin.email,
    requestedPhone: admin.phoneNumber || '',
    status: 'pending',
    metadata: pharmacy ? {
      pharmacy_name: pharmacy.name,
      pharmacy_address: pharmacy.address,
      pharmacy_phone: pharmacy.phone,
      pharmacy_email: pharmacy.email,
      working_hours: pharmacy.workingHours,
      google_maps_url: pharmacy.googleMapsUrl,
    } : {},
  });
}

function buildPendingApprovalResponse(admin) {
  return {
    pending_approval: true,
    approval_status: admin.approvalStatus,
    role: admin.role,
    account_type: 'admin',
    email: admin.email,
    message: 'Email verified successfully. Your account is pending Owner approval.',
  };
}

async function registerUser(payload) {
  const email = sanitizeEmail(payload.email);
  const found = await findAccountByEmail(email);
  if (found) throw new AppError('Email already registered', 409);

  const requestedRole = payload.role || 'user';
  const accountType = payload.account_type || (ADMIN_ROLES.includes(requestedRole) ? 'admin' : 'user');

  if (accountType === 'admin' || ADMIN_ROLES.includes(requestedRole)) {
    return registerAdmin({ ...payload, email, role: requestedRole });
  }

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

async function registerAdmin(payload) {
  const role = ADMIN_ROLES.includes(payload.role) ? payload.role : 'support_admin';
  if (role === 'owner') await assertOwnerCanBeCreated();

  let pharmacy = null;
  if (role === 'pharmacy_admin') {
    const pharmacyPayload = payload.pharmacy || {};
    if (!pharmacyPayload.name || !pharmacyPayload.address) {
      throw new AppError('Pharmacy name and address are required for pharmacy admin registration', 400);
    }
    pharmacy = await Pharmacy.create({
      name: pharmacyPayload.name,
      address: pharmacyPayload.address,
      phone: pharmacyPayload.phone || payload.phone_number || '',
      email: pharmacyPayload.email || payload.email,
      workingHours: pharmacyPayload.working_hours || '',
      googleMapsUrl: pharmacyPayload.google_maps_url || '',
      latitude: Number(pharmacyPayload.latitude || 30.0444),
      longitude: Number(pharmacyPayload.longitude || 31.2357),
      rating: 0,
      status: 'pending',
      isFeatured: false,
    });
  }

  const passwordHash = await bcrypt.hash(payload.password, env.bcryptSaltRounds);
  const admin = await Admin.create({
    fullName: payload.full_name,
    email: payload.email,
    passwordHash,
    phoneNumber: payload.phone_number || '',
    role,
    pharmacyId: pharmacy?._id || null,
    isActive: false,
    isEmailVerified: !env.requireRegisterOtp,
    approvalStatus: role === 'owner' && !env.requireRegisterOtp ? 'approved' : 'pending',
    approvedAt: role === 'owner' && !env.requireRegisterOtp ? new Date() : null,
  });

  if (env.requireRegisterOtp) {
    return createOtpChallenge({ account: admin, accountType: 'admin', role, purpose: 'register' });
  }

  if (role === 'owner') {
    admin.isActive = true;
    admin.isEmailVerified = true;
    admin.approvalStatus = 'approved';
    admin.approvedAt = new Date();
    await admin.save();
    const token = signToken({ sub: admin._id.toString(), type: 'admin', role: 'owner' });
    return serializeAccount(admin, { token, role: 'owner', accountType: 'admin' });
  }

  await createApprovalRequestForAdmin(admin);
  return buildPendingApprovalResponse(admin);
}

async function verifyRegisterOtp(payload) {
  const challenge = await consumeOtpChallenge({ otpToken: payload.otp_token, otp: payload.otp, purpose: 'register' });

  if (challenge.accountType === 'admin') {
    const admin = await Admin.findById(challenge.accountId);
    if (!admin) throw new AppError('Account not found', 404);

    admin.isEmailVerified = true;
    if (admin.phoneNumber) admin.isPhoneVerified = env.otpDeliveryChannel === 'sms';

    if (admin.role === 'owner') {
      await assertOwnerCanBeCreated().catch(async (error) => {
        const same = await Admin.findOne({ role: 'owner', _id: admin._id });
        if (!same) throw error;
      });
      admin.isActive = true;
      admin.approvalStatus = 'approved';
      admin.approvedAt = new Date();
      admin.lastLoginAt = new Date();
      await admin.save();
      const token = signToken({ sub: admin._id.toString(), type: 'admin', role: 'owner' });
      return serializeAccount(admin, { token, role: 'owner', accountType: 'admin' });
    }

    admin.isActive = false;
    admin.approvalStatus = 'pending';
    await admin.save();
    await createApprovalRequestForAdmin(admin);
    return buildPendingApprovalResponse(admin);
  }

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

  const ok = await bcrypt.compare(payload.password, account.passwordHash);
  if (!ok) throw invalid;

  if (accountType === 'admin') {
    if (!account.isEmailVerified) throw new AppError('Please verify your email before login', 403);
    if (account.approvalStatus === 'pending') throw new AppError('Account is pending Owner approval', 403);
    if (account.approvalStatus === 'rejected') throw new AppError(account.rejectionReason || 'Account request was rejected', 403);
  }

  if (account.isActive === false) throw new AppError('Account is not active', 403);

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
  if (challenge.accountType === 'admin' && account.approvalStatus !== 'approved') throw new AppError('Account is pending Owner approval', 403);

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
  account.isEmailVerified = true;
  if (challenge.accountType === 'user') account.isActive = true;
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
