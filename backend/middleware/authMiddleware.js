const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ✅ Middleware to authenticate user using JWT
const authenticateUser = async (req, res, next) => {
  const rawToken = req.header("Authorization");

  if (!rawToken || !rawToken.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  const token = rawToken.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    // Check if user exists and is active
    if (!user || !user.isActive) {
      return res.status(403).json({ message: "Unauthorized: Inactive or unknown user." });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid or expired token." });
  }
};

// Middleware alias for routes
exports.protect = authenticateUser;

// ✅ Middleware to allow only staff users
exports.isStaff = (req, res, next) => {
  if (req.user.role === "Staff") {
    return next();
  }
  return res.status(403).json({ message: "Only staff members can perform this action." });
};

// ✅ Middleware to authorize specific roles
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user.role;

    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ message: "Forbidden: Insufficient role privileges." });
    }

    next();
  };
};


exports.authorizeDesignation = (...designations) => {
  return (req, res, next) => {
    if (!req.user || !designations.includes(req.user.designation)) {
      return res.status(403).json({ message: "Forbidden: designation restricted" });
    }
    next();
  };
};

exports.canEnterGRN = (req, res, next) => {
  const { department, role } = req.user;

  if (
    department === 'Warehouse' ||
    (department === 'Security' && role === 'Head')
  ) {
    return next();
  }

  return res.status(403).json({ message: 'Unauthorized to enter GRN data' });
};



exports.isFromDepartment = (departmentName) => {
  return (req, res, next) => {
    if (req.user.department === departmentName) {
      return next();
    }
    return res.status(403).json({ message: `Access denied. Only ${departmentName} department allowed.` });
  };
};