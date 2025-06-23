const express = require('express');
const router = express.Router();
const grnController = require('../controllers/grnController');
const { protect } = require('../middleware/authMiddleware');



const allowGRNEntry = (req, res, next) => {
  const { department, role } = req.user;
  if (
    (department === 'Security' && role === 'Head') ||
    department === 'Warehouse'
  ) {
    return next();
  }
  return res.status(403).json({ message: 'Not authorized to log GRN.' });
};


router.post('/add', protect, allowGRNEntry, grnController.addGRNEntry);


router.get('/all', protect, grnController.getAllGRNs);


router.get('/mismatch/check/:grnId', protect, grnController.autoMismatchCheck);

module.exports = router;
