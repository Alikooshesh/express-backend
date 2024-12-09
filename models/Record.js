const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
  user_key: {
    type: String,
    required: true,
    index: true
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