const mongoose = require("mongoose");

const sopSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  version: {
    type: String,
    required: true,
  },
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
      'General Management',
      'Security',
      'Purchase and Procurement',
      'Finance and Accounts',
      'Research and Development',
      'Sales and Marketing',
      'Business Development',
      'Training and Development',
      'Maintenance',
      'Legal and Compliance',
      'Logistics and Dispatch',
      'Sterility Assurance',
      'Calibration and Validation',
      'Labelling and Artwork',
      'Vendor Development',
      'Customer Support',
      'Audit and Inspection',
      'IT Infrastructure',
      'Admin and Facilities',
      'CSR and Public Affairs'
    ],
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  equipmentList: [
    {
      equipment: { type: mongoose.Schema.Types.ObjectId, ref: "Equipment", required: true },
      order: { type: Number, required: true },
    },
  ],
  status: {
    type: String,
    enum: ["Draft", "Reviewing", "Active", "PendingDeletion", "Archived"],
    default: "Draft",
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  approvedAt: {
    type: Date,
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  rejectedAt: {
    type: Date,
  },
  rejectionReason: {
    type: String,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  updatedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("SOP", sopSchema);
