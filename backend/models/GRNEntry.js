const mongoose = require('mongoose');

const GRNEntrySchema = new mongoose.Schema({
  poRefs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' }],     // ✅ multiple POs
  invoiceRefs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'InvoiceEntry' }], // ✅ multiple Invoices

  vehicleNumber: String,
  deliveryDate: { type: Date, required: true },

  itemsReceived: [
    {
      itemName: String,
      poRef: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' },   // ✅ link item to specific PO
      invoiceRef: { type: mongoose.Schema.Types.ObjectId, ref: 'InvoiceEntry' }, // ✅ link item to specific Invoice
      receivedQty: Number,
      damagedQty: Number,
      remarks: String
    }
  ],

  loggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['GRN Created', 'Under QC', 'QC Approved', 'QC Hold'],
    default: 'GRN Created'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GRNEntry', GRNEntrySchema);
