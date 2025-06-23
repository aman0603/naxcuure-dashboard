const mongoose = require('mongoose');

const manufacturerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  address: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Manufacturer', manufacturerSchema);
