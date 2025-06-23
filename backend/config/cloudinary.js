require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'compliance_docs',
    resource_type: 'raw',
    type: 'upload', // <- THIS makes it public
    format: async (req, file) => file.originalname.split('.').pop(),
    public_id: (req, file) => `${Date.now()}-${file.originalname}`
  }
});

module.exports = {
  cloudinary,
  storage
};
