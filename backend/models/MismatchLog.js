const mongoose = require('mongoose');

const MismatchLogSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  poRef: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' },
  invoiceRef: { type: mongoose.Schema.Types.ObjectId, ref: 'InvoiceEntry' },
  grnRef: { type: mongoose.Schema.Types.ObjectId, ref: 'GRNEntry' },
  qcRef: { type: mongoose.Schema.Types.ObjectId, ref: 'QCVerification' },

  expectedQty: Number,
  invoicedQty: Number,
  deliveredQty: Number,
  approvedQty: Number,

  expectedRate: Number,
  invoicedRate: Number,

  issueType: {
    type: String,
    enum: [
      'Overbilled Quantity',
      'Over Delivered',
      'Rate Mismatch',
      'QC Rejection',
      'Unauthorized Batch Entry',
      'Invoice Not Linked to PO',
      'QC Skipped',
      'Fake GRN Entry'
    ],
    required: true
  },

  remarks: String,
  detectedAt: { type: Date, default: Date.now },
  detectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  isResolved: { type: Boolean, default: false },
  resolutionNotes: String,
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: Date
});

module.exports = mongoose.model('MismatchLog', MismatchLogSchema);
