const User = require('../../DB/Models/user.model');
const Admin = require('../../DB/Models/admin.model');
const { verifyToken } = require('../services/token.service');
const { AppError } = require('../utils/error-handling');

async function resolveAccount(payload) {
  if (payload.type === 'admin') return Admin.findById(payload.sub).select('+passwordHash');
  return User.findById(payload.sub).select('+passwordHash');
}

async function auth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) throw new AppError('Unauthorized', 401);

    const payload = verifyToken(token);
    const account = await resolveAccount(payload);

    if (!account || account.isActive === false) throw new AppError('Unauthorized', 401);
    req.authUser = account;
    req.authMeta = payload;
    next();
  } catch (_error) {
    next(new AppError('Unauthorized', 401));
  }
}

function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return next();
  return auth(req, _res, next);
}

function authorize(...allowedRoles) {
  const flatRoles = allowedRoles.flat();
  return (req, _res, next) => {
    const role = req.authMeta?.role || req.authUser?.role || 'user';
    if (!flatRoles.includes(role)) {
      return next(new AppError('Forbidden: insufficient permissions', 403));
    }
    return next();
  };
}

auth.optionalAuth = optionalAuth;
auth.authorize = authorize;
module.exports = auth;
