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
  BOLDate: {
    type: Date,
    default: () => new Date(),
  },
  shipDate: {
    type: Date,
    default: () => new Date(),
  },
  receiveDate: {
    type: Date,
    default: () => new Date(),
  },
  vesselName: {
    type: String,
  },
  vesselNo: {
    type: String,
  },
  vesselType: {
    type: String,
  },
  trackingURL: {
    type: String,
  },
  shipper: {
    type: String,
  },
  shipperAddr: {
    type: String,
  },
  consignee: {
    type: String,
  },
  consigneeAddr: {
    type: String,
  },
  origin: {
    type: String,
  },
  destination: {
    type: String,
  },
  category: {
    type: String,
  },
  productName: {
    type: String,
  },
  unit: {
    type: String,
  },
  cargoDesc: {
    type: String,
  },
  stampUrl: {
    type: String,
  },
  signatureUrl: {
    type: String,
  },
  grossWidth: {
    type: Number,
  },
  quantity: {
    type: Number,
  },
  signScale: {
    type: Number,
  },
  stampAngle: {
    type: Number,
  },
}, { 
  collection: '124',
  strict: false
});

module.exports = mongoose.model('Record', recordSchema); 