const mongoose = require('mongoose');

const schemaSchema = new mongoose.Schema({
  application_key: {
    type: String,
    required: true,
  },
  data_id: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    default: 'schema',
  },
  user_custom_category: {
    type: String,
    required: true,
  },
  method: {
    type: String,
    required: true,
  },
  access: {
    type: String,
    enum: ['all', 'user', 'admin'],
    required: true,
  },
}, {
  collection: 'schemas',
  strict: false,
});

module.exports = mongoose.model('Schema', schemaSchema); 