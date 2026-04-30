const User = require('../../../DB/Models/user.model');
const Admin = require('../../../DB/Models/admin.model');
const { AppError } = require('../../utils/error-handling');

async function getProfile(authUser = null, authMeta = null) {
  if (!authUser) throw new AppError('Authentication required', 401);

  const isAdmin = authMeta?.type === 'admin' || authUser.constructor?.modelName === 'Admin';
  if (isAdmin) {
    const admin = authUser._id ? await Admin.findById(authUser._id).lean() : authUser;
    if (!admin) throw new AppError('Account not found', 404);
    return { id: admin._id.toString(), name: admin.fullName, email: admin.email, role: admin.role || 'support_admin', account_type: 'admin', token: null };
  }

  const user = authUser._id ? await User.findById(authUser._id).lean() : authUser;
  if (!user) throw new AppError('Account not found', 404);
  return { id: user._id.toString(), name: user.fullName, email: user.email, role: 'user', account_type: 'user', token: null };
}

module.exports = { getProfile };
