const mongoose = require('mongoose');

const InventoryAdditionRequestSchema = new mongoose.Schema({
  qcRef: { type: mongoose.Schema.Types.ObjectId, ref: 'QCVerification' },
  itemName: String,
  batchId: String,
  quantity: Number,
  rate: Number,
  unit: String,
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['Pending Approval', 'Approved', 'Rejected'],
    default: 'Pending Approval'
  },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('InventoryAdditionRequest', InventoryAdditionRequestSchema);
