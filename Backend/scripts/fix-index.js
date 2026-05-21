const mongoose = require('mongoose');
const env = require('../config/env');

async function fixIndexes() {
  await mongoose.connect(env.mongoUri);
  const db = mongoose.connection.db;

  const collectionsToFix = ['users', 'pharmacies', 'drugs', 'inventories', 'categories'];

  for (const colName of collectionsToFix) {
    try {
      const indexes = await db.collection(colName).indexes();
      console.log(`\n${colName} indexes:`);
      for (const idx of indexes) {
        console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)} unique=${idx.unique || false} sparse=${idx.sparse || false}`);
      }
    } catch (e) {
      console.log(`  Collection ${colName} not found, skipping.`);
      continue;
    }
  }

  // Drop stale indexes that don't match current mongoose schemas
  const staleIndexes = [
    { collection: 'pharmacies', index: 'code_1' },
    { collection: 'pharmacies', index: 'pharmacyId_1_email_1' },
    { collection: 'pharmacies', index: 'pharmacyId_1_phone_1' },
    { collection: 'pharmacies', index: 'phone_1' },
    { collection: 'users', index: 'pharmacyId_1_email_1' },
    { collection: 'users', index: 'phone_1' },
    { collection: 'users', index: 'pharmacyId_1_role_1' },
    { collection: 'users', index: 'status_1' },
    { collection: 'users', index: 'pharmacyId_1' },
  ];

  for (const { collection, index } of staleIndexes) {
    try {
      const indexes = await db.collection(collection).indexes();
      if (indexes.find(i => i.name === index)) {
        await db.collection(collection).dropIndex(index);
        console.log(`Dropped stale index: ${collection}.${index}`);
      }
    } catch (e) {
      console.log(`Could not drop ${collection}.${index}: ${e.message}`);
    }
  }

  await mongoose.disconnect();
  console.log('\nDone.');
}

fixIndexes().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});