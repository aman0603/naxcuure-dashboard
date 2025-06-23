const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  updatePassword,
  getProfile,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

// 🔓 Public routes
router.post("/login", login);
router.post("/signup", signup);

// 🔐 Protected routes
router.put("/update-password", protect, updatePassword);
router.get("/profile", protect, getProfile); // <-- Added this

module.exports = router;
