const PurchaseOrder = require('../models/PurchaseOrder');
const cloudinary = require('../utils/cloudinary');
const streamifier = require('streamifier');

// =====================================
// ➕ Add New Purchase Order (with file)
// =====================================

exports.addPurchaseOrder = async (req, res) => {
  try {
    console.log('📝 PO Body:', req.body);
    console.log('📎 File received:', req.file?.originalname);

    if (!req.file) {
      return res.status(400).json({ message: 'No PO file uploaded' });
    }

    // 📤 Upload to Cloudinary using streamifier
    const streamUpload = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'purchase-orders',
            resource_type: 'auto',
          },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(buffer).pipe(stream);
      });
    };

    const uploadResult = await streamUpload(req.file.buffer);

    // 🗂 Create PO
    const po = new PurchaseOrder({
      vendorName: req.body.vendorName,
      vendorGST: req.body.vendorGST,
      department: req.body.department,
      items: JSON.parse(req.body.items), // array stringified in frontend form
      createdBy: req.user._id,
      documentUrl: uploadResult.secure_url
    });

    await po.save();

    res.status(201).json({ success: true, message: 'Purchase Order created', po });
  } catch (err) {
    console.error('❌ Error adding Purchase Order:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getAllPurchaseOrders = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      department = '',
      sort = 'desc'
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const query = {};

    if (search) {
      query.vendorName = { $regex: search, $options: 'i' };
    }

    if (status) {
      query.status = status;
    }

    if (department) {
      query.department = department;
    }

    const total = await PurchaseOrder.countDocuments(query);

    const orders = await PurchaseOrder.find(query)
      .sort({ createdAt: sort === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'name designation email');

    const response = orders.map(order => ({
      _id: order._id,
      vendorName: order.vendorName,
      vendorGST: order.vendorGST,
      department: order.department,
      status: order.status,
      createdAt: order.createdAt,
      createdBy: order.createdBy,
      documentUrl: order.documentUrl,
      items: order.items
    }));

    res.json({
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: response
    });
  } catch (err) {
    console.error('❌ Error fetching Purchase Orders:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

