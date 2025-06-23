const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  from: {
    type: Date,
    required: true
  },
  to: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  isHalfDay: {
    type: Boolean,
    default: false
  },
  leaveType: {
    type: String,
    enum: ['Full Day', 'Half Day', 'Short Leave'],
    default: 'Full Day'
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  remarks: {
    type: String,
    default: ''
  }
});

module.exports = mongoose.model('Leave', leaveSchema);
