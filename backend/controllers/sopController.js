const SOP = require("../models/Sop");
const Equipment = require("../models/Equipment");
const { cloudinary } = require("../config/cloudinary");

exports.getAllSOPs = async (req, res) => {
  try {
    const sops = await SOP.find()
      .populate("uploadedBy", "name email designation")
      .populate("equipmentList.equipment", "name code department calibrated isCalibrated");
    res.json(sops);
  } catch (err) {
    res.status(500).json({ message: "❌ Failed to fetch SOPs", error: err.message });
  }
};

exports.getSOPById = async (req, res) => {
  try {
    const sop = await SOP.findById(req.params.id)
      .populate("uploadedBy", "name email designation")
      .populate("equipmentList.equipment", "name code department calibrated isCalibrated");
    if (!sop) return res.status(404).json({ message: "SOP not found" });
    res.json(sop);
  } catch (err) {
    res.status(500).json({ message: "❌ Failed to fetch SOP", error: err.message });
  }
};

exports.uploadSOP = async (req, res) => {
  try {
    const { title, version, department, equipmentList } = req.body;

    if (!req.file?.path) {
      return res.status(400).json({ message: "❌ PDF file is required" });
    }

    const parsedEquipmentList = equipmentList
      ? JSON.parse(equipmentList).map(item => ({
          equipment: item.equipment,
          order: item.order
        }))
      : [];

    const sop = new SOP({
      title,
      version,
      department,
      fileUrl: req.file.path,
      uploadedBy: req.user._id,
      status: "Draft",
      equipmentList: parsedEquipmentList
    });

    await sop.save();

    res.status(201).json({ message: "✅ SOP uploaded successfully", sop });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "❌ Error uploading SOP", error: err.message });
  }
};

exports.updateSOP = async (req, res) => {
  try {
    if (req.body.equipmentList) {
      req.body.equipmentList = JSON.parse(req.body.equipmentList);
    }

    const updated = await SOP.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: "SOP not found" });
    res.json({ message: "✅ SOP updated", sop: updated });
  } catch (err) {
    res.status(500).json({ message: "❌ Server error", error: err.message });
  }
};

exports.deleteSOP = async (req, res) => {
  try {
    const sop = await SOP.findById(req.params.id);
    if (!sop) return res.status(404).json({ message: "SOP not found" });

    const publicId = sop.fileUrl.split("/").pop().split(".")[0];
    await cloudinary.uploader.destroy(`compliance_docs/${publicId}`, { resource_type: "raw" });

    await SOP.findByIdAndDelete(req.params.id);
    res.json({ message: "🗑️ SOP deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "❌ Failed to delete SOP", error: err.message });
  }
};

exports.downloadSOP = async (req, res) => {
  try {
    const sop = await SOP.findById(req.params.id);
    if (!sop) return res.status(404).json({ message: "SOP not found" });
    res.redirect(sop.fileUrl);
  } catch (err) {
    res.status(500).json({ message: "❌ Error downloading SOP", error: err.message });
  }
};

exports.searchSOPs = async (req, res) => {
  try {
    const { department, status } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (status) filter.status = status;

    const sops = await SOP.find(filter).populate("equipmentList.equipment", "name code department");
    res.json({ count: sops.length, sops });
  } catch (err) {
    res.status(500).json({ message: "❌ Search failed", error: err.message });
  }
};