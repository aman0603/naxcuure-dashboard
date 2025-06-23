const express = require('express');
const router = express.Router();
const multer = require('multer');
const { addInvoice } = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');

// Multer setup for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 📄 Route: Add Invoice (Authenticated users only)
router.post(
  '/',
  protect,
  upload.single('invoiceFile'),
  addInvoice
);
router.get('/', protect, getAllInvoices);

module.exports = router;
