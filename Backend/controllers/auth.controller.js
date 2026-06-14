const { z } = require('zod');
const { User } = require('../models');
const env = require('../config/env');
const asyncHandler = require('../utils/async-handler');
const { success } = require('../utils/response');
const { AppError } = require('../utils/helpers');
const { signAccessToken } = require('../services/token.service');
const { beginLogin } = require('../services/login.service');
const { hashPassword, verifyPassword } = require('../services/password.service');
const { createSessionTokens, rotateRefreshToken, revokeSession, revokeByRefreshToken, invalidateUserSessions, updateSessionMfa } = require('../services/session.service');
const { getRefreshToken, setAccessCookie, setSessionCookies, clearSessionCookies, assertCsrfForSession } = require('../services/http-session.service');
const { loadChallenge, loadAnyChallenge, failChallenge, consumeChallenge, verifyTotp, verifyUserMfa, generateRecoveryCodes, recoveryHash, encryptMfaSecret, decryptSetupSecret } = require('../services/mfa.service');
const { systemLog } = require('../services/logging.service');
const { assertOtpDeliveryReady } = require('../services/email.service');
const {
  normalizeEmail,
  maskEmail,
  generateRequestId,
  createOtpRequest,
  verifyOtpRequest,
  deleteOtpRequest,
  invalidateUserOtpRequests,
  dummyOtpWork
} = require('../services/otp.service');

const passwordSchema = z.string().min(12).max(128);
const requestIdSchema = z.string().regex(/^[a-fA-F0-9]{64}$/, 'Invalid OTP request id');
const otpSchema = z.string().min(6).max(12);

function requestIdFrom(body) {
  return body.requestId || body.request_id || body.otp_token;
}

// Public registration has an explicit whitelist. A submitted role is rejected.
exports.registerSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).max(100).optional(),
    full_name: z.string().min(2).max(100).optional(),
    name: z.string().min(2).max(100).optional(),
    email: z.string().email().max(254),
    password: passwordSchema,
    phoneNumber: z.string().max(32).optional(),
    phone_number: z.string().max(32).optional()
  }).strict(),
  query: z.object({}).strict(),
  params: z.object({}).strict()
});

exports.loginSchema = z.object({
  body: z.object({ email: z.string().email(), password: z.string().min(1).max(128) }).strict(),
  query: z.object({}).strict(),
  params: z.object({}).strict()
});

exports.forgotPasswordSchema = z.object({
  body: z.object({ email: z.string().email().max(254) }).strict(),
  query: z.object({}).strict(),
  params: z.object({}).strict()
});

exports.resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email().max(254).optional(),
    requestId: requestIdSchema.optional(),
    request_id: requestIdSchema.optional(),
    // Backward-compatible field name. Its value is now an opaque random request id, never a JWT.
    otp_token: requestIdSchema.optional(),
    otp: otpSchema,
    newPassword: passwordSchema.optional(),
    new_password: passwordSchema.optional()
  }).strict()
    .refine((v) => requestIdFrom(v), 'OTP request id is required')
    .refine((v) => v.newPassword || v.new_password, 'new password is required'),
  query: z.object({}).strict(),
  params: z.object({}).strict()
});

