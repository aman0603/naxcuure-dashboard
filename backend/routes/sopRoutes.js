const express = require("express");
const router = express.Router();
const multer = require("multer");
const { storage } = require("../config/cloudinary");
const upload = multer({ storage });

const {
  authenticateUser,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const sopController = require("../controllers/sopController");

router.post(
  "/upload",
  authenticateUser,
  authorizeRoles("managerHead", "owner"),
  upload.single("file"),
  sopController.uploadSOP
);

router.put(
  "/:id",
  authenticateUser,
  authorizeRoles("managerHead", "owner"),
  sopController.updateSOP
);

router.delete(
  "/:id",
  authenticateUser,
  authorizeRoles("owner"),
  sopController.deleteSOP
);

router.get("/search", authenticateUser, sopController.searchSOPs);

router.get("/download/:id", authenticateUser, sopController.downloadSOP);

router.get("/all", authenticateUser, sopController.getAllSOPs);

router.get("/:id", authenticateUser, sopController.getSOPById);

module.exports = router;