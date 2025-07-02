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
    enum: ["QA", "QC", "PRODUCTION", "ENGINEER"],
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