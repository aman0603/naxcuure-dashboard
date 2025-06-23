const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload'); // Multer middleware for Cloudinary
require('dotenv').config();

// ➕ Add Certificate
router.post(
  '/add',
  protect,
  authorizeRoles('Director', 'President Operations'),
  upload.single('certificateFile'),
  certificateController.addCertificate
);

// 📄 Get All Certificates
router.get(
  '/',
  protect,
  authorizeRoles('Director', 'President Operations'),
  certificateController.getCertificates
);

// ✅ GMP Compliance Status Check
router.get(
  '/gmp-compliance',
  protect,
  authorizeRoles('Director', 'President Operations'),
  certificateController.checkGMPCompliance
);

// 👁️ Preview Certificate by ID
router.get(
  '/:id/preview',
  protect,
  authorizeRoles('Director', 'President Operations'),
  certificateController.previewCertificate
);

// 📥 Download Certificate by ID
router.get(
  '/:id/download',
  protect,
  authorizeRoles('Director', 'President Operations'),
  certificateController.downloadCertificate
);

router.get(
  '/renewal-alerts',
  protect,
  authorizeRoles('Director', 'President Operations'),
  certificateController.getRenewalAlerts
);

// 📌 Valid Certificates
router.get(
  '/current',
  protect,
  authorizeRoles('Director', 'President Operations'),
  certificateController.getCurrentCertificates
);

// ❌ Expired Certificates
router.get(
  '/expired',
  protect,
  authorizeRoles('Director', 'President Operations'),
  certificateController.getExpiredCertificates
);

module.exports = router;
