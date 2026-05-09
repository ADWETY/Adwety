const asyncHandler = require('../../utils/async-handler');

const {
  InventorySnapshot,
  notificationDto
} = require('./common');

exports.notifications = asyncHandler(async (req, res) => {
  const page = req.validated.query.page;
  const limit = req.validated.query.limit;
  const skip = (page - 1) * limit;

  const filter = {
    quantity: { $lte: 10 }
  };

  const [total, rows] = await Promise.all([
    InventorySnapshot.countDocuments(filter),
    InventorySnapshot.find(filter)
      .populate('drugId')
      .populate('pharmacyId')
      .sort({ quantity: 1, updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
  ]);

  return res.json({
    data: rows.map(notificationDto),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

exports.markNotificationRead = asyncHandler(async (req, res) => {
  return res.json({
    id: req.validated.params.id,
    read: true,
    is_read: true,
    read_at: new Date().toISOString()
  });
});