exports.refreshSchema = z.object({ body: z.object({ refreshToken: z.string().min(40).optional(), refresh_token: z.string().min(40).optional() }).strict(), query: z.object({}).strict(), params: z.object({}).strict() });
exports.logoutSchema = z.object({ body: z.object({ refreshToken: z.string().min(40).optional(), refresh_token: z.string().min(40).optional() }).strict(), query: z.object({}).strict(), params: z.object({}).strict() });
exports.mfaVerifySchema = z.object({ body: z.object({ challengeId: z.string().regex(/^[a-fA-F0-9]{64}$/).optional(), challenge_id: z.string().regex(/^[a-fA-F0-9]{64}$/).optional(), otp_token: z.string().regex(/^[a-fA-F0-9]{64}$/).optional(), code: z.string().min(6).max(32).optional(), otp: z.string().min(6).max(32).optional() }).strict().refine(v => v.challengeId || v.challenge_id || v.otp_token, 'challenge id is required').refine(v => v.code || v.otp, 'MFA code is required'), query: z.object({}).strict(), params: z.object({}).strict() });
exports.mfaReauthSchema = z.object({ body: z.object({ password: z.string().min(1).max(128), code: z.string().min(6).max(32).optional(), otp: z.string().min(6).max(32).optional() }).strict().refine(v => v.code || v.otp, 'MFA code is required'), query: z.object({}).strict(), params: z.object({}).strict() });
function challengeIdFrom(body){ return body.challengeId || body.challenge_id || body.otp_token; }
function mfaCodeFrom(body){ return body.code || body.otp; }
function tokenMetadata(tokens){ return { token_type: 'Cookie', expires_in: tokens.expires_in, refresh_expires_in: tokens.refresh_expires_in }; }
function bearerTokenPayload(tokens){ return { token: tokens.token, access_token: tokens.access_token, refresh_token: tokens.refresh_token, token_type: 'Bearer', expires_in: tokens.expires_in, refresh_expires_in: tokens.refresh_expires_in }; }
function isMobileClient(req){ return String(req.baseUrl || req.originalUrl || '').includes('/mobile') || String(req.headers['x-client-type'] || '').toLowerCase() === 'mobile'; }

function serialize(user) {
  return {
    id: user._id.toString(), name: user.fullName, email: user.email, role: user.role,
    phone_number: user.phoneNumber || '', pharmacy_id: user.pharmacyId || null,
    password_policy_version: Number(user.passwordPolicyVersion || 1),
    passwordPolicyVersion: Number(user.passwordPolicyVersion || 1),
    password_upgrade_recommended: Number(user.passwordPolicyVersion || 1) < 2,
    passwordUpgradeRecommended: Number(user.passwordPolicyVersion || 1) < 2,
    mfa_enabled: user.mfaEnabled === true,
    mfa_policy_version: Number(user.mfaPolicyVersion || 1),
    mfaPolicyVersion: Number(user.mfaPolicyVersion || 1),
    mfa_grandfathered: user.role === 'admin' && Number(user.mfaPolicyVersion || 1) < 2 && user.mfaEnabled !== true
  };
}

exports.register = asyncHandler(async (req, res) => {
  const body=req.validated.body; const email=normalizeEmail(body.email);
  if(await User.findOne({email})) throw new AppError('Email already exists',409);
  const fullName=body.fullName||body.full_name||body.name;
  const passwordHash=await hashPassword(body.password,{email,fullName});
  const user=await User.create({fullName,email,passwordHash,passwordPolicyVersion:2,role:'patient',phoneNumber:body.phoneNumber||body.phone_number||''});
  const tokens=await createSessionTokens(user,req);
  setSessionCookies(res,tokens);
  return success(res,{...serialize(user),...tokenMetadata(tokens)},'Register successful',201);
});

