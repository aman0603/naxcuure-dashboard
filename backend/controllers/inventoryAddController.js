const InventoryItem = require('../models/InventoryItem');
const InventoryAdditionRequest = require('../models/InventoryAdditionRequest');
const QCVerification = require('../models/QCVerification');
const GRNEntry = require('../models/GRNEntry');

exports.requestInventoryAddition = async (req, res) => {
  try {
    const { qcRef, itemName, batchId, quantity, rate, unit } = req.body;

    if (!qcRef || !itemName || !batchId || !quantity || !rate || !unit) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const request = new InventoryAdditionRequest({
      qcRef,
      itemName,
      batchId,
      quantity,
      rate,
      unit,
      requestedBy: req.user._id,
      status: 'Pending Approval'
    });

    await request.save();

    res.status(201).json({ success: true, message: 'Inventory addition request created', request });
  } catch (err) {
    console.error('❌ Error in inventory addition request:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// =====================================
// ✅ Approve Inventory Addition (with QC verification)
// =====================================
exports.approveInventoryAddition = async (req, res) => {
  try {
    const request = await InventoryAdditionRequest.findById(req.params.id);

    if (!request || request.status !== 'Pending Approval') {
      return res.status(400).json({ message: 'Invalid or already processed request' });
    }

    const qc = await QCVerification.findById(request.qcRef);
    if (!qc) return res.status(404).json({ message: 'QC record not found' });

    const itemQC = qc.itemResults.find(i => i.itemName === request.itemName);
    if (!itemQC || itemQC.status !== 'Approved') {
      return res.status(400).json({ message: 'Item not approved by QC' });
    }

    if (request.quantity > itemQC.approvedQty) {
      return res.status(400).json({ message: `Only ${itemQC.approvedQty} approved by QC, but ${request.quantity} requested` });
    }

    const grn = await GRNEntry.findById(qc.grnRef);
    const invoiceRef = grn ? grn.itemsReceived.find(i => i.itemName === request.itemName)?.invoiceRef : null;
    const poRef = grn ? grn.itemsReceived.find(i => i.itemName === request.itemName)?.poRef : null;

    let item = await InventoryItem.findOne({ itemName: request.itemName });

    const newBatch = {
      batchId: request.batchId,
      quantity: request.quantity,
      rate: request.rate,
      unit: request.unit,
      addedBy: req.user._id,
      addedOn: new Date(),
      approvedBy: req.user._id,
      approvedAt: new Date(),
      qcRef: request.qcRef,
      grnRef: grn?._id,
      poRef,
      invoiceRef
    };

    if (!item) {
      item = new InventoryItem({
        itemName: request.itemName,
        unit: request.unit,
        batches: [newBatch]
      });
    } else {
      item.batches.push(newBatch);
    }

    await item.save();

    request.status = 'Approved';
    request.approvedBy = req.user._id;
    request.approvedAt = new Date();
    await request.save();

    res.json({ success: true, message: 'Inventory added to stock', item });
  } catch (err) {
    console.error('❌ Error approving inventory addition:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};