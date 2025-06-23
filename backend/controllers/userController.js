const User = require('../models/User');
const Leave = require('../models/Leave');
const { sendEmail } = require('../utils/mail');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Configurable role rules
const directorOnlyDesignations = ['Director', 'President Operations'];
const hrAllowedDesignations = ['Quality Head', 'Plant Head'];
const departmentHeads = [
  'Quality Assurance', 'Quality Control', 'Microbiology', 'Engineering', 'Production',
  'Warehouse', 'Packing', 'Information Technology', 'Human Resource and Administration',
  'Formulation and Development', 'Regulatory Affairs', 'Housekeeping',
  'Environment Health and Safety', 'General Management', 'Security',
  'Purchase and Procurement', 'Finance and Accounts', 'Research and Development',
  'Sales and Marketing', 'Business Development', 'Training and Development',
  'Maintenance', 'Legal and Compliance', 'Logistics and Dispatch', 'Sterility Assurance',
  'Calibration and Validation', 'Labelling and Artwork', 'Vendor Development',
  'Customer Support', 'Audit and Inspection', 'IT Infrastructure', 'Admin and Facilities',
  'CSR and Public Affairs'
];

// ✅ Generate Employee Code
const generateEmpCode = async () => {
  const lastUser = await User.findOne({ empCode: /^EMP\d+$/ })
    .sort({ empCode: -1 })
    .select('empCode');

  let lastNumber = 0;

  if (lastUser?.empCode) {
    const match = lastUser.empCode.match(/^EMP(\d+)$/);
    if (match) {
      lastNumber = parseInt(match[1], 10);
    }
  }

  const nextNumber = lastNumber + 1;
  const padded = String(nextNumber).padStart(4, '0');
  return `EMP${padded}`;
};

