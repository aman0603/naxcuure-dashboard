const mongoose = require('mongoose');

const InvoiceEntrySchema = new mongoose.Schema({
  poRef: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' },
  invoiceNumber: { type: String, required: true },
  invoiceDate: { type: Date, required: true },
  items: [
    {
      itemName: String,
      quantity: Number,
      rate: Number,
      taxPercent: Number
    }
  ],

  // ✅ Online Invoice PDF or document link
  documentUrl: {
    type: String,
    required: false,
    trim: true
  },

  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('InvoiceEntry', InvoiceEntrySchema);
