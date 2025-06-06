const mongoose = require('mongoose');
const { Schema } = mongoose;

const recordSchema = new Schema({
  application_key: {
    type: String,
    required: true,
    index: true
  },
  data_id: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    default: 'record',
  },
  user_custom_category: {
    type: String,
    required: true,
  },
  user_id: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: () => new Date(),
    required: true,
  },
  lastChangeAt: {
    type: Date,
    default: () => new Date(),
    required: true,
  },
  blNumber: {
    type: Schema.Types.Mixed,
  },
}, { 
  collection: '124',
  strict: false
});

module.exports = mongoose.model('Record', recordSchema); 