// ✅ Add User Controller
exports.addUser = async (req, res) => {
  try {
    const { name, email, departments = [], designation } = req.body;

    if (!req.user?._id) {
      return res.status(401).json({ message: 'Unauthorized request' });
    }

    const addedBy = await User.findById(req.user._id);
    if (!addedBy) return res.status(404).json({ message: 'Adding user not found' });

    // ✅ Permission checks
    if (directorOnlyDesignations.includes(designation) && addedBy.role !== 'Director') {
      return res.status(403).json({ message: 'Only a Director can add this designation.' });
    }

    if (hrAllowedDesignations.includes(designation) &&
      !['Director', 'President Operations'].includes(addedBy.role)) {
      return res.status(403).json({ message: 'Only Director or President can add this designation.' });
    }

    // ✅ Force department for top-level roles
    let finalDepartments = departments;
    if (directorOnlyDesignations.includes(designation)) {
      finalDepartments = ['General Management'];
    }

    // ✅ Assign role
    let role = 'Staff';
    if (directorOnlyDesignations.includes(designation)) {
      role = designation;
    } else if (hrAllowedDesignations.includes(designation)) {
      role = designation;
    } else if (departmentHeads.includes(designation) || designation === 'HR Manager') {
      role = 'Head';
    }

    // ✅ Check for duplicate email
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User with this email already exists' });

    // ✅ Generate empCode and password
    const empCode = await generateEmpCode();
    const password = crypto.randomBytes(6).toString('hex');
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create user
    const newUser = new User({
      empCode,
      name,
      email,
      password: hashedPassword,
      departments: finalDepartments,
      designation,
      role
    });

    await newUser.save();

    // ✅ Send email
    try {
      await sendEmail({
        to: email,
        subject: `👋 Welcome to the Inventory System`,
        html: `
          <p>Dear ${name},</p>
          <p>Your account has been created with the following credentials:</p>
          <ul>
            <li><strong>Employee Code:</strong> ${empCode}</li>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Password:</strong> ${password}</li>
            <li><strong>Designation:</strong> ${designation}</li>
          </ul>
          <p>Please log in and change your password immediately.</p>
          <p>Regards,<br/>Inventory Management Team</p>
        `
      });
    } catch (emailErr) {
      console.warn('📭 Email sending failed:', emailErr.message);
    }

    res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (err) {
    console.error('❌ Error in addUser:', err);
    res.status(500).json({ message: err.message || 'Failed to create user' });
  }
};



exports.applyForLeave = async (req, res) => {
  try {
    const { from, to, reason, isHalfDay = false, leaveType = 'Full Day' } = req.body;
    if (!from || !to || !reason) {
      return res.status(400).json({ message: 'Missing leave details' });
    }

    const applicant = await User.findById(req.user._id);

    // ✅ Leave quota enforcement
    const currentYear = new Date(from).getFullYear();
    const startOfYear = new Date(`${currentYear}-01-01`);
    const endOfYear = new Date(`${currentYear + 1}-01-01`);

    const approvedLeaves = await Leave.find({
      user: applicant._id,
      status: 'Approved',
      from: { $gte: startOfYear, $lt: endOfYear }
    });

    let usedDays = 0;
    for (const l of approvedLeaves) {
      const days = Math.ceil((new Date(l.to) - new Date(l.from)) / (1000 * 60 * 60 * 24)) + 1;
      usedDays += l.leaveType === 'Half Day' ? 0.5 : days;
    }

    const requestedDays = Math.ceil((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24)) + 1;
    const effectiveDays = leaveType === 'Half Day' ? 0.5 : requestedDays;

    if (usedDays + effectiveDays > 24) {
      return res.status(400).json({ message: `Leave quota exceeded. Used ${usedDays} of 24 days.` });
    }

    const leave = new Leave({
      user: applicant._id,
      from,
      to,
      reason,
      isHalfDay,
      leaveType
    });

    await leave.save();

    // ✅ Notify approvers
    const emailRecipients = new Set();
    const departmentHeadMap = {
      'Quality Assurance': 'QA Head',
      'Quality Control': 'QC Head',
      'Microbiology': 'Microbiology Head',
      'Engineering': 'Engineering Head',
      'Production': 'Production Head',
      'Warehouse': 'Warehouse Head',
      'Packing': 'Packing Head',
      'Information Technology': 'IT Head',
      'Human Resource and Administration': 'HR Head',
      'Formulation and Development': 'F&D Head',
      'Regulatory Affairs': 'RA Head',
      'Housekeeping': 'Housekeeping Head',
      'Environment Health and Safety': 'EHS Head',
      'Purchase and Procurement': 'Purchase Head',
      'Finance and Accounts': 'Finance Head',
      'Research and Development': 'R&D Head',
      'Sales and Marketing': 'Sales Head',
      'Business Development': 'Business Development Head',
      'Training and Development': 'Training Head',
      'Maintenance': 'Maintenance Head',
      'Legal and Compliance': 'Compliance Head',
      'Logistics and Dispatch': 'Logistics Head',
      'Sterility Assurance': 'Sterility Head',
      'Calibration and Validation': 'Calibration Head',
      'Labelling and Artwork': 'Labelling Head',
      'Vendor Development': 'Vendor Head',
      'Customer Support': 'Customer Support Head',
      'Audit and Inspection': 'Audit Head',
      'IT Infrastructure': 'IT Infra Head',
      'Admin and Facilities': 'Admin Head',
      'CSR and Public Affairs': 'CSR Head',
      'Security': 'Plant Head'
    };

    const addRecipient = async (designation) => {
      const person = await User.findOne({ designation });
      if (person) emailRecipients.add(person.email);
    };

    let addedHead = false;
    for (const dept of applicant.departments) {
      const head = departmentHeadMap[dept];
      if (head) {
        await addRecipient(head);
        addedHead = true;
      }
    }

    // ✅ Always notify HR Manager
    await addRecipient('HR Manager');

    if (applicant.designation === 'Plant Head') {
      await addRecipient('President Operations');
    } else if (applicant.designation.endsWith('Head')) {
      await addRecipient('Plant Head');
      await addRecipient('President Operations');
    } else {
      if (addedHead) await addRecipient('Plant Head');
      await addRecipient('President Operations');
    }

    await sendEmail({
      to: Array.from(emailRecipients),
      subject: `📝 Leave Request from ${applicant.name}`,
      html: `
        <p><strong>${applicant.name}</strong> (${applicant.designation}) has applied for leave:</p>
        <ul>
          <li><strong>From:</strong> ${new Date(from).toDateString()}</li>
          <li><strong>To:</strong> ${new Date(to).toDateString()}</li>
          <li><strong>Type:</strong> ${leaveType}</li>
          <li><strong>Reason:</strong> ${reason}</li>
        </ul>
        <p>Please review and take action in the system.</p>
      `
    });

    res.status(201).json({ message: 'Leave request submitted successfully', leave });
  } catch (err) {
    console.error('❌ Leave apply error:', err);
    res.status(500).json({ error: 'Failed to apply for leave' });
  }
};


exports.approveOrRejectLeave = async (req, res) => {
  try {
    const { decision, remarks } = req.body;
    const leave = await Leave.findById(req.params.id).populate('user');
    if (!leave) return res.status(404).json({ message: 'Leave not found' });
    if (leave.status !== 'Pending') return res.status(400).json({ message: 'Already processed' });

    if (decision === 'rejected' && (!remarks || remarks.trim() === '')) {
      return res.status(400).json({ message: 'Remarks are mandatory when rejecting a leave.' });
    }

    const approver = await User.findById(req.user._id);
    const applicant = leave.user;

    const isQA = applicant.departments.includes('Quality Assurance');
    const isQC = applicant.departments.includes('Quality Control');

    let allowed = false;

    // ✅ Approval hierarchy
    switch (applicant.designation) {
      case 'President Operations':
        allowed = approver.designation === 'Director';
        break;

      case 'Plant Head':
      case 'Quality Head':
        allowed = approver.designation === 'President Operations';
        break;

      case 'QA Head':
      case 'QC Head':
        allowed = ['Quality Head', 'President Operations'].includes(approver.designation);
        break;

      default:
        if (applicant.designation.endsWith('Head')) {
          allowed = ['Plant Head', 'President Operations'].includes(approver.designation);
        } else {
          const headDesignations = [];

          if (isQA) headDesignations.push('QA Head');
          if (isQC) headDesignations.push('QC Head');

          for (const dept of applicant.departments) {
            const main = dept.split(' ')[0];
            headDesignations.push(`${main} Head`);
          }

          headDesignations.push('Plant Head', 'President Operations');
          allowed = headDesignations.includes(approver.designation);
        }
        break;
    }

    if (!allowed) {
      return res.status(403).json({ message: 'You are not authorized to approve/reject this leave.' });
    }

    leave.status = decision === 'approved' ? 'Approved' : 'Rejected';
    leave.reviewedBy = approver._id;
    leave.reviewedAt = new Date();
    leave.remarks = remarks || '';
    await leave.save();

    await sendEmail({
      to: applicant.email,
      subject: `⛳ Leave ${leave.status}`,
      html: `
        <p>Hello ${applicant.name},</p>
        <p>Your leave request from <strong>${new Date(leave.from).toDateString()}</strong> to 
        <strong>${new Date(leave.to).toDateString()}</strong> has been 
        <strong>${leave.status}</strong> by ${approver.name} (${approver.designation}).</p>
        ${remarks ? `<p><strong>Remarks:</strong> ${remarks}</p>` : ''}
        <p>Regards,<br/>Leave Management System</p>
      `
    });

    res.json({ message: `Leave ${leave.status.toLowerCase()} successfully`, leave });
  } catch (err) {
    console.error('❌ Approve/Reject error:', err);
    res.status(500).json({ error: 'Leave decision failed' });
  }
};



exports.getAllUsers = async (req, res) => {
  try {
    const { department, designation, role, isActive, page = 1, limit = 10 } = req.query;

    const requester = await User.findById(req.user._id);
    const query = {};

    // ✅ Role-based department filtering
    if (requester.role === 'Director' || requester.designation === 'President Operations') {
      // Can access all users
    } else if (requester.designation === 'Plant Head') {
      query.departments = { $nin: ['Quality Assurance', 'Quality Control'] };
    } else if (['Quality Head', 'QA Head', 'QC Head'].includes(requester.designation)) {
      query.departments = { $in: ['Quality Assurance', 'Quality Control'] };
    } else if (requester.role === 'Head') {
      query.departments = { $in: requester.departments };
    } else if (requester.designation === 'HR Manager') {
      // Can access all users
    } else {
      // General staff: can only view themselves (not part of this route)
      return res.status(403).json({ message: 'Unauthorized to view users' });
    }

    if (department) query.departments = department;
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (designation) query.designation = designation;


    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
      User.countDocuments(query)
    ]);

    res.json({
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      users
    });
  } catch (err) {
    console.error('❌ Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};
exports.getAllUsersRaw = async (req, res) => {
  try {
    const { department, designation, sortBy = 'name', sortOrder = 'asc' } = req.query;
    const query = {};
    if (department) query.departments = department;
    if (designation) query.designation = designation;

    const users = await User.find(query).sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 });
    res.json({ users });
  } catch (err) {
    console.error('❌ Error fetching all users:', err);
    res.status(500).json({ error: 'Failed to fetch all users' });
  }
};


