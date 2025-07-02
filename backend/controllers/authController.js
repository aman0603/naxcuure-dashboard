const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Auto-increment empCode (eCode)
const generateECode = async () => {
  const counter = await Counter.findOneAndUpdate(
    { name: "employee" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq.toString();
};

// Random password generator
const generateRandomPassword = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password'); // exclude password
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
};
// ----------------------------
// Signup Controller
// ----------------------------
exports.signup = async (req, res) => {
  const { name, email, departments, designation, role, superiorId } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(409).json({ message: "User already exists" });

    const totalUsers = await User.countDocuments();

    // First user becomes Director if none exist
    const assignedRole = totalUsers === 0 ? "Director" : role || "Staff";
    const assignedDesignation = totalUsers === 0 ? "Director" : designation;

    const rawPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const eCode = await generateECode();

    const user = new User({
      empCode: eCode,
      name,
      email,
      password: hashedPassword,
      departments,
      designation: assignedDesignation,
      role: assignedRole,
      superior: superiorId || null,
      isActive: true
    });

    await user.save();

    res.status(201).json({
      message: totalUsers === 0
        ? "👑 First admin user registered successfully"
        : "✅ User registered successfully",
      userId: user._id,
      generatedPassword: rawPassword,
      empCode: user.empCode,
    });

  } catch (err) {
    console.error("❌ Signup Error:", err.message);
    res.status(500).json({ message: "❌ Server error" });
  }
};

// ----------------------------
// Login Controller
// ----------------------------
exports.login = async (req, res) => {
  const { empCode, password } = req.body;

  try {
    const user = await User.findOne({ empCode });

    if (!user || !user.isActive) {
      return res.status(404).json({ message: "User not found or inactive" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        departments: user.departments,
        designation: user.designation
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      message: "✅ Login successful",
      token,
      user: {
        id: user._id,
        empCode: user.empCode,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation,
        departments: user.departments
      }
    });

  } catch (err) {
    console.error("❌ Login Error:", err.message);
    return res.status(500).json({ message: "❌ Server error" });
  }
};

// ----------------------------
// Update Password Controller
// ----------------------------
exports.updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = req.user; // ✅ Already authenticated and populated by middleware

  try {
    // ✅ Match current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // ✅ Set new plain password — pre-save hook will hash it
    user.password = newPassword;
    await user.save();

    return res.status(200).json({ success: true, message: "✅ Password updated successfully" });

  } catch (err) {
    console.error("❌ Update Password Error:", err.message);
    return res.status(500).json({ message: "❌ Server error" });
  }
};
