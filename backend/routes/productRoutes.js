const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');

// ➕ Add product only
router.post('/add', protect, productController.addProduct);

// ➕ Add manufacturer + registration to a product
router.post('/:productId/add-manufacturer', protect, productController.addManufacturerAndRegistration);

// 📋 View all products with manufacturers and registrations (paginated)
router.get('/', protect, productController.getAllProducts);

// 🚨 Expiring/expired registrations
router.get('/expiring', protect, productController.getExpiringRegistrations);

// 🔁 Update a specific registration by productId + registrationId
router.put('/:productId/registration/:registrationId', protect, productController.updateRegistration);

router.get('/filtered', protect, productController.getFilteredProducts);
module.exports = router;
