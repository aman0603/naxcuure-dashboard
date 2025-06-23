const InventoryRequest = require('../models/InventoryRequest');
const InventoryItem = require('../models/InventoryItem');
const ClaimAlert = require('../models/ClaimAlert');
const User = require('../models/User');
const { sendEmail } = require('../utils/mail');
// =============================================
// 1. Staff: Create Request
// =============================================

exports.createRequest = async (req, res) => {
  try {
    const { item, quantity, reason, urgency, unit: unitFromFrontend } = req.body;
    const user = await User.findById(req.user._id);

    let status = '', pendingApprovalFrom = null;
    let unit = unitFromFrontend || 'N/A';
    let stockWarning = null;

    const existingItem = await InventoryItem.findOne({ itemName: item });

    if (existingItem) {
      unit = existingItem.unit;
      const totalAvailable = existingItem.batches.reduce(
        (sum, b) => sum + (b.quantity - b.issued), 0
      );
      if (totalAvailable < quantity) {
        stockWarning = `⚠️ Only ${totalAvailable} ${unit} in stock, but ${quantity} requested.`;
      }
    }

    if (['Head', 'President Operations', 'Director', 'Plant Head', 'Quality Head'].includes(user.role)) {
      status = 'Pending Warehouse Issuance';
    } else {
      const deptHead = await User.findOne({
        departments: { $in: user.departments },
        role: 'Head'
      });
      if (!deptHead) {
        return res.status(400).json({ message: 'Department Head not found' });
      }
      pendingApprovalFrom = deptHead._id;
      status = 'Pending Department Head Approval';
    }

    const newRequest = new InventoryRequest({
      item,
      unit,
      quantity,
      reason,
      urgency,
      department: user.departments[0],
      requestedBy: user._id,
      status,
      pendingApprovalFrom,
      approvedBy: status === 'Pending Warehouse Issuance' ? user._id : undefined,
      approvedAt: status === 'Pending Warehouse Issuance' ? new Date() : undefined
    });

    await newRequest.save();

    // ✅ Send Email to Department Head
    if (pendingApprovalFrom) {
      const deptHeadUser = await User.findById(pendingApprovalFrom);
      if (deptHeadUser?.email) {
        await sendEmail({
          to: deptHeadUser.email,
          subject: `📝 New Inventory Request by ${user.name}`,
          html: `
            <p>Dear ${deptHeadUser.name},</p>
            <p>A new inventory request has been created by ${user.name} (${user.empCode}) from the ${user.departments[0]} department.</p>
            <ul>
              <li><strong>Item:</strong> ${item}</li>
              <li><strong>Quantity:</strong> ${quantity} ${unit}</li>
              <li><strong>Urgency:</strong> ${urgency}</li>
              <li><strong>Reason:</strong> ${reason}</li>
            </ul>
            <p>Please log in to the system to review and approve it.</p>
          `
        });
      }
    }

    res.status(201).json({
      message: 'Request created',
      request: newRequest,
      ...(stockWarning ? { stockWarning } : {})
    });
  } catch (err) {
    console.error('❌ Error in createRequest:', err.stack);
    res.status(500).json({ error: 'Server error while creating request' });
  }
};

// =============================================
// 2. Department Head: Approve Request
// =============================================


