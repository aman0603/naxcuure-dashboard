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
const sopsRoutes = require('./routes/sopRoutes'); // 📚 SOPs

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5001;

// 🔐 Middleware
app.use(cors({
  origin: ['https://naxcuure-dashboard.vercel.app', 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
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
app.use('/api/sops', sopsRoutes); // HR Holiday calendar

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
