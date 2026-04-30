const mongoose = require('mongoose');

function withJsonTransform(schema) {
  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret) => {
      delete ret._id;
      return ret;
    },
  });
  schema.set('toObject', { virtuals: true, versionKey: false });
  return schema;
}

module.exports = { withJsonTransform, mongoose };