exports.approveRequest = async (req, res) => {
  try {
    const request = await InventoryRequest.findById(req.params.id).populate('requestedBy');
    if (!request || request.status !== 'Pending Department Head Approval')
      return res.status(400).json({ message: 'Invalid request status' });

    const approver = await User.findById(req.user._id);
    const isSameDept = approver.departments.includes(request.department);
    const isHead = approver.role === 'Head';

    if (!isHead || !isSameDept) {
      return res.status(403).json({ message: 'Only same-department heads can approve this request' });
    }

    request.status = 'Pending Warehouse Issuance';
    request.approvedBy = approver._id;
    request.approvedAt = new Date();
    request.pendingApprovalFrom = null;
    await request.save();

    // ✅ Send email to Warehouse Head
    const warehouseHead = await User.findOne({
      role: 'Head',
      departments: { $in: ['Warehouse'] }
    });

    if (warehouseHead?.email) {
      await sendEmail({
        to: warehouseHead.email,
        subject: `✅ Inventory Request Ready for Issuance`,
        html: `
          <p>Dear ${warehouseHead.name},</p>
          <p>A request has been approved by ${approver.name} and is now ready for issuance:</p>
          <ul>
            <li><strong>Item:</strong> ${request.item}</li>
            <li><strong>Quantity:</strong> ${request.quantity} ${request.unit}</li>
            <li><strong>Requested By:</strong> ${request.requestedBy.name}</li>
            <li><strong>Department:</strong> ${request.department}</li>
          </ul>
          <p>Please log in to the inventory system to process this issuance.</p>
        `
      });
    }

    res.json({ message: 'Request approved', request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// 3. Warehouse/Production: Issue Item
// =============================================


exports.issueRequest = async (req, res) => {
  try {
    const { batchId, quantity } = req.body;

    const request = await InventoryRequest.findById(req.params.id);
    if (!request || request.status !== 'Pending Warehouse Issuance')
      return res.status(400).json({ message: 'Invalid request status' });

    const item = await InventoryItem.findOne({ itemName: request.item });
    if (!item) return res.status(404).json({ message: 'Item not found in inventory' });

    const batch = item.batches.find(b => b.batchId === batchId);
    const availableQty = batch ? batch.quantity - batch.issued : 0;

    if (!batch || availableQty < quantity) {
      return res.status(400).json({
        message: `Insufficient stock in batch ${batchId}. Requested: ${quantity}, Available: ${availableQty}`,
      });
    }

    // ✅ Subtract and record
    batch.issued += quantity;

    request.issuedBy = req.user._id;
    request.issuedAt = new Date();
    request.status = 'Issued';
    request.batchId = batchId;
    request.quantityIssued = quantity;

    await item.save();
    await request.save();

    // ✅ Send email to requesting staff
    const requester = await User.findById(request.requestedBy);
    if (requester?.email) {
      await sendEmail({
        to: requester.email,
        subject: `📦 Your Item is Ready for Collection – ${request.item}`,
        html: `
          <p>Dear ${requester.name},</p>
          <p>Your requested item has been issued and is now ready for collection.</p>
          <ul>
            <li><strong>Item:</strong> ${request.item}</li>
            <li><strong>Quantity:</strong> ${quantity} ${request.unit}</li>
            <li><strong>Batch ID:</strong> ${batchId}</li>
            <li><strong>Issued At:</strong> ${new Date(request.issuedAt).toLocaleString()}</li>
          </ul>
          <p>Please collect the item and mark it as claimed on the system.</p>
          <p>Regards,<br/>Inventory Team</p>
        `
      });
    }

    res.json({
      message: `✅ Issued ${quantity} from batch ${batchId}`,
      batchId,
      issuedQty: quantity,
      remaining: batch.quantity - batch.issued,
      request,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// =============================================
// 4. Staff: Claim Issued Item
// =============================================
exports.claimRequest = async (req, res) => {
  try {
    const request = await InventoryRequest.findById(req.params.id);
    if (!request || request.status !== 'Issued')
      return res.status(400).json({ message: 'Request not eligible for claim' });

    if (String(request.requestedBy) !== String(req.user._id))
      return res.status(403).json({ message: 'Only the requester can claim this item' });

    request.claimedAt = new Date();
    request.status = 'Claimed';
    await request.save();

    await ClaimAlert.deleteOne({ requestId: request._id });

    res.json({ message: 'Request successfully claimed', request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// 5. Cron Job: Auto-Alert for Unclaimed Items
// =============================================
exports.autoClaimAlertJob = async (req, res) => {
  try {
    const now = new Date();
    const alerts = await ClaimAlert.find().populate('requestId');
    let alertsSent = [];

    for (const alert of alerts) {
      const reqObj = alert.requestId;
      if (!reqObj || reqObj.status !== 'Issued') continue;

      const diffMins = (now - new Date(reqObj.issuedAt)) / (1000 * 60);
      if (diffMins > 30 && !alert.alertSent) {
        console.log(`⚠️ ALERT: Request ${reqObj._id} not claimed in 30 mins`);
        alert.alertSent = true;
        alert.alertTime = now;
        await alert.save();
        alertsSent.push(reqObj._id);
        // Send notification to dept head or log alert
      }
    }

    res.json({ message: 'Auto-alert check completed', alertsSent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// 6. Warehouse/Production: Add Inventory Batch
// =============================================


// =============================================
// 7. Get Inventory Status (All Items & Batches)
// =============================================

exports.getInventoryStatus = async (req, res) => {
  try {
    const items = await InventoryItem.find()
      .populate('batches.addedBy', 'name designation')
      .populate('batches.approvedBy', 'name designation')
      .populate('batches.poRef', 'vendorName')
      .populate('batches.invoiceRef', 'invoiceNumber')
      .populate('batches.grnRef', 'vehicleNumber')
      .populate('batches.qcRef', 'verifiedBy verifiedAt');

    const result = items.map(item => ({
      itemName: item.itemName,
      unit: item.unit,
      batches: item.batches.map(b => ({
        batchId: b.batchId,
        rate: b.rate,
        quantity: b.quantity,
        issued: b.issued,
        balance: b.quantity - b.issued,
        addedOn: b.addedOn,
        addedBy: b.addedBy?.name || 'N/A',
        approvedBy: b.approvedBy?.name || 'N/A',
        approvedAt: b.approvedAt,
        poRef: b.poRef?.vendorName || 'N/A',
        invoiceRef: b.invoiceRef?.invoiceNumber || 'N/A',
        grnRef: b.grnRef?.vehicleNumber || 'N/A',
        qcVerifiedBy: b.qcRef?.verifiedBy || 'N/A',
        qcVerifiedAt: b.qcRef?.verifiedAt || null
      }))
    }));

    res.json(result);
  } catch (err) {
    console.error('❌ Error in getInventoryStatus:', err);
    res.status(500).json({ error: err.message });
  }
};



exports.getAllItems = async (req, res) => {
  try {
    const items = await InventoryItem.find({}, 'itemName unit');
    res.json(items);
  } catch (err) {
    console.error('❌ Failed to fetch inventory items:', err.message);
    res.status(500).json({ message: 'Server error while fetching items' });
  }
};

// =============================================
// 8. Department Head: View Own Department Requests
// =============================================

exports.getRequestsForHead = async (req, res) => {
  try {
    const head = await User.findById(req.user._id);
    if (!head || head.role !== 'Head') {
      return res.status(403).json({ message: 'Access denied: not a department head' });
    }

    const query = { department: { $in: head.departments } };

    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }

    if (req.query.search) {
      query.$or = [
        { item: new RegExp(req.query.search, 'i') },
        { reason: new RegExp(req.query.search, 'i') },
      ];
    }

    const requests = await InventoryRequest.find(query)
      .populate('requestedBy approvedBy issuedBy');

    res.json({ department: head.departments[0], requests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyRequests = async (req, res) => {
  try {
    const requests = await InventoryRequest.find({ requestedBy: req.user._id });
    res.json({ requests }); // 👈 make sure this returns the array properly
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// 9. Warehouse Head: Get requests pending issuance
exports.getRequestsForIssuance = async (req, res) => {
  try {
    const requests = await InventoryRequest.find({ status: 'Pending Warehouse Issuance' })
      .populate('requestedBy approvedBy issuedBy');

    res.json({ requests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getPastUsage = async (req, res) => {
  try {
    const { userId, item } = req.query;
    const usage = await InventoryRequest.find({
      requestedBy: userId,
      item
    }).sort({ createdAt: -1 });

    res.json({ usage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getIssuedAndClaimedHistory = async (req, res) => {
  try {
    const issuedAndClaimed = await InventoryRequest.find({
      status: { $in: ['Issued', 'Claimed'] }
    })
      .populate('requestedBy', 'name department')
      .populate('approvedBy', 'name')
      .populate('issuedBy', 'name')
      .sort({ issuedAt: -1 });

    res.json({ issued: issuedAndClaimed });
  } catch (err) {
    console.error('🔥 Error in getIssuedAndClaimedHistory:', err.stack);
    res.status(500).json({ error: 'Server error while fetching issued/claimed history' });
  }
};

// controllers/inventoryController.js
exports.getStockAlerts = async (req, res) => {
  try {
    const requests = await InventoryRequest.find({
      status: { $in: ['Pending Department Head Approval', 'Pending Warehouse Issuance'] }
    })
    .populate('requestedBy', 'name empCode departments') 
    .sort({ createdAt: -1 });

    const alerts = requests.map(req => ({
      itemName: req.item,
      unit: req.unit || 'N/A',
      totalAvailable: 0,
      status: '🆕 Requested but Not in Inventory',
      requestedBy: {
        name: req.requestedBy?.name || '',
        empCode: req.requestedBy?.empCode || '',
        department: req.requestedBy?.departments?.[0] || '',
      }
    }));

    res.json({ alerts });
  } catch (err) {
    res.status(500).json({ message: 'Server error in getStockAlerts', error: err.message });
  }
};
