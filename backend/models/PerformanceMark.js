const mongoose = require('mongoose');

const PerformanceMarkSchema = new mongoose.Schema({
  evaluator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  evaluatee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  evaluatorRole: {
    type: String,
    enum: ['Staff', 'Head', 'Quality Head', 'Plant Head', 'Director', 'President Operations'],
    required: true,
  },
  evaluateeRole: {
    type: String,
    enum: ['Staff', 'Head', 'Quality Head', 'Plant Head', 'Director', 'President Operations'],
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  sessionType: {
    type: String,
    enum: ['Monthly', 'Quarterly'],
    required: true,
  },
  sessionMonth: {
    type: Number, // 1 - 12 (Jan to Dec)
    required: true,
  },
  sessionYear: {
    type: Number,
    required: true,
  },
  marks: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  remarks: {
    type: String,
    maxlength: 500,
  },
  submissionDate: {
    type: Date,
    default: Date.now,
  },
  isLate: {
    type: Boolean,
    default: false,
  }
}, {
  timestamps: true
});

PerformanceMarkSchema.index(
  { evaluator: 1, evaluatee: 1, sessionMonth: 1, sessionYear: 1 },
  { unique: true }
);

module.exports = mongoose.model('PerformanceMark', PerformanceMarkSchema);