exports.login = asyncHandler(async (req,res)=>{
  const result=await beginLogin(req.validated.body.email,req.validated.body.password,req);
  await systemLog({type:'login_attempt',action:'auth.login',actorId:result.user._id,actorRole:result.user.role,success:true,message:result.mfa?'Password verified; MFA required':'Login successful',ip:req.ip});
  if(result.mfa) return success(res,{user:serialize(result.user),...result.mfa},'MFA verification required');
  setSessionCookies(res,result.tokens);
  return success(res,{...serialize(result.user),...tokenMetadata(result.tokens),mfa_grandfathered:result.mfaGrandfathered===true},'Login successful');
});
exports.me=asyncHandler(async(req,res)=>success(res,serialize(req.authUser),'Current user loaded'));
exports.refresh=asyncHandler(async(req,res)=>{
  const body=req.validated.body||{};
  const cookieRefresh=getRefreshToken(req);
  const rawRefresh=body.refreshToken||body.refresh_token||cookieRefresh;
  const bearerClient=Boolean(body.refreshToken||body.refresh_token)||isMobileClient(req);
  const result=await rotateRefreshToken(rawRefresh,req,{requireCsrf:Boolean(cookieRefresh&&!bearerClient)});
  if(bearerClient) return success(res,{...serialize(result.user),...bearerTokenPayload(result)},'Token refreshed');
  setSessionCookies(res,result);
  return success(res,{...serialize(result.user),...tokenMetadata(result)},'Token refreshed');
});
exports.logout=asyncHandler(async(req,res)=>{
  const body=req.validated?.body||req.body||{};
  const cookieRefresh=getRefreshToken(req);
  const rawRefresh=body.refreshToken||body.refresh_token||cookieRefresh;
  if(cookieRefresh&&!body.refreshToken&&!body.refresh_token&&!req.authSession){
    const { Session }=require('../models');
    const { refreshHash }=require('../services/session.service');
    const row=await Session.findOne({refreshTokenHash:refreshHash(cookieRefresh)}).select('+csrfTokenHash');
    if(row) assertCsrfForSession(req,row,{force:true});
  }
  if(req.authSession)await revokeSession(req.authSession._id,'logout');
  if(rawRefresh)await revokeByRefreshToken(rawRefresh,'logout');
  clearSessionCookies(res);
  if(req.authUser)await systemLog({type:'security',action:'auth.logout',actorId:req.authUser._id,actorRole:req.authRole,success:true,message:'Session logged out',ip:req.ip});
  return success(res,{logged_out:true},'Logout successful');
});
exports.logoutAll=asyncHandler(async(req,res)=>{await invalidateUserSessions(req.authUser._id,'logout_all',{incrementVersion:true});clearSessionCookies(res);await systemLog({type:'security',action:'auth.logout_all',actorId:req.authUser._id,actorRole:req.authRole,success:true,message:'All sessions logged out',ip:req.ip});return success(res,{logged_out_all:true},'All sessions logged out');});

