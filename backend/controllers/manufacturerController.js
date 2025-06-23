const Manufacturer = require('../models/Manufacturer');

// ➕ Add Manufacturer
exports.addManufacturer = async (req, res) => {
  try {
    const { name, email, address } = req.body;

    if (!name || !email || !address) {
      return res.status(400).json({ message: 'Name, email, and address are required.' });
    }

    const manufacturer = new Manufacturer({ name, email, address });
    await manufacturer.save();

    res.status(201).json({ success: true, manufacturer });
  } catch (err) {
    console.error('❌ Error adding manufacturer:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 📄 Get All Manufacturers
exports.getManufacturers = async (req, res) => {
  try {
    const manufacturers = await Manufacturer.find();
    res.status(200).json({ success: true, manufacturers });
  } catch (err) {
    console.error('❌ Error fetching manufacturers:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
