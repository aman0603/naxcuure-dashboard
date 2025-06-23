const mongoose = require('mongoose');

const ClaimAlertSchema = new mongoose.Schema({
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryRequest', required: true },
  alertSent: { type: Boolean, default: false },
  alertTime: { type: Date }
});

module.exports = mongoose.model('ClaimAlert', ClaimAlertSchema);
