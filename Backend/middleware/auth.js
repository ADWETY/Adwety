const { User } = require('../models');
const { verifyToken } = require('../services/token.service');
const { AppError } = require('../utils/helpers');
async function auth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) throw new AppError('Unauthorized', 401);
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);
    if (!user || user.isActive === false) throw new AppError('Unauthorized', 401);
    req.authUser = user;
    req.authRole = user.role;
    return next();
  } catch (_error) { return next(new AppError('Unauthorized', 401)); }
}
function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return next();
  return auth(req, _res, next);
}
function normalizeRole(role) {
  const aliases = {
    owner: 'admin',
    super_admin: 'admin',
    support_admin: 'admin',
    pharmacy_admin: 'pharmacist',
    user: 'patient'
  };
  return aliases[role] || role;
}
function authorize(roles = []) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  const normalizedAllowed = allowed.map(normalizeRole);
  return (req, _res, next) => {
    const actual = req.authRole;
    const normalized = normalizeRole(actual);
    if (!actual || (!allowed.includes(actual) && !normalizedAllowed.includes(normalized))) {
      return next(new AppError('Forbidden: insufficient permissions', 403));
    }
    return next();
  };
}
auth.optional = optionalAuth;
auth.authorize = authorize;
auth.normalizeRole = normalizeRole;
module.exports = auth;
