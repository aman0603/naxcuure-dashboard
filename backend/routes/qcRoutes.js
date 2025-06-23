const express = require('express');
const router = express.Router();

const {
  verifyQC,
  getAllQCs,
  getQCById
} = require('../controllers/qcController');

const { protect, isFromDepartment } = require('../middlewares/authMiddleware');

// 🔒 Allow only users from 'Quality Control' department to access these routes
const restrictToQC = [protect, isFromDepartment('Quality Control')];

// ===============================
// ✅ POST /qc/verify
// ===============================
router.post('/verify', ...restrictToQC, verifyQC);

// ===============================
// 📄 GET /qc/all?page=1&limit=10
// ===============================
router.get('/all', ...restrictToQC, getAllQCs);

// ===============================
// 🔍 GET /qc/:id
// ===============================
router.get('/:id', ...restrictToQC, getQCById);

module.exports = router;