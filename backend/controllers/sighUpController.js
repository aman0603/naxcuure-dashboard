const User = require("../models/User");
const Designation = require("../models/Designation");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const generatePassword = require("generate-password");

exports.signup = async (req, res) => {
  const { name, email, designationId, departmentId } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ message: "User already exists" });

    const totalUsers = await User.countDocuments();
    const designation = await Designation.findById(designationId);
    if (!designation) return res.status(400).json({ message: "Invalid designation" });

    // Auto-generate password
    const rawPassword = generatePassword.generate({
      length: 10,
      numbers: true,
      uppercase: true
    });

    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      designation: designation._id,
      department: departmentId,
      employmentStatus: "active"
    });

    if (totalUsers === 0) {
      const ownerDesignation = await Designation.findOne({ accessLevel: "owner" });
      if (ownerDesignation) user.designation = ownerDesignation._id;
      await user.save();
      return res.status(201).json({
        message: "👑 First admin user registered successfully",
        userId: user._id,
        generatedPassword: rawPassword
      });
    }

    const allowedRoles = ["owner", "managerHead", "manager"];
    if (!allowedRoles.includes(designation.accessLevel)) {
      return res.status(403).json({ message: "❌ Not authorized to create this role" });
    }

    await user.save();

    res.status(201).json({
      message: "✅ User registered successfully",
      userId: user._id,
      generatedPassword: rawPassword
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "❌ Server error" });
  }
};