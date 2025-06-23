
const MismatchLog = require('../models/MismatchLog');

// 🔍 Get all mismatch logs
exports.getAllMismatches = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filters = {};
    if (req.query.issueType) filters.issueType = req.query.issueType;
    if (req.query.isResolved) filters.isResolved = req.query.isResolved === 'true';

    const total = await MismatchLog.countDocuments(filters);
    const logs = await MismatchLog.find(filters)
      .sort({ detectedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('poRef invoiceRef grnRef qcRef detectedBy resolvedBy');

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: logs
    });
  } catch (err) {
    console.error('❌ Error fetching mismatch logs:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// 📄 Get single mismatch log
exports.getMismatchById = async (req, res) => {
  try {
    const log = await MismatchLog.findById(req.params.id)
      .populate('poRef invoiceRef grnRef qcRef detectedBy resolvedBy');

    if (!log) return res.status(404).json({ message: 'Mismatch log not found' });

    res.json({ success: true, log });
  } catch (err) {
    console.error('❌ Error fetching mismatch log:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ✅ Mark mismatch as resolved
exports.resolveMismatch = async (req, res) => {
  try {
    const { resolutionNotes } = req.body;
    const log = await MismatchLog.findById(req.params.id);

    if (!log) return res.status(404).json({ message: 'Mismatch log not found' });

    log.isResolved = true;
    log.resolutionNotes = resolutionNotes;
    log.resolvedBy = req.user._id;
    log.resolvedAt = new Date();
    
    await log.save();
    res.json({ success: true, message: 'Mismatch marked as resolved', log });
  } catch (err) {
    console.error('❌ Error resolving mismatch log:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};