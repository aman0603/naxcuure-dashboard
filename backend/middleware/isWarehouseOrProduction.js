const isWarehouseOrProduction = (req, res, next) => {
    const user = req.user;
    const allowedDepartments = ['Warehouse', 'Production'];
    const allowedDesignations = [
      'Manager', 'Assistant Manager', 'Executive',
      'Production Head', 'Packing Head', 'Warehouse Head'
    ];
  
    const inAllowedDept = user.departments.some(dept => allowedDepartments.includes(dept));
    const inAllowedDesignation = allowedDesignations.includes(user.designation);
  
    if (inAllowedDept && inAllowedDesignation) {
      return next();
    }
  
    return res.status(403).json({ message: 'Only Warehouse or Production personnel allowed' });
  };
  
  module.exports = isWarehouseOrProduction;
  