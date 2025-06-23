const mongoose = require('mongoose');

const BatchSchema = new mongoose.Schema({
  batchId: { type: String, required: true },
  quantity: { type: Number, required: true },
  rate: { type: Number, required: true },

  // 🔍 Traceability Fields
  poRef: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' },
  invoiceRef: { type: mongoose.Schema.Types.ObjectId, ref: 'InvoiceEntry' },
  grnRef: { type: mongoose.Schema.Types.ObjectId, ref: 'GRNEntry' },
  qcRef: { type: mongoose.Schema.Types.ObjectId, ref: 'QCVerification' },

  // 👤 Action Tracking
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  addedOn: { type: Date, default: Date.now },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },

  issued: { type: Number, default: 0 }
});


const InventoryItemSchema = new mongoose.Schema({
  itemName: { type: String, required: true, unique: true, trim: true },
  unit: { type: String, required: true }, // e.g. pcs, box, bottle
  description: { type: String },
  batches: [BatchSchema]
}, { timestamps: true });

module.exports = mongoose.model('InventoryItem', InventoryItemSchema);
