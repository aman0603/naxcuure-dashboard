const mongoose = require('mongoose');

const QCVerificationSchema = new mongoose.Schema({
  grnRef: { type: mongoose.Schema.Types.ObjectId, ref: 'GRNEntry' },

  itemResults: [
    {
      itemName: String,
      approvedQty: Number,
      remarks: String,
      status: {
        type: String,
        enum: ['Approved', 'Hold'],
        default: 'Approved'
      },

      // ✅ Trace back to original PO/Invoice if needed
      poRef: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' },
      invoiceRef: { type: mongoose.Schema.Types.ObjectId, ref: 'InvoiceEntry' }
    }
  ],

  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('QCVerification', QCVerificationSchema);
