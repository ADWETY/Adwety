const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { User } = require('../models');
const env = require('../config/env');
const asyncHandler = require('../utils/async-handler');
const { success } = require('../utils/response');
const { AppError } = require('../utils/helpers');
const { signToken } = require('../services/token.service');
const { systemLog } = require('../services/logging.service');

const passwordSchema = z.string().min(8).max(72).regex(/[A-Za-z]/).regex(/[0-9]/);
exports.registerSchema = z.object({ body: z.object({ fullName: z.string().min(2).max(100).optional(), full_name: z.string().min(2).max(100).optional(), name: z.string().min(2).max(100).optional(), email: z.string().email().max(254), password: passwordSchema, role: z.enum(['admin','pharmacist','patient']).optional().default('patient'), phoneNumber: z.string().max(32).optional(), phone_number: z.string().max(32).optional() }).strict(), query: z.object({}).strict(), params: z.object({}).strict() });
exports.loginSchema = z.object({ body: z.object({ email: z.string().email(), password: z.string().min(1).max(72) }).strict(), query: z.object({}).strict(), params: z.object({}).strict() });

function serialize(user, token = null) { return { id: user._id.toString(), name: user.fullName, email: user.email, role: user.role, phone_number: user.phoneNumber || '', pharmacy_id: user.pharmacyId || null, token }; }
exports.register = asyncHandler(async (req, res) => { const body = req.validated.body; if (body.role === 'admin' && !env.allowAdminRegister) throw new AppError('Admin self-registration is disabled', 403); const email = body.email.trim().toLowerCase(); const exists = await User.findOne({ email }); if (exists) throw new AppError('Email already exists', 409); const passwordHash = await bcrypt.hash(body.password, env.bcryptSaltRounds); const user = await User.create({ fullName: body.fullName || body.full_name || body.name, email, passwordHash, role: body.role || 'patient', phoneNumber: body.phoneNumber || body.phone_number || '' }); const token = signToken(user); return success(res, serialize(user, token), 'Register successful', 201); });
exports.login = asyncHandler(async (req, res) => { const email = req.validated.body.email.trim().toLowerCase(); const user = await User.findOne({ email }).select('+passwordHash'); const invalid = new AppError('Invalid email or password', 401); if (!user) { await systemLog({ type: 'login_attempt', action: 'auth.login', success: false, message: 'Unknown email', metadata: { email }, ip: req.ip }); throw invalid; } const ok = await bcrypt.compare(req.validated.body.password, user.passwordHash); if (!ok || user.isActive === false) { await systemLog({ type: 'login_attempt', action: 'auth.login', actorId: user._id, actorRole: user.role, success: false, message: 'Invalid password or inactive account', ip: req.ip }); throw invalid; } user.lastLoginAt = new Date(); await user.save(); await systemLog({ type: 'login_attempt', action: 'auth.login', actorId: user._id, actorRole: user.role, success: true, message: 'Login successful', ip: req.ip }); return success(res, serialize(user, signToken(user)), 'Login successful'); });
exports.me = asyncHandler(async (req, res) => success(res, serialize(req.authUser), 'Current user loaded'));
