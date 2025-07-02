const express = require("express");
const router = express.Router();
const multer = require("multer");
const { storage } = require("../config/cloudinary");
const upload = multer({ storage });

const {
  protect,
  authorizeDesignation,
} = require("../middleware/authMiddleware");

const {
  uploadSOP,
  getAllSOPs,
  getSOPById,
  approveSOP,
  updateSOP,
  deleteSOP,
  downloadSOP,
} = require("../controllers/sopController");

router.use(protect);
router.post(
  "/",
  authorizeDesignation("QA Head", "Director"),
  upload.single("file"),
  uploadSOP
);

// GET /api/sops — Get all SOPs based on user role and department
router.get("/", getAllSOPs);

// GET /api/sops/:id — Get SOP by ID
router.get("/:id", getSOPById);

// PATCH /api/sops/:id/approve — Approve SOP (Director only)
router.patch(
  "/:id/approve",
  authorizeDesignation("Director"),
  approveSOP
);

// PATCH /api/sops/:id — Update/Modify SOP (Department Head or Director)
router.patch(
  "/:id",
  authorizeDesignation("QA Head", "Director"),
  upload.single("file"),
  updateSOP
);

// DELETE /api/sops/:id — Delete SOP (Director or Department Head with approval)
router.delete(
  "/:id",
  authorizeDesignation("QA Head", "Director"),
  deleteSOP
);

// GET /api/sops/:id/download — Download SOP
router.get(
  "/:id/download",
  authorizeDesignation("QA Head", "Director", "Staff", "Manager"),
  downloadSOP
);

module.exports = router;