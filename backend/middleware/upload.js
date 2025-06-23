// middleware/upload.js
const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage(); // ✅ Store file in memory buffer

const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, JPG, PNG files are allowed'), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
