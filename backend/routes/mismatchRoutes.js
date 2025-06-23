const express = require('express');
const router = express.Router();

const {
  getAllMismatches,
  getMismatchById,
  resolveMismatch
} = require('../controllers/mismatchController');

const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// 🔍 Anyone logged in can view mismatches
router.get('/', protect, getAllMismatches);
router.get('/:id', protect, getMismatchById);

// ✅ Only senior roles can resolve
router.put('/:id/resolve',
  protect,
  authorizeRoles('Director', 'President Operations', 'Quality Head', 'Plant Head'),
  resolveMismatch
);

module.exports = router;
