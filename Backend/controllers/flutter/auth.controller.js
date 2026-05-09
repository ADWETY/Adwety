const bcrypt = require('bcryptjs');

const env = require('../../config/env');
const asyncHandler = require('../../utils/async-handler');
const { AppError } = require('../../utils/helpers');
const { signToken } = require('../../services/token.service');
const { systemLog } = require('../../services/logging.service');

const { User, userDto } = require('./common');

exports.login = asyncHandler(async (req, res) => {
  const email = req.validated.body.email.trim().toLowerCase();

  const user = await User.findOne({ email }).select('+passwordHash');
  const invalid = new AppError('Invalid email or password', 401);

  if (!user) {
    await systemLog({
      type: 'login_attempt',
      action: 'flutter.login',
      success: false,
      message: 'Unknown email',
      metadata: { email },
      ip: req.ip
    });

    throw invalid;
  }

  const ok = await bcrypt.compare(req.validated.body.password, user.passwordHash);

  if (!ok || user.isActive === false) {
    await systemLog({
      type: 'login_attempt',
      action: 'flutter.login',
      actorId: user._id,
      actorRole: user.role,
      success: false,
      message: 'Invalid password or inactive account',
      ip: req.ip
    });

    throw invalid;
  }

  user.lastLoginAt = new Date();
  await user.save();

  await systemLog({
    type: 'login_attempt',
    action: 'flutter.login',
    actorId: user._id,
    actorRole: user.role,
    success: true,
    message: 'Login successful',
    ip: req.ip
  });

  return res.json(userDto(user, signToken(user)));
});

exports.register = asyncHandler(async (req, res) => {
  const body = req.validated.body;

  if (body.role === 'admin' && !env.allowAdminRegister) {
    throw new AppError('Admin self-registration is disabled', 403);
  }

  const email = body.email.trim().toLowerCase();
  const exists = await User.findOne({ email });

  if (exists) {
    throw new AppError('Email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(body.password, env.bcryptSaltRounds);

  const user = await User.create({
    fullName: body.fullName || body.full_name || body.name,
    email,
    passwordHash,
    role: body.role || 'patient',
    phoneNumber: body.phoneNumber || body.phone_number || ''
  });

  return res.status(201).json(userDto(user, signToken(user)));
});
