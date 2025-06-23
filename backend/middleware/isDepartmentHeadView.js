const User = require('../models/User');

const isDepartmentHeadView = (req, res, next) => {
    if (req.user?.role !== 'Head') {
      return res.status(403).json({ message: 'Access denied: Not a department head' });
    }
    next();
  };
  

module.exports = isDepartmentHeadView;
