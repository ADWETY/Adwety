'use strict';

const { StoreSequence } = require('../models');
const { AppError } = require('../utils/helpers');

function formatNumber(prefix, value) {
  return `${prefix}-${String(value).padStart(4, '0')}`;
}

/**
 * Allocate a tenant-scoped document number using an atomic MongoDB counter.
 * Existing databases can already contain generated numbers while the new
 * counter collection is empty, so occupied values are skipped safely.
 */
async function nextRetailNumber(Model, prefix, sequenceKey = prefix) {
  for (let attempt = 0; attempt < 10000; attempt += 1) {
    let sequence;
    try {
      sequence = await StoreSequence.findOneAndUpdate(
        { key: sequenceKey },
        { $inc: { value: 1 } },
        { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
      );
    } catch (error) {
      // Two first requests can race while creating the same counter document.
      // The compound unique index resolves the race; retry the atomic increment.
      if (error?.code === 11000) continue;
      throw error;
    }
    const number = formatNumber(prefix, sequence.value);
    const occupied = await Model.exists({ number });
    if (!occupied) return number;
  }

  throw new AppError('Unable to allocate a unique document number', 503, {
    code: 'DOCUMENT_NUMBER_UNAVAILABLE',
    prefix,
  });
}

module.exports = { nextRetailNumber, formatNumber };
