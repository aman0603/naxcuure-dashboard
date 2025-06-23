const express = require('express');
const router = express.Router();

const {
  addUser,
  applyForLeave,
  approveOrRejectLeave,
  getAllUsers,
  getUserLeaveSummary,
  getAllUsersRaw
} = require('../controllers/userController');

const {
  protect,
  authorizeRoles,
  isStaff
} = require('../middleware/authMiddleware');

// =========================
// 👤 USER MANAGEMENT ROUTES
// =========================

// ✅ Add a new user (handled inside controller)
router.post('/add-user', protect, addUser);

// ✅ Get all users with filters and pagination
router.get('/all-users', protect, getAllUsers);

router.get('/:id/leave-summary', protect, getUserLeaveSummary);
router.get('/all-users-raw', protect, getAllUsersRaw);


// =========================
// 📝 LEAVE MANAGEMENT ROUTES
// =========================

// ✅ Apply for leave (Staff, Head, etc.)
router.post('/apply-leave', protect, applyForLeave);

// ✅ Approve or reject leave
router.put('/leave/:id/decision', protect, approveOrRejectLeave);

module.exports = router;
