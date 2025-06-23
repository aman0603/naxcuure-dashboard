const Holiday = require('../models/Holiday');
const User = require('../models/User');

const allowedRoles = ['President Operations', 'Director', 'HR Manager'];

// 🎯 Add a new holiday
exports.addHoliday = async (req, res) => {
  try {
    const { name, date } = req.body;
    if (!name || !date) {
      return res.status(400).json({ message: 'Holiday name and date are required.' });
    }

    const user = await User.findById(req.user._id);
    if (!allowedRoles.includes(user.designation)) {
      return res.status(403).json({ message: 'Only authorized HR or Directors can add holidays.' });
    }

    const dateOnly = new Date(new Date(date).toDateString());
    const existing = await Holiday.findOne({ date: dateOnly });
    if (existing) {
      return res.status(400).json({ message: 'Holiday already exists for this date.' });
    }

    const holiday = new Holiday({
      name,
      date: dateOnly,
      addedBy: user._id
    });

    await holiday.save();
    res.status(201).json({ message: 'Holiday added successfully', holiday });

  } catch (err) {
    console.error('❌ Error adding holiday:', err);
    res.status(500).json({ error: 'Failed to add holiday' });
  }
};

// 📅 Get all holidays (with addedBy details)
exports.getAllHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.find()
      .populate('addedBy', 'name designation')
      .sort({ date: 1 });
    res.json({ holidays });
  } catch (err) {
    console.error('❌ Holiday fetch error:', err);
    res.status(500).json({ error: 'Could not fetch holidays' });
  }
};

// ✏️ Update a holiday
exports.updateHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, date } = req.body;

    const user = await User.findById(req.user._id);
    if (!allowedRoles.includes(user.designation)) {
      return res.status(403).json({ message: 'Only authorized HR or Directors can update holidays.' });
    }

    const updated = await Holiday.findByIdAndUpdate(
      id,
      { name, date: new Date(new Date(date).toDateString()) },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Holiday not found' });
    }

    res.json({ message: 'Holiday updated successfully', holiday: updated });
  } catch (err) {
    console.error('❌ Holiday update error:', err);
    res.status(500).json({ error: 'Failed to update holiday' });
  }
};

// ❌ Delete a holiday
exports.deleteHoliday = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(req.user._id);
    if (!allowedRoles.includes(user.designation)) {
      return res.status(403).json({ message: 'Only authorized HR or Directors can delete holidays.' });
    }

    const deleted = await Holiday.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Holiday not found' });
    }

    res.json({ message: 'Holiday deleted successfully' });
  } catch (err) {
    console.error('❌ Holiday delete error:', err);
    res.status(500).json({ error: 'Failed to delete holiday' });
  }
};
