const asyncHandler = require('../../utils/async-handler');

const {
  User,
  Pharmacy,
  Drug,
  InventorySnapshot,
  AiLog,
  SystemLog,
  countModel
} = require('./common');

exports.analytics = asyncHandler(async (_req, res) => {
  const [users, pharmacies, medicines, inventory, aiLogs, systemLogs] = await Promise.all([
    countModel(User),
    countModel(Pharmacy),
    countModel(Drug),
    countModel(InventorySnapshot),
    countModel(AiLog),
    countModel(SystemLog)
  ]);

  return res.json({
    users,
    pharmacies,
    medicines,
    drugs: medicines,
    inventory,
    aiLogs,
    systemLogs
  });
});
