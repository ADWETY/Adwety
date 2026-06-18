'use strict';

require('../config/env');
const connectDatabase = require('../config/database');
const {
  StoreCategory,
  StoreWarehouse,
  StoreProduct,
  StorePerson,
  StoreInvoice,
  StoreReturn,
  StoreTransfer,
  StoreInventoryCount,
  StoreTreasuryMovement,
} = require('../models');

const models = [
  StoreCategory,
  StoreWarehouse,
  StoreProduct,
  StorePerson,
  StoreInvoice,
  StoreReturn,
  StoreTransfer,
  StoreInventoryCount,
  StoreTreasuryMovement,
];

async function main() {
  await connectDatabase();
  for (const Model of models) {
    await Model.syncIndexes();
    console.log(`Synced tenant indexes for ${Model.modelName}`);
  }
  console.log('Retail tenancy indexes are ready. Existing unassigned records remain admin-owned.');
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
