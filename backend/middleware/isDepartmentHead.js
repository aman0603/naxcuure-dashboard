const InventoryRequest = require('../models/InventoryRequest');
const User = require('../models/User');

// ✅ Middleware: Allow only same-department heads to approve
const isDepartmentHead = async (req, res, next) => {
  try {
    const request = await InventoryRequest.findById(req.params.id).populate('requestedBy');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const user = req.user;

    // Must be a department head
    const isHead = user.role === 'Head';
    const isSameDept = user.departments.includes(request.department);

    if (!isHead || !isSameDept) {
      return res.status(403).json({ message: 'Access denied: Only same-department heads can approve this request.' });
    }

    next();
  } catch (err) {
    console.error('Department Head Check Error:', err.message);
    return res.status(500).json({ message: 'Server error during department head validation' });
  }
};

module.exports = isDepartmentHead;
