const GRNEntry = require('../models/GRNEntry');
const PurchaseOrder = require('../models/PurchaseOrder');
const InvoiceEntry = require('../models/InvoiceEntry');
const MismatchLog = require('../models/MismatchLog');
const autoMismatchCheck = require('../utils/autoMismatchCheck');

// 🔁 Auto log mismatches
const logMismatchAutomatically = async (data) => {
  try {
    const log = new MismatchLog({ ...data });
    await log.save();
    console.log(`📌 Mismatch logged: ${data.issueType} for ${data.itemName}`);
  } catch (err) {
    console.error('❌ Mismatch logging failed:', err);
  }
};

// =====================================
// ➕ Add GRN Entry (Multiple PO + Invoice Support)
// =====================================
exports.addGRNEntry = async (req, res) => {
  try {
    console.log('📦 GRN Data:', req.body);

    const { poRefs, invoiceRefs, vehicleNumber, deliveryDate, itemsReceived } = req.body;

    if (!poRefs || !invoiceRefs || !vehicleNumber || !deliveryDate || !itemsReceived) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const parsedPOs = JSON.parse(poRefs);
    const parsedInvoices = JSON.parse(invoiceRefs);
    const parsedItems = JSON.parse(itemsReceived);

    const grn = new GRNEntry({
      poRefs: parsedPOs,
      invoiceRefs: parsedInvoices,
      vehicleNumber,
      deliveryDate,
      itemsReceived: parsedItems,
      loggedBy: req.user._id,
      status: 'GRN Created'
    });

    await grn.save();

    // 🟢 Update linked PO statuses
    for (const poId of parsedPOs) {
      await PurchaseOrder.findByIdAndUpdate(poId, { status: 'GRN Logged' });
    }

    // 🔍 Check for mismatches
    await exports.autoMismatchCheck(grn, req.user._id);

    res.status(201).json({ success: true, message: 'GRN entry created', grn });
  } catch (err) {
    console.error('❌ Error in GRN creation:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// =====================================
// 📄 Get All GRNs (Paginated, Search)
// =====================================

exports.getAllGRNs = async (req, res) => {
  try {
    const grns = await GRNEntry.find()
      .populate('poRefs', 'vendorName department')
      .populate('invoiceRefs', 'invoiceNumber vendorName')
      .populate('loggedBy', 'name email department')
      .sort({ createdAt: -1 });

    const result = grns.map(grn => ({
      _id: grn._id,
      vehicleNumber: grn.vehicleNumber,
      deliveryDate: grn.deliveryDate,
      status: grn.status,
      createdAt: grn.createdAt,
      loggedBy: grn.loggedBy?.name || 'N/A',
      poRefs: grn.poRefs?.map(po => ({
        _id: po._id,
        vendorName: po.vendorName,
        department: po.department
      })),
      invoiceRefs: grn.invoiceRefs?.map(inv => ({
        _id: inv._id,
        invoiceNumber: inv.invoiceNumber,
        vendorName: inv.vendorName
      })),
      itemsReceived: grn.itemsReceived
    }));

    res.status(200).json({ success: true, grns: result });
  } catch (err) {
    console.error('❌ Error fetching GRNs:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};



exports.addGRNEntry = async (req, res) => {
  try {
    console.log('📦 GRN Data:', req.body);

    const { poRefs, invoiceRefs, vehicleNumber, deliveryDate, itemsReceived } = req.body;

    if (!poRefs || !invoiceRefs || !vehicleNumber || !deliveryDate || !itemsReceived) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const grn = new GRNEntry({
      poRefs: JSON.parse(poRefs),
      invoiceRefs: JSON.parse(invoiceRefs),
      vehicleNumber,
      deliveryDate,
      itemsReceived: JSON.parse(itemsReceived),
      loggedBy: req.user._id,
      status: 'GRN Created'
    });

    await grn.save();

    // 🔄 Update all linked POs to status 'GRN Logged'
    for (const poId of JSON.parse(poRefs)) {
      await PurchaseOrder.findByIdAndUpdate(poId, { status: 'GRN Logged' });
    }

    // 🔍 Automatically detect mismatches and log them
    await autoMismatchCheck(grn._id, req.user._id);

    res.status(201).json({ success: true, message: 'GRN entry created & mismatch check done', grn });
  } catch (err) {
    console.error('❌ Error creating GRN:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

