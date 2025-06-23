const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  country: String,
  registrationNumber: String,
  issueDate: Date,
  expiryDate: Date,
  documentUrl: String,
  reminderDays: Number,
  department: {
    type: String,
    enum: [
      'Quality Assurance',
      'Quality Control',
      'Microbiology',
      'Engineering',
      'Production',
      'Warehouse',
      'Packing',
      'Information Technology',
      'Human Resource and Administration',
      'Formulation and Development',
      'Regulatory Affairs',
      'Housekeeping',
      'Environment Health and Safety',
      'General Management'
    ]
  }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: String,
  composition: String,
  strength: String,
  shelfLife: String,
  manufacturers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Manufacturer'
    }
  ],
  countries: [String],
  registrations: [registrationSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
