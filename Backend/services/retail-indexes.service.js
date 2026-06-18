'use strict';

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
  StoreSequence,
} = require('../models');

const RETAIL_MODELS = [
  StoreCategory,
  StoreWarehouse,
  StoreProduct,
  StorePerson,
  StoreInvoice,
  StoreReturn,
  StoreTransfer,
  StoreInventoryCount,
  StoreTreasuryMovement,
  StoreSequence,
];

let ensurePromise = null;
let indexesReady = false;

function isMissingNamespace(error) {
  return error?.code === 26 || /namespace.*not found/i.test(String(error?.message || ''));
}

function indexKeySignature(key = {}) {
  return Object.entries(key)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([field, direction]) => `${field}:${String(direction)}`)
    .join('|');
}

function desiredUniqueIndexSignatures(Model) {
  const signatures = new Set(['_id:1']);
  for (const [key, options = {}] of Model.schema?.indexes?.() || []) {
    if (options.unique === true) signatures.add(indexKeySignature(key));
  }
  return signatures;
}

/**
 * Older ADWETY databases may still contain global unique indexes such as
 * code_1, name_1, number_1 or key_1. Those indexes were valid before the
 * retail module became multi-pharmacy, but they incorrectly reject the same
 * warehouse/product/category/document code in a second pharmacy.
 *
 * The Mongoose schemas are now the source of truth. Remove only unique indexes
 * that are no longer declared by the current schema, while preserving _id and
 * every current compound tenant index (for example pharmacyId + code).
 */
async function removeObsoleteUniqueIndexes(Model) {
  let indexes;
  try {
    indexes = await Model.collection.indexes();
  } catch (error) {
    if (isMissingNamespace(error)) return [];
    throw error;
  }

  const desired = desiredUniqueIndexSignatures(Model);
  const removed = [];

  for (const index of indexes) {
    if (index.name === '_id_' || index.unique !== true) continue;
    if (desired.has(indexKeySignature(index.key || {}))) continue;

    await Model.collection.dropIndex(index.name);
    removed.push(`${Model.collection.collectionName}.${index.name}`);
  }

  return removed;
}

// Kept for compatibility with the existing stability tests and any scripts
// that imported this helper directly.
async function removeLegacyGlobalNumberIndex(Model) {
  let indexes;
  try {
    indexes = await Model.collection.indexes();
  } catch (error) {
    if (isMissingNamespace(error)) return [];
    throw error;
  }

  const removed = [];
  for (const index of indexes) {
    const keys = Object.keys(index.key || {});
    const isLegacyGlobalNumberIndex = index.unique === true
      && keys.length === 1
      && keys[0] === 'number';
    if (!isLegacyGlobalNumberIndex) continue;
    await Model.collection.dropIndex(index.name);
    removed.push(`${Model.collection.collectionName}.${index.name}`);
  }
  return removed;
}

async function performEnsureRetailIndexes() {
  const removed = [];
  for (const Model of RETAIL_MODELS) {
    removed.push(...await removeObsoleteUniqueIndexes(Model));
  }

  // createIndexes is additive and safe here after obsolete unique constraints
  // have been removed. It recreates the current pharmacy-scoped indexes.
  for (const Model of RETAIL_MODELS) {
    await Model.createIndexes();
  }

  if (removed.length) {
    console.log(`Removed obsolete retail indexes: ${removed.join(', ')}`);
  }

  indexesReady = true;
  return removed;
}

async function ensureRetailIndexes({ force = false } = {}) {
  if (indexesReady && !force) return [];
  if (ensurePromise) return ensurePromise;

  ensurePromise = performEnsureRetailIndexes()
    .finally(() => {
      ensurePromise = null;
    });

  return ensurePromise;
}

module.exports = {
  ensureRetailIndexes,
  removeLegacyGlobalNumberIndex,
  removeObsoleteUniqueIndexes,
  desiredUniqueIndexSignatures,
  indexKeySignature,
};
