const mongoose = require('mongoose');

const PurchaseOrderSchema = new mongoose.Schema({
  vendorName: { type: String, required: true },
  vendorGST: { type: String },
  items: [
    {
      itemName: String,
      quantity: Number,
      unit: String,
      rate: Number,
      taxPercent: Number
    }
  ],
  department: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // ✅ Online document link (e.g., Cloudinary, S3)
  documentUrl: {
    type: String,
    required: false,
    trim: true
  },

  status: {
    type: String,
    enum: ['PO Created', 'GRN Logged', 'Delivered', 'Inventory Added'],
    default: 'PO Created'
  },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PurchaseOrder', PurchaseOrderSchema);