exports.getUserLeaveSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const { year } = req.query;

    const requester = await User.findById(req.user._id);
    const targetUser = await User.findById(id);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    // ✅ Role-based access check
    const isSelf = requester._id.toString() === targetUser._id.toString();
    const isDirector = requester.designation === 'Director';
    const isPresident = requester.designation === 'President Operations';
    const isPlantHead = requester.designation === 'Plant Head';
    const isHR = requester.designation === 'HR Manager';
    const isQualityHead = requester.designation === 'Quality Head';

    const isHeadOfSameDept =
      requester.role === 'Head' &&
      requester.departments.some(dept => targetUser.departments.includes(dept));

    const isQAQC =
      isQualityHead &&
      ['Quality Assurance', 'Quality Control'].some(dept =>
        targetUser.departments.includes(dept)
      );

    const isPlantHeadOverOtherDepts =
      isPlantHead &&
      !['Quality Assurance', 'Quality Control'].some(dept =>
        targetUser.departments.includes(dept)
      );

    if (
      !isSelf &&
      !isDirector &&
      !isPresident &&
      !isHR &&
      !isHeadOfSameDept &&
      !isQAQC &&
      !isPlantHeadOverOtherDepts
    ) {
      return res.status(403).json({ message: 'You are not authorized to view this leave summary' });
    }

    // ✅ Date filter logic
    const dateFilter = {};
    if (year) {
      const start = new Date(`${year}-01-01`);
      const end = new Date(`${parseInt(year) + 1}-01-01`);
      dateFilter.from = { $gte: start, $lt: end };
    }

    const leaves = await Leave.find({
      user: id,
      status: 'Approved',
      ...dateFilter
    }).sort({ from: -1 });

    let totalDays = 0;
    const leaveDetails = leaves.map(leave => {
      const from = new Date(leave.from);
      const to = new Date(leave.to);
      const days = leave.leaveType === 'Half Day'
        ? 0.5
        : Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;

      totalDays += days;

      return {
        from: from.toDateString(),
        to: to.toDateString(),
        days,
        reason: leave.reason,
        reviewedBy: leave.reviewedBy,
        remarks: leave.remarks || '',
        reviewedAt: leave.reviewedAt ? new Date(leave.reviewedAt).toDateString() : null
      };
    });

    res.json({
      user: {
        name: targetUser.name,
        empCode: targetUser.empCode,
        designation: targetUser.designation,
        departments: targetUser.departments
      },
      totalLeaves: leaveDetails.length,
      totalDays,
      leaves: leaveDetails
    });
  } catch (err) {
    console.error('❌ Error in getUserLeaveSummary:', err);
    res.status(500).json({ error: 'Failed to fetch leave summary' });
  }
};
