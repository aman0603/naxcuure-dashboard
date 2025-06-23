const MismatchLog = require('../models/MismatchLog');

/**
 * Logs a mismatch issue in the MismatchLog collection.
 * Can be reused across GRN, QC, Invoice, PO stages.
 */
const logMismatchAutomatically = async ({
  itemName,
  poRef = null,
  invoiceRef = null,
  grnRef = null,
  qcRef = null,
  expectedQty = null,
  invoicedQty = null,
  deliveredQty = null,
  approvedQty = null,
  expectedRate = null,
  invoicedRate = null,
  issueType,
  remarks = '',
  detectedBy
}) => {
  try {
    const log = new MismatchLog({
      itemName,
      poRef,
      invoiceRef,
      grnRef,
      qcRef,
      expectedQty,
      invoicedQty,
      deliveredQty,
      approvedQty,
      expectedRate,
      invoicedRate,
      issueType,
      remarks,
      detectedBy
    });

    await log.save();
    console.log(`📌 Mismatch logged: [${issueType}] for item: ${itemName}`);
  } catch (error) {
    console.error('❌ Mismatch log error:', error.message);
  }
};

module.exports = { logMismatchAutomatically };