async function completeMfa(req,res,purpose){
  const body=req.validated.body;const row=await loadChallenge(challengeIdFrom(body),purpose);
  const user=await User.findById(row.userId).select('+passwordHash +mfaSecretEncrypted +mfaRecoveryCodeHashes');
  if(!user||user.isActive===false||user.role!=='admin'){await failChallenge(row);throw new AppError('Invalid MFA challenge',401);}
  let ok=false,recoveryCodes=[];
  let setupSecret = null;
  if(purpose==='setup'){
    setupSecret=decryptSetupSecret(row);ok=verifyTotp(setupSecret,mfaCodeFrom(body));
  }else{const result=await verifyUserMfa(user,mfaCodeFrom(body));ok=result.ok;}
  if(!ok){await failChallenge(row);throw new AppError('Invalid MFA code',401);}
  await consumeChallenge(row);
  if (purpose === 'setup') { recoveryCodes=generateRecoveryCodes();user.mfaSecretEncrypted=encryptMfaSecret(setupSecret);user.mfaRecoveryCodeHashes=recoveryCodes.map(recoveryHash);user.mfaEnabled=true;user.mfaEnrolledAt=new Date();await user.save(); }
  const now=new Date();const tokens=await createSessionTokens(user,req,{mfaVerifiedAt:now});
  await systemLog({ type:'security', action: purpose==='setup'?'auth.mfa.enrolled':'auth.mfa.login_verified', actorId:user._id, actorRole:user.role, success:true, message:purpose==='setup'?'Administrator MFA enrolled':'Administrator MFA verified', ip:req.ip });
  if(isMobileClient(req)) return success(res,{user:serialize(user),...bearerTokenPayload(tokens),...(recoveryCodes.length?{recovery_codes:recoveryCodes}: {})},purpose==='setup'?'MFA enrolled successfully':'Login successful');
  setSessionCookies(res,tokens);
  return success(res,{user:serialize(user),...tokenMetadata(tokens),...(recoveryCodes.length?{recovery_codes:recoveryCodes}: {})},purpose==='setup'?'MFA enrolled successfully':'Login successful');
}
exports.verifyMfaLogin=asyncHandler((req,res)=>completeMfa(req,res,'login'));
exports.verifyMfaSetup=asyncHandler((req,res)=>completeMfa(req,res,'setup'));
exports.verifyMfaAuto=asyncHandler(async (req,res)=>{const row=await loadAnyChallenge(challengeIdFrom(req.validated.body));req.validated.body.challengeId=challengeIdFrom(req.validated.body);return completeMfa(req,res,row.purpose);});
exports.verifyLoginOtp=exports.verifyMfaAuto;
exports.verifyRegisterOtp=asyncHandler(async(_req,res)=>success(res,{verified:true},'Registration does not use OTP'));
exports.reauthMfa=asyncHandler(async(req,res)=>{const user=await User.findById(req.authUser._id).select('+passwordHash +mfaSecretEncrypted +mfaRecoveryCodeHashes');if(!user||user.role!=='admin'||!user.mfaEnabled)throw new AppError('MFA is required',403);if(!await verifyPassword(req.validated.body.password,user.passwordHash))throw new AppError('Invalid credentials',401);const result=await verifyUserMfa(user,mfaCodeFrom(req.validated.body));if(!result.ok)throw new AppError('Invalid MFA code',401);const now=new Date();const session=await updateSessionMfa(req.authSession._id,now);const access=signAccessToken(user,session,{mfaVerifiedAt:now});if(!isMobileClient(req)&&req.authViaCookie)setAccessCookie(res,access);await systemLog({type:'security',action:'auth.mfa.reauthenticated',actorId:user._id,actorRole:user.role,success:true,message:'Administrator completed sensitive-action re-authentication',metadata:{recoveryCodeUsed:result.recoveryUsed===true},ip:req.ip});return success(res,isMobileClient(req)||!req.authViaCookie?{token:access,access_token:access,token_type:'Bearer',expires_in:env.accessTokenMinutes*60}:{token_type:'Cookie',expires_in:env.accessTokenMinutes*60},'MFA re-authentication successful');});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  // Fail consistently before account lookup when delivery is unavailable.
  assertOtpDeliveryReady();
  const email = normalizeEmail(req.validated.body.email);
  const user = await User.findOne({ email, isActive: { $ne: false } });

  let requestId = generateRequestId();
  let channel = 'email';
  if (user) {
    try {
      const created = await createOtpRequest({ purpose: 'password_reset', user, request: req });
      requestId = created.requestId;
      channel = created.channel;
    } catch (error) {
      // Do not reveal whether the account exists through SMTP delivery failures.
      requestId = await dummyOtpWork();
      await systemLog({
        type: 'error',
        action: 'auth.password_reset_delivery',
        actorId: user._id,
        actorRole: user.role,
        success: false,
        message: 'Password reset OTP delivery failed',
        metadata: { provider: 'smtp' },
        ip: req.ip
      });
    }
  } else {
    // Perform comparable cryptographic work and return the same response shape.
    requestId = await dummyOtpWork();
  }

  const response = {
    request_id: requestId,
    requestId,
    // Compatibility alias only; this is an opaque request id and contains no OTP data.
    otp_token: requestId,
    expires_in_minutes: env.otpTtlMinutes,
    delivery: { channel, destination: maskEmail(email) }
  };
  // Keep nonexistent/existing account response timing closer to reduce enumeration signals.
  const remainingDelay = Math.max(0, 500 - (Date.now() - startedAt));
  if (remainingDelay) await new Promise((resolve) => setTimeout(resolve, remainingDelay));
  return success(res, response, 'If the account exists, a reset code was sent');
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const body = req.validated.body;
  const email = body.email ? normalizeEmail(body.email) : null;
  const otpRequest = await verifyOtpRequest({
    requestId: requestIdFrom(body),
    purpose: 'password_reset',
    otp: body.otp,
    expectedEmail: email
  });

  const user = await User.findOne({ _id: otpRequest.userId, email: otpRequest.accountEmail }).select('+passwordHash');
  if (!user || user.isActive === false) {
    await deleteOtpRequest(otpRequest);
    throw new AppError('Invalid reset request', 400);
  }

  user.passwordHash = await hashPassword(body.newPassword || body.new_password, { email: user.email, fullName: user.fullName });
  user.passwordPolicyVersion = 2;
  user.passwordChangedAt = new Date();
  await user.save();
  await invalidateUserSessions(user._id, 'password_reset', { incrementVersion: true });
  await invalidateUserOtpRequests(user._id, 'password_reset');
  await systemLog({
    type: 'system',
    action: 'auth.password_reset',
    actorId: user._id,
    actorRole: user.role,
    success: true,
    message: 'Password reset completed',
    ip: req.ip
  });
  clearSessionCookies(res);
  return success(res, { password_reset: true }, 'Password reset successful');
});
