const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
  user_key: {
    type: String,
    required: true,
    index: true
  }
}, { 
  collection: '124',
  strict: false
});

module.exports = mongoose.model('Record', recordSchema); 