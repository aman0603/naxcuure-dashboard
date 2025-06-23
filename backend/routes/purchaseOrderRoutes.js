// routes/purchaseOrderRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer(); // for in-memory upload (buffer)
const purchaseOrderController = require('../controllers/purchaseOrderController');
const { protect } = require('../middleware/auth');


// 🔒 Middleware to check designation
const authorizePOCreator = (req, res, next) => {
  const allowedDesignations = ['President Operations', 'Quality Head', 'Plant Head'];

  if (!req.user || !allowedDesignations.includes(req.user.designation)) {
    return res.status(403).json({ message: 'Unauthorized: Insufficient permissions to create Purchase Order' });
  }

  next();
};

// =====================================
// ➕ Route: Add Purchase Order (with file)
// =====================================
router.post(
  '/add',
  upload.single('poFile'), // expecting a file field named 'poFile'
  authorizePOCreator,
  purchaseOrderController.addPurchaseOrder
);

router.get('/', protect, getAllPurchaseOrders);

module.exports = router;