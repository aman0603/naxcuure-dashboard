const Product = require('../models/Product');
const Manufacturer = require('../models/Manufacturer');
const { differenceInDays } = require('date-fns');

// ➕ Add Product Only
exports.addProduct = async (req, res) => {
  try {
    const { name, type, composition, strength, shelfLife, countries } = req.body;

    const product = new Product({
      name,
      type,
      composition,
      strength,
      shelfLife,
      countries,
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    await product.save();
    res.status(201).json({ message: 'Product added', product });
  } catch (err) {
    res.status(500).json({ message: 'Error creating product', error: err.message });
  }
};

// ➕ Add Manufacturer + Registration to a Product
exports.addManufacturerAndRegistration = async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      manufacturerName,
      manufacturerEmail,
      manufacturerAddress,
      registration
    } = req.body;

    const manufacturer = new Manufacturer({
      name: manufacturerName,
      email: manufacturerEmail,
      address: manufacturerAddress
    });

    await manufacturer.save();

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.manufacturers.push(manufacturer._id);
    product.registrations.push(registration);
    product.updatedBy = req.user._id;

    await product.save();

    res.status(200).json({ message: 'Manufacturer and registration added', product });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add data', error: err.message });
  }
};

// 📋 View All Products with Manufacturer and Registration (Paginated)
exports.getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const total = await Product.countDocuments();

    const products = await Product.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate('manufacturers')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');

    res.status(200).json({
      products,
      page,
      totalPages: Math.ceil(total / limit),
      totalProducts: total
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching products', error: err.message });
  }
};

// 🚨 Get Products with Expired or Expiring Registrations
exports.getExpiringRegistrations = async (req, res) => {
  try {
    const products = await Product.find();
    const currentDate = new Date();
    const expiringSoon = [];

    products.forEach((product) => {
      product.registrations.forEach((reg) => {
        const expiry = new Date(reg.expiryDate);
        const daysLeft = differenceInDays(expiry, currentDate);
        if (daysLeft <= reg.reminderDays) {
          expiringSoon.push({
            productId: product._id,
            productName: product.name,
            country: reg.country,
            expiryDate: reg.expiryDate,
            daysLeft,
            registrationId: reg._id,
            department: reg.department
          });
        }
      });
    });

    res.status(200).json({ expiringSoon });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch alerts', error: err.message });
  }
};

// 🔁 Update Specific Registration by ID
exports.updateRegistration = async (req, res) => {
  const { productId, registrationId } = req.params;
  const updates = req.body;

  try {
    const product = await Product.findOneAndUpdate(
      { _id: productId, "registrations._id": registrationId },
      {
        $set: {
          "registrations.$.country": updates.country,
          "registrations.$.registrationNumber": updates.registrationNumber,
          "registrations.$.issueDate": updates.issueDate,
          "registrations.$.expiryDate": updates.expiryDate,
          "registrations.$.documentUrl": updates.documentUrl,
          "registrations.$.reminderDays": updates.reminderDays,
          "registrations.$.department": updates.department
        },
        updatedBy: req.user._id
      },
      { new: true }
    );

    if (!product) return res.status(404).json({ message: 'Product or Registration not found' });

    res.status(200).json({ message: 'Registration updated', product });
  } catch (err) {
    res.status(500).json({ message: 'Update failed', error: err.message });
  }
};


exports.getFilteredProducts = async (req, res) => {
  try {
    const { manufacturer, country, expiry } = req.query;
    const filter = {};

    if (country) {
      filter.countries = country;
    }

    const products = await Product.find(filter)
      .populate('manufacturers')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');

    let filtered = products;

    // Filter by manufacturer name
    if (manufacturer) {
      filtered = filtered.filter(p =>
        p.manufacturers.some(m =>
          m.name.toLowerCase().includes(manufacturer.toLowerCase())
        )
      );
    }

    // Filter by expiry
    if (expiry === 'soon' || expiry === 'far') {
      const now = new Date();
      filtered = filtered.filter(p =>
        p.registrations.some(r => {
          const daysLeft = differenceInDays(new Date(r.expiryDate), now);
          return expiry === 'soon' ? daysLeft <= r.reminderDays : daysLeft > r.reminderDays;
        })
      );
    }

    res.status(200).json({ products: filtered });
  } catch (err) {
    res.status(500).json({ message: 'Error filtering products', error: err.message });
  }
};