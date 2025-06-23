const express = require('express');
const router = express.Router();

const {
  addHoliday,
  getAllHolidays,
  updateHoliday,
  deleteHoliday
} = require('../controllers/holidayController');

const { protect } = require('../middleware/authMiddleware');

// =============================
// 🗓️ HOLIDAY MANAGEMENT ROUTES
// =============================

// ➕ Add a new holiday (Only President Operations, Director, or HR Manager)
router.post('/', protect, addHoliday);

// 📅 Get all holidays (Public or authenticated)
router.get('/', getAllHolidays);

// ✏️ Update holiday by ID (Only President Operations, Director, or HR Manager)
router.put('/:id', protect, updateHoliday);

// ❌ Delete holiday by ID (Only President Operations, Director, or HR Manager)
router.delete('/:id', protect, deleteHoliday);

module.exports = router;
