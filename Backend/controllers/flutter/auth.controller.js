
const asyncHandler = require('../../utils/async-handler');
const { AppError } = require('../../utils/helpers');
const { beginLogin } = require('../../services/login.service');
const { hashPassword } = require('../../services/password.service');
const { createSessionTokens } = require('../../services/session.service');
const { systemLog } = require('../../services/logging.service');

const { User, userDto } = require('./common');

exports.login = asyncHandler(async (req, res) => {
  const result = await beginLogin(req.validated.body.email, req.validated.body.password, req);
  await systemLog({ type: 'login_attempt', action: 'flutter.login', actorId: result.user._id, actorRole: result.user.role, success: true, message: result.mfa ? 'Password verified; MFA required' : 'Login successful', ip: req.ip });
  if (result.mfa) return res.json({ ...userDto(result.user), ...result.mfa });
  return res.json(userDto(result.user, result.tokens));
});

exports.register = asyncHandler(async (req, res) => {
  const body = req.validated.body;
  const email = body.email.trim().toLowerCase();
  if (await User.findOne({ email })) throw new AppError('Email already exists', 409);
  const fullName = body.fullName || body.full_name || body.name;
  const passwordHash = await hashPassword(body.password, { email, fullName });
  const user = await User.create({ fullName, email, passwordHash, passwordPolicyVersion: 2, role: 'patient', phoneNumber: body.phoneNumber || body.phone_number || '' });
  const tokens = await createSessionTokens(user, req);
  return res.status(201).json(userDto(user, tokens));
});
