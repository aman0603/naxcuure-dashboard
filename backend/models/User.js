const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  empCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },

  // ✅ Multiple departments support
  departments: {
    type: [String],
    enum: [
     
  'Quality Assurance',
  'Quality Control',
  'Microbiology',
  'Engineering',
  'Production',
  'Warehouse',
  'Packing',
  'Information Technology',
  'Human Resource and Administration',
  'Formulation and Development',
  'Regulatory Affairs',
  'Housekeeping',
  'Environment Health and Safety',
  'General Management',
  'Security',
  
  // ✅ Additional Recommendations
  'Purchase and Procurement',
  'Finance and Accounts',
  'Research and Development',
  'Sales and Marketing',
  'Business Development',
  'Training and Development',
  'Maintenance',
  'Legal and Compliance',
  'Logistics and Dispatch',
  'Sterility Assurance',
  'Calibration and Validation',
  'Labelling and Artwork',
  'Vendor Development',
  'Customer Support',
  'Audit and Inspection',
  'IT Infrastructure',
  'Admin and Facilities',
  'CSR and Public Affairs'
    ],
    required: true
  },

  // ✅ Official designation (visible title)
  designation: {
    type: String,
    required: true,
    enum: [
       'Director',
  'President Operations',
  'Quality Head',
  'Plant Head',
  'QA Head',
  'QC Head',
  'Microbiology Head',
  'Engineering Head',
  'Production Head',
  'Warehouse Head',
  'Packing Head',
  'IT Head',
  'HR Head',
  'F&D Head',
  'RA Head',
  'Housekeeping Head',
  'EHS Head',
  
  // 🔽 Newly added department head designations
  'Purchase Head',
  'Finance Head',
  'R&D Head',
  'Sales Head',
  'Business Development Head',
  'Training Head',
  'Maintenance Head',
  'Compliance Head',
  'Logistics Head',
  'Sterility Head',
  'Calibration Head',
  'Labelling Head',
  'Vendor Head',
  'Customer Support Head',
  'Audit Head',
  'IT Infra Head',
  'Admin Head',
  'CSR Head',
  'HR Manager',

  // General roles
  'Manager',
  'Assistant Manager',
  'Executive',
  'Officer',
  'Trainee Officer',
  'Technician'
    ]
  }
,  

  // ✅ Role (for access control)
  role: {
    type: String,
    required: true,
    enum: [
      'Director',
      'President Operations',
      'Quality Head',
      'Plant Head',
      'Head',
      'Staff'
    ]
  },

  // ✅ Reference to direct superior
  superior: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // ✅ Account status
  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });


UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
