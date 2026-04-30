const User = require('../../../DB/Models/user.model');
const Admin = require('../../../DB/Models/admin.model');

async function getProfile(authUser = null, authMeta = null) {
  if (!authUser) {
    const defaultUser = await User.findOne({ email: 'mona@adwety.app' }).lean();
    if (!defaultUser) return { id: null, name: 'Guest', email: 'guest@adwety.local', role: 'guest', account_type: 'guest', token: null };
    return { id: defaultUser._id.toString(), name: defaultUser.fullName, email: defaultUser.email, role: 'user', account_type: 'user', token: null };
  }

  const isAdmin = authMeta?.type === 'admin' || authUser.constructor?.modelName === 'Admin';
  if (isAdmin) {
    const admin = authUser._id ? await Admin.findById(authUser._id).lean() : authUser;
    return { id: admin._id.toString(), name: admin.fullName, email: admin.email, role: admin.role || 'support_admin', account_type: 'admin', token: null };
  }

  const user = authUser._id ? await User.findById(authUser._id).lean() : authUser;
  return { id: user._id.toString(), name: user.fullName, email: user.email, role: 'user', account_type: 'user', token: null };
}
module.exports = { getProfile };
