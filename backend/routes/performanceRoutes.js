const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  giveMarks,
  viewMyMarks,
  getPerformanceSummary
} = require('../controllers/performanceController');

// ✅ Route to submit performance marks (Monthly or Quarterly)
router.post('/give', protect, giveMarks);

// ✅ Route for staff to view their own performance history
router.get('/my-marks', protect, viewMyMarks);

// ✅ Route for admin/director to view all performance summaries
router.get('/summary', protect, getPerformanceSummary);

module.exports = router;
