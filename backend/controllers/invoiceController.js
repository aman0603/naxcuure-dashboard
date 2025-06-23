const InvoiceEntry = require('../models/InvoiceEntry');
const cloudinary = require('../utils/cloudinary');
const streamifier = require('streamifier');

// =====================================
// ➕ Add Invoice (with PDF upload)
// =====================================

exports.addInvoiceEntry = async (req, res) => {
  try {
    console.log('📥 Invoice Data:', req.body);
    console.log('📎 File received:', req.file?.originalname);

    if (!req.file) {
      return res.status(400).json({ message: 'No invoice file uploaded' });
    }

    // 🔄 Upload PDF to Cloudinary
    const streamUpload = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'invoices',
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

    // 🧾 Create invoice entry
    const invoice = new InvoiceEntry({
      poRef: req.body.poRef,
      invoiceNumber: req.body.invoiceNumber,
      invoiceDate: req.body.invoiceDate,
      items: JSON.parse(req.body.items), // array of { itemName, quantity, rate, taxPercent }
      documentUrl: uploadResult.secure_url,
      uploadedBy: req.user._id
    });

    await invoice.save();

    res.status(201).json({ success: true, message: 'Invoice added', invoice });
  } catch (err) {
    console.error('❌ Error adding invoice:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};



exports.getAllInvoices = async (req, res) => {
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
      query.$or = [
        { vendorName: { $regex: search, $options: 'i' } },
        { invoiceNumber: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.status = status;
    }

    if (department) {
      query.department = department;
    }

    const total = await InvoiceEntry.countDocuments(query);

    const invoices = await InvoiceEntry.find(query)
      .sort({ createdAt: sort === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'name designation email');

    const response = invoices.map(inv => ({
      _id: inv._id,
      vendorName: inv.vendorName,
      vendorGST: inv.vendorGST,
      department: inv.department,
      status: inv.status,
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.invoiceDate,
      documentUrl: inv.documentUrl,
      createdBy: inv.createdBy,
      createdAt: inv.createdAt,
      items: inv.items
    }));

    res.json({
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: response
    });
  } catch (err) {
    console.error('❌ Error fetching invoices:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};