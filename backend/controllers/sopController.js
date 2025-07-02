const SOP = require("../models/Sop");
const { cloudinary } = require("../config/cloudinary");

// Audit logging function (simplified, assumes an audit model or logging system)
const logAudit = async (action, sopId, userId, details) => {
  // Placeholder: Implement audit logging to store action, user, timestamp, and details
  console.log(`Audit: ${action} on SOP ${sopId} by user ${userId} - ${details}`);
};

// Get all SOPs
exports.getAllSOPs = async (req, res) => {
  try {
    const filter = {};
    if (!["Director", "QA Head"].includes(req.user.designation)) {
      filter.status = "Active";
      filter.department = req.user.department?.name || req.user.department;
    }

    const sops = await SOP.find(filter)
      .populate("uploadedBy", "name email designation")
      .sort({ createdAt: -1 });

    res.json(sops);
  } catch (err) {
    res.status(500).json({ message: "❌ Failed to fetch SOPs", error: err.message });
  }
};

// Get single SOP by ID
exports.getSOPById = async (req, res) => {
  try {
    const sop = await SOP.findById(req.params.id)
      .populate("uploadedBy", "name email designation");

    if (!sop) return res.status(404).json({ message: "SOP not found" });

    const isPrivileged = ["Director", "QA Head"].includes(req.user.designation);
    const isSameDept = sop.department === (req.user.department?.name || req.user.department);

    if (!isPrivileged && (sop.status !== "Active" || !isSameDept)) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(sop);
  } catch (err) {
    res.status(500).json({ message: "❌ Failed to fetch SOP", error: err.message });
  }
};

// Upload new SOP
exports.uploadSOP = async (req, res) => {
  try {
    const { title, version, department } = req.body;

    if (!req.file?.path) {
      return res.status(400).json({ message: "❌ PDF file is required" });
    }

    const status = req.user.designation === "Director" ? "Active" : "Reviewing";

    const sop = new SOP({
      title,
      version,
      department,
      fileUrl: req.file.path,
      uploadedBy: req.user._id,
      status,
    });

    await sop.save();
    await logAudit("Upload", sop._id, req.user._id, `SOP ${title} uploaded with status ${status}`);

    res.status(201).json({ message: `✅ SOP uploaded successfully (Status: ${status})`, sop });
  } catch (err) {
    res.status(500).json({ message: "❌ Error uploading SOP", error: err.message });
  }
};

// Approve SOP (Director only)
exports.approveSOP = async (req, res) => {
  try {
    const sop = await SOP.findById(req.params.id);
    if (!sop) return res.status(404).json({ message: "SOP not found" });

    if (sop.status !== "Reviewing") {
      return res.status(400).json({ message: "SOP is not in Reviewing state" });
    }

    sop.status = "Active";
    sop.approvedBy = req.user._id;
    sop.approvedAt = new Date();
    await sop.save();

    await logAudit("Approve", sop._id, req.user._id, `SOP ${sop.title} approved`);

    res.json({ message: "✅ SOP approved", sop });
  } catch (err) {
    res.status(500).json({ message: "❌ Failed to approve SOP", error: err.message });
  }
};

// Update/Modify SOP
exports.updateSOP = async (req, res) => {
  try {
    const sop = await SOP.findById(req.params.id);
    if (!sop) return res.status(404).json({ message: "SOP not found" });

    const updates = {};
    if (req.body.title) updates.title = req.body.title;
    if (req.body.version) updates.version = req.body.version;
    if (req.body.department) updates.department = req.body.department;
    if (req.file?.path) updates.fileUrl = req.file.path;

    updates.status = req.user.designation === "Director" ? "Active" : "Reviewing";
    updates.updatedBy = req.user._id;
    updates.updatedAt = new Date();

    const updatedSOP = await SOP.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate("uploadedBy", "name email designation");

    await logAudit("Update", sop._id, req.user._id, `SOP ${sop.title} updated with status ${updates.status}`);

    res.json({ message: `✅ SOP updated (Status: ${updates.status})`, sop: updatedSOP });
  } catch (err) {
    res.status(500).json({ message: "❌ Failed to update SOP", error: err.message });
  }
};

// Delete SOP
exports.deleteSOP = async (req, res) => {
  try {
    const sop = await SOP.findById(req.params.id);
    if (!sop) return res.status(404).json({ message: "SOP not found" });

    if (req.user.designation === "QA Head" && sop.status !== "Reviewing") {
      return res.status(403).json({ message: "QA Head can only delete SOPs in Reviewing state" });
    }

    if (req.user.designation === "QA Head") {
      // QA Head initiates deletion request
      sop.status = "PendingDeletion";
      await sop.save();
      await logAudit("Deletion Request", sop._id, req.user._id, `SOP ${sop.title} marked for deletion`);
      return res.json({ message: "🗑️ SOP deletion request sent for Director approval" });
    }

    // Director can delete directly
    sop.status = "Archived";
    await sop.save();
    await logAudit("Delete", sop._id, req.user._id, `SOP ${sop.title} archived`);

    res.json({ message: "🗑️ SOP archived successfully" });
  } catch (err) {
    res.status(500).json({ message: "❌ Failed to archive SOP", error: err.message });
  }
};

// Download SOP
exports.downloadSOP = async (req, res) => {
  try {
    const sop = await SOP.findById(req.params.id);
    if (!sop) return res.status(404).json({ message: "SOP not found" });

    const isPrivileged = ["Director", "QA Head"].includes(req.user.designation);
    const isSameDept = sop.department === (req.user.department?.name || req.user.department);

    if (!isPrivileged && (sop.status !== "Active" || !isSameDept)) {
      return res.status(403).json({ message: "Access denied" });
    }

    await logAudit("Download", sop._id, req.user._id, `SOP ${sop.title} downloaded`);
    res.redirect(sop.fileUrl);
  } catch (err) {
    res.status(500).json({ message: "❌ Error downloading SOP", error: err.message });
  }
};