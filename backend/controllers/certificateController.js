const Certificate = require('../models/Certificate');
const cloudinary = require('../utils/cloudinary');
const fs = require('fs');
const { differenceInDays } = require('date-fns');
const streamifier = require('streamifier'); // ✅ npm install streamifier


// =====================================
// ➕ Add New Certificate
// =====================================

exports.addCertificate = async (req, res) => {
  try {
    console.log('🔍 Request body:', req.body);
    console.log('🔍 File received:', req.file?.originalname);

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const streamUpload = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'certificates',
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

    const certificate = new Certificate({
      certificateType: req.body.type,
      certificateName: req.body.name,
      certificateNumber: req.body.certificateNumber,
      issuingAuthority: req.body.issuedBy,
      issueDate: req.body.issueDate,
      expiryDate: req.body.expiryDate,
      reminderDays: req.body.reminderDays,
      department: req.body.department,
      notes: req.body.notes,
      plantName: req.body.plantName,
      certificateFile: uploadResult.secure_url,
      addedBy: {
        name: req.user.name,
        designation: req.user.designation,
      },
    });

    await certificate.save();
    res.status(201).json({ success: true, certificate });

  } catch (err) {
    console.error('❌ Error adding certificate:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// =====================================
// 📄 Get All Certificates
// =====================================
exports.getCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find().sort({ expiryDate: 1 });
    res.status(200).json({ success: true, certificates });
  } catch (err) {
    console.error('❌ Error fetching certificates:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// =====================================
// 👁️ Preview/Download Certificate File
// =====================================
exports.previewCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    res.redirect(certificate.certificateFile); // Opens the Cloudinary-hosted file
  } catch (err) {
    console.error('❌ Preview error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// =====================================
// 📥 Download Certificate File
// =====================================
exports.downloadCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    const fileName = `${certificate.certificateName || 'certificate'}.pdf`;
    
    // Trigger browser download
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.redirect(certificate.certificateFile); // Cloudinary serves the file
  } catch (err) {
    console.error('❌ Download error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// =====================================
// ✅ Check GMP Compliance Status
// =====================================
exports.checkGMPCompliance = async (req, res) => {
  try {
    const currentDate = new Date();

    const gmpCertificate = await Certificate.findOne({
      certificateType: 'WHO-GMP',
      expiryDate: { $gte: currentDate }
    });

    const isCompliant = !!gmpCertificate;
    res.status(200).json({ success: true, isCompliant });

  } catch (err) {
    console.error('❌ Error checking GMP compliance:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getRenewalAlerts = async (req, res) => {
  try {
    const currentDate = new Date();

    const certificates = await Certificate.find();

    const renewalAlerts = certificates.filter(cert => {
      const expiry = new Date(cert.expiryDate);
      const daysLeft = differenceInDays(expiry, currentDate);
      return daysLeft <= cert.reminderDays;
    }).map(cert => ({
      _id: cert._id,
      title: cert.certificateName,
      certificateType: cert.certificateType,
      daysLeft: differenceInDays(new Date(cert.expiryDate), currentDate),
      expiryDate: cert.expiryDate,
      reminderDays: cert.reminderDays,
    }));

    res.status(200).json({ success: true, renewalAlerts });
  } catch (err) {
    console.error('❌ Error fetching renewal alerts:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// =====================================
// 📌 Get All Current (Valid) Certificates
// =====================================
exports.getCurrentCertificates = async (req, res) => {
  try {
    const today = new Date();
    const certificates = await Certificate.find({ expiryDate: { $gte: today } }).sort({ expiryDate: 1 });

    res.status(200).json({
      success: true,
      count: certificates.length,
      certificates
    });
  } catch (err) {
    console.error('❌ Error fetching current certificates:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// =====================================
// ❌ Get All Expired Certificates
// =====================================
exports.getExpiredCertificates = async (req, res) => {
  try {
    const today = new Date();
    const certificates = await Certificate.find({ expiryDate: { $lt: today } }).sort({ expiryDate: -1 });

    res.status(200).json({
      success: true,
      count: certificates.length,
      certificates
    });
  } catch (err) {
    console.error('❌ Error fetching expired certificates:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
