const mongoose = require("mongoose");

const sopSchema = new mongoose.Schema({
  title: String,
  version: String,
  department: {
    type: String,
    enum: ["QA", "QC", "PRODUCTION", "ENGINEER"],
    required: true,
  },
  fileUrl: String,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  equipmentList: [
    {
      equipment: { type: mongoose.Schema.Types.ObjectId, ref: "Equipment", required: true },
      order: { type: Number, required: true }
    }
  ],
  status: {
    type: String,
    enum: ["Active", "Archived", "Draft"],
    default: "Draft"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("SOP", sopSchema);
