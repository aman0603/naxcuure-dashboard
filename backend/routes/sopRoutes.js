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
  getSOPRequests,
  approveSOP,
  rejectSOP,
  updateSOP,
  deleteSOP,
  permanentDeleteSOP,
  downloadSOP,
} = require("../controllers/sopController");

router.use(protect);
router.post(
  "/",
  authorizeDesignation("QA Head", "Director", "President Operations"),
  upload.single("file"),
  uploadSOP
);

// GET /api/sops — Get all SOPs based on user role and department
router.get("/", getAllSOPs);

// GET /api/sops/requests — Get SOPs pending approval (Director and President Operations only)
router.get("/requests", 
  authorizeDesignation("Director", "President Operations"),
  getSOPRequests
);

// GET /api/sops/:id — Get SOP by ID
router.get("/:id", getSOPById);

// PATCH /api/sops/:id/approve — Approve SOP (Director and President Operations)
router.patch(
  "/:id/approve",
  authorizeDesignation("Director", "President Operations"),
  approveSOP
);

// PATCH /api/sops/:id/reject — Reject SOP (Director and President Operations)
router.patch(
  "/:id/reject",
  authorizeDesignation("Director", "President Operations"),
  rejectSOP
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
  authorizeDesignation("QA Head", "Director", "President Operations"),
  deleteSOP
);

// DELETE /api/sops/:id/permanent — Permanently Delete Archived SOP (Director and President Operations only)
router.delete(
  "/:id/permanent",
  authorizeDesignation("Director", "President Operations"),
  permanentDeleteSOP
);

// GET /api/sops/:id/download — Download SOP
router.get(
  "/:id/download",
  authorizeDesignation("QA Head", "Director", "Staff", "Manager"),
  downloadSOP
);

module.exports = router;
