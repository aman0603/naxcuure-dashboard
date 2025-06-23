const QCVerification = require('../models/QCVerification');
const GRNEntry = require('../models/GRNEntry');
const { logMismatchAutomatically } = require('../utils/mismatchLogger');

// =====================================
// ✅ Verify QC after GRN (per item)
// =====================================

exports.verifyQC = async (req, res) => {
  try {
    console.log('🔬 QC Input:', req.body);

    const { grnRef, itemResults } = req.body;

    if (!grnRef || !itemResults) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const parsedResults = JSON.parse(itemResults); // Ensure it's parsed

    const qc = new QCVerification({
      grnRef,
      itemResults: parsedResults,
      verifiedBy: req.user._id
    });

    await qc.save();

    // Get the GRN details to cross-check deliveredQty
    const grn = await GRNEntry.findById(grnRef);

    // === Auto log mismatches based on QC and GRN comparison ===
    for (const item of parsedResults) {
      const grnItem = grn.itemsReceived.find(i => i.itemName === item.itemName);

      if (!grnItem) {
        await logMismatchAutomatically({
          itemName: item.itemName,
          grnRef,
          qcRef: qc._id,
          issueType: 'Fake GRN Entry',
          remarks: 'Item in QC not found in GRN',
          detectedBy: req.user._id
        });
        continue;
      }

      if (item.status === 'Hold') {
        await logMismatchAutomatically({
          itemName: item.itemName,
          grnRef,
          qcRef: qc._id,
          deliveredQty: grnItem.receivedQty,
          approvedQty: item.approvedQty,
          issueType: 'QC Rejection',
          remarks: item.remarks || 'QC Hold status triggered',
          detectedBy: req.user._id
        });
      }

      if (item.approvedQty > grnItem.receivedQty) {
        await logMismatchAutomatically({
          itemName: item.itemName,
          grnRef,
          qcRef: qc._id,
          deliveredQty: grnItem.receivedQty,
          approvedQty: item.approvedQty,
          issueType: 'Unauthorized Batch Entry',
          remarks: 'QC approved more than delivered',
          detectedBy: req.user._id
        });
      }
    }

    // Set GRN status based on QC results
    const hasHold = parsedResults.some(item => item.status === 'Hold');
    const newStatus = hasHold ? 'QC Hold' : 'QC Approved';
    await GRNEntry.findByIdAndUpdate(grnRef, { status: newStatus });

    res.status(201).json({ success: true, message: 'QC verification completed', qc });

  } catch (err) {
    console.error('❌ Error in QC verification:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


exports.getAllQCs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await QCVerification.countDocuments();
    const qcs = await QCVerification.find()
      .sort({ verifiedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('grnRef', 'vehicleNumber deliveryDate itemsReceived')
      .populate('verifiedBy', 'name email department designation');

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: qcs
    });
  } catch (err) {
    console.error('❌ Error fetching QC verifications:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// controllers/qcController.js
exports.getQCById = async (req, res) => {
  try {
    const qc = await QCVerification.findById(req.params.id)
      .populate('grnRef')
      .populate('verifiedBy', 'name designation email');

    if (!qc) return res.status(404).json({ message: 'QC not found' });

    res.json({ success: true, qc });
  } catch (err) {
    console.error('❌ Error fetching QC by ID:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
