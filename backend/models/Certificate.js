const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  certificateType: String,
  certificateName: String,
  certificateNumber: String,
  issuingAuthority: String,
  issueDate: Date,
  expiryDate: Date,
  reminderDays: Number,
  department: String,
  notes: String,
  certificateFile: String, // Cloudinary URL
  plantName: String,

  addedBy: {
    name: String,
    designation: String,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Certificate', certificateSchema);
