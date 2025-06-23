require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User'); // Adjust path if needed

const changePassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'compliance_system'
    });

    const empCode = 'D0001';
    const newPassword = '1234'; // 👈 Set your desired new password here

    const user = await User.findOne({ empCode });

    if (!user) {
      console.log(`❌ No user found with empCode: ${empCode}`);
      process.exit(0);
    }

    user.password = newPassword; // 👈 This will trigger pre('save') to hash it
    await user.save();

    console.log(`✅ Password for ${empCode} has been updated to '${newPassword}'.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

changePassword();
