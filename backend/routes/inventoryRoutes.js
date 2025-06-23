const express = require('express');
const router = express.Router();

const inventoryController = require('../controllers/inventoryController');
const inventoryAdditionController = require('../controllers/inventoryAddController');

const { protect, isStaff, authorizeRoles } = require('../middleware/authMiddleware');
const isHeadOrLeadership = require('../middleware/isHeadOrLeadership');
const isDepartmentHeadView = require('../middleware/isDepartmentHeadView');
const isWarehouseOrProduction = require('../middleware/isWarehouseOrProduction');
const User = require('../models/User');

// -------------------------
// Inventory Requests Flow
// -------------------------

// 📝 Staff: Create inventory request
router.post('/request', protect, inventoryController.createRequest);

// ✅ Head: Approve inventory request
router.put('/approve/:id', protect, authorizeRoles('Head'), inventoryController.approveRequest);

// 📦 Warehouse/Production: Issue item
router.put('/issue/:id', protect, isWarehouseOrProduction, inventoryController.issueRequest);

// ✋ Staff: Claim issued item
router.put('/claim/:id', protect, isStaff, inventoryController.claimRequest);

// 👀 Head: View department-specific requests
router.get('/requests/department', protect, isDepartmentHeadView, inventoryController.getRequestsForHead);

// 🙋 My Requests (Staff View)
router.get('/requests', protect, inventoryController.getMyRequests);

// 📦 View all inventory items
router.get('/items', protect, inventoryController.getAllItems);

// 📊 Inventory Status (All items and batches)
router.get('/status', protect, inventoryController.getInventoryStatus);

// 🕰️ Department Request Usage History
router.get('/requests/usage', protect, inventoryController.getPastUsage);

// 🚚 Pending issuance (Warehouse View)
router.get('/requests/pending-issuance', protect, authorizeRoles('Head', 'Warehouse'), inventoryController.getRequestsForIssuance);

// ⚠️ Stock Alerts (Leadership View)
router.get('/alerts', protect, isHeadOrLeadership, inventoryController.getStockAlerts);

// 🔁 Cron: Auto alert for unclaimed items
router.get('/cron/alert', inventoryController.autoClaimAlertJob);

// 📈 Issued/Claimed history for leadership or Warehouse Head
const isWareHead = async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (user.role === 'Head' && user.departments.includes('Warehouse')) return next();
  return res.status(403).json({ message: 'Access denied: not Warehouse Head' });
};

router.get(
  '/history/issued',
  protect,
  (req, res, next) => {
    const allowedRoles = ['Director', 'President Operations'];
    if (allowedRoles.includes(req.user.role)) return next();
    return isWareHead(req, res, next);
  },
  inventoryController.getIssuedAndClaimedHistory
);

// -------------------------
// Inventory Addition Flow
// -------------------------

// ➕ Request to add approved item to inventory (via QC)
router.post(
  '/addition/request',
  protect,
  isWarehouseOrProduction,
  inventoryAdditionController.requestInventoryAddition
);

// ✅ Approve inventory addition and push to inventory
router.put(
  '/addition/approve/:id',
  protect,
  isWarehouseOrProduction,
  inventoryAdditionController.approveInventoryAddition
);

module.exports = router;