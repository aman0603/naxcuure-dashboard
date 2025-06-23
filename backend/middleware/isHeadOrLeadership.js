const User = require('../models/User');

const isHeadOrLeadership = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    const allowedRoles = [
      'Director',
      'President Operations',
      'Plant Head',
      'Quality Head',
      'Head' // covers all department heads
    ];

    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient privileges' });
    }

    next();
  } catch (err) {
    console.error('❌ Role check error:', err);
    res.status(500).json({ message: 'Server error in role check' });
  }
};

module.exports = isHeadOrLeadership;
