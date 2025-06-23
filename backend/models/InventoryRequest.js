const mongoose = require('mongoose');

const InventoryRequestSchema = new mongoose.Schema({
  item: { type: String, required: true },
  unit: { type: String }, // ✅ Unit of the item (pcs, box, etc.)
  quantity: { type: Number, required: true },
  reason: { type: String, required: true },
  department: { type: String, required: true },

  urgency: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium',
    required: true
  }, // ✅ Urgency level

  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  status: {
    type: String,
    enum: [
      'Pending Department Head Approval',
      'Pending Warehouse Issuance',
      'Issued',
      'Claimed',
      'Rejected'
    ],
    default: 'Pending Department Head Approval'
  },

  batchId: { type: String },
  quantityIssued: { type: Number },

  approvedAt: { type: Date },
  issuedAt: { type: Date },
  claimedAt: { type: Date },

  pendingApprovalFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('InventoryRequest', InventoryRequestSchema);
