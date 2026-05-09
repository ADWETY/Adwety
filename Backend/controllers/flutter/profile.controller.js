const asyncHandler = require('../../utils/async-handler');
const { systemLog } = require('../../services/logging.service');

const { userDto } = require('./common');

exports.profile = asyncHandler(async (req, res) => {
  return res.json(userDto(req.authUser));
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const body = req.validated.body;

  if (
    body.name !== undefined
    || body.fullName !== undefined
    || body.full_name !== undefined
  ) {
    req.authUser.fullName = body.name || body.fullName || body.full_name;
  }

  if (
    body.phone_number !== undefined
    || body.phoneNumber !== undefined
  ) {
    req.authUser.phoneNumber = body.phone_number || body.phoneNumber || '';
  }

  await req.authUser.save();

  await systemLog({
    type: 'profile_update',
    action: 'flutter.profile.update',
    actorId: req.authUser._id,
    actorRole: req.authUser.role,
    success: true,
    message: 'Mobile profile updated',
    ip: req.ip
  });

  return res.json(userDto(req.authUser));
});
