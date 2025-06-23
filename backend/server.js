const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const certificateRoutes = require('./routes/certificateRoutes'); // 📜 Certificate Vault
const productRoutes = require('./routes/productRoutes');
const manufacturerRoutes = require('./routes/manufacturerRoutes');
const userRoutes = require('./routes/userRoutes');       // 👥 Users & Leaves
const holidayRoutes = require('./routes/holidayRoutes'); // 📅 Holidays


dotenv.config();
const app = express();
const PORT = process.env.PORT || 5001;

// 🔐 Middleware
app.use(cors());
app.use(express.json());

// ✅ Health Check Route
app.get("/", (req, res) => {
  res.send("🛡️ Compliance System API is running.");
});

// 📦 API Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/products', productRoutes);
app.use('/api/manufacturers', manufacturerRoutes);
app.use('/api/users', userRoutes);       // User + Leave logic
app.use('/api/holidays', holidayRoutes); // HR Holiday calendar

// 🌐 Database Connection & Server Start
mongoose.connect(process.env.MONGODB_URI, {
  dbName: 'compliance_system',
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
