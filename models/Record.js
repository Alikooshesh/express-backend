const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
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
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { 
  collection: '124',
  strict: false
});

module.exports = mongoose.model('Record', recordSchema); 