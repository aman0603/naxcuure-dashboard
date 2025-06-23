const express = require('express');
const router = express.Router();
const manufacturerController = require('../controllers/manufacturerController');
const { protect } = require('../middleware/authMiddleware');

// ➕ Add a new manufacturer
router.post('/add', protect, manufacturerController.addManufacturer);

// 📄 Get all manufacturers
router.get('/', protect, manufacturerController.getManufacturers);

module.exports = router;