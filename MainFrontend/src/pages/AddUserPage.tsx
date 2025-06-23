import React, { useState, useEffect } from 'react';
import { Save, UserPlus } from 'lucide-react';
import { userAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
const DESIGNATION_MAP: Record<string, string[]> = {
  // ❌ Leadership only
  'General Management': ['Director', 'President Operations'],

  // ✅ Quality
  'Quality Assurance': ['Quality Head', 'QA Head', 'Manager', 'Assistant Manager', 'Executive', 'Officer', 'Trainee Officer', 'Technician'],
  'Quality Control': ['QC Head', 'Manager', 'Assistant Manager', 'Executive', 'Officer', 'Trainee Officer', 'Technician'],
  'Microbiology': ['Microbiology Head', 'Manager', 'Executive', 'Officer', 'Technician'],

  // ✅ Production & Engineering
  'Production': ['Production Head', 'Manager', 'Executive', 'Officer', 'Technician'],
  'Engineering': ['Engineering Head', 'Maintenance Head', 'Manager', 'Executive', 'Technician'],
  'Maintenance': ['Maintenance Head', 'Manager', 'Executive', 'Technician'],

  // ✅ Warehouse & Packing
  'Warehouse': ['Warehouse Head', 'Logistics Head', 'Manager', 'Executive', 'Officer', 'Technician'],
  'Packing': ['Packing Head', 'Manager', 'Executive', 'Technician'],

  // ✅ IT & Admin
  'Information Technology': ['IT Head', 'Manager', 'Executive', 'Technician'],
  'IT Infrastructure': ['IT Infra Head', 'Manager', 'Executive', 'Technician'],
  'Admin and Facilities': ['Admin Head', 'Manager', 'Executive'],

  // ✅ HR & Training
  'Human Resource and Administration': ['HR Head', 'HR Manager', 'Manager', 'Executive', 'Officer'],
  'Training and Development': ['Training Head', 'Manager', 'Executive', 'Officer'],

  // ✅ Formulation, R&D
  'Formulation and Development': ['F&D Head', 'Manager', 'Executive', 'Officer', 'Technician'],
  'Research and Development': ['R&D Head', 'Manager', 'Executive', 'Officer', 'Technician'],

  // ✅ RA & Compliance
  'Regulatory Affairs': ['RA Head', 'Compliance Head', 'Manager', 'Executive', 'Officer'],
  'Legal and Compliance': ['Compliance Head', 'Manager', 'Executive', 'Officer'],

  // ✅ Housekeeping, EHS, Security
  'Housekeeping': ['Housekeeping Head', 'Manager', 'Executive'],
  'Environment Health and Safety': ['EHS Head', 'Manager', 'Officer', 'Technician'],
  'Security': ['Manager', 'Officer'],

  // ✅ Purchase & Finance
  'Purchase and Procurement': ['Purchase Head', 'Manager', 'Executive', 'Officer'],
  'Finance and Accounts': ['Finance Head', 'Manager', 'Executive', 'Officer'],

  // ✅ Sales & Biz Dev
  'Sales and Marketing': ['Sales Head', 'Manager', 'Executive', 'Officer'],
  'Business Development': ['Business Development Head', 'Manager', 'Executive'],

  // ✅ Logistics & Operational Support
  'Logistics and Dispatch': ['Logistics Head', 'Manager', 'Executive', 'Officer'],
  'Sterility Assurance': ['Sterility Head', 'Manager', 'Executive', 'Technician'],
  'Calibration and Validation': ['Calibration Head', 'Manager', 'Executive', 'Technician'],
  'Labelling and Artwork': ['Labelling Head', 'Manager', 'Executive'],
  'Vendor Development': ['Vendor Head', 'Manager', 'Executive'],
  'Customer Support': ['Customer Support Head', 'Manager', 'Executive', 'Officer'],
  'Audit and Inspection': ['Audit Head', 'Manager', 'Executive', 'Officer'],
  'CSR and Public Affairs': ['CSR Head', 'Manager', 'Executive']
};


const ALL_DEPARTMENTS = [
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

const truncate = (text: string, max = 30) =>
  text.length > max ? text.slice(0, max) + '…' : text;

const AddUserPage: React.FC = () => {
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    designation: '',
    departments: [] as string[],
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allowedDepartments = user?.role === 'HR'
    ? ALL_DEPARTMENTS.filter(dep => dep !== 'General Management')
    : ALL_DEPARTMENTS;

  const allowedDesignations = Array.from(
    new Set(
      form.departments.flatMap(dep => DESIGNATION_MAP[dep] || [])
    )
  );

  useEffect(() => {
    if (['Director', 'President Operations'].includes(form.designation)) {
      setForm(prev => ({ ...prev, departments: ['General Management'] }));
    }
  }, [form.designation]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setMessage('');
    setError('');
    try {
      await userAPI.addUser(form);
      setMessage('✅ User added successfully. Password sent via email.');
      setForm({ name: '', email: '', designation: '', departments: [] });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 flex items-center">
        <UserPlus className="mr-2 text-[#d19000]" /> Add New User
      </h1>

      {message && <p className="text-green-600 font-medium">{message}</p>}
      {error && <p className="text-red-600 font-medium">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="John Doe"
            className="mt-1 p-2 border rounded-lg w-full"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="john@example.com"
            className="mt-1 p-2 border rounded-lg w-full"
            required
          />
        </div>

        {/* ✅ DEPARTMENT SELECTOR FIRST */}
        <div className="col-span-2 space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Department(s) <span className="text-red-500">*</span>
          </label>

          <div className="flex flex-wrap gap-2">
            {form.departments.length > 0 ? (
              form.departments.map((dep) => (
                <span
                  key={dep}
                  className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full"
                >
                  {truncate(dep)}
                </span>
              ))
            ) : (
              <p className="text-sm text-gray-400">No departments selected.</p>
            )}
          </div>

          <div className="border rounded-lg p-2 max-h-48 overflow-y-auto bg-white shadow-sm">
            {allowedDepartments.map((dep) => (
              <label
                key={dep}
                className="flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-100 cursor-pointer"
              >
                <input
                  type="checkbox"
                  value={dep}
                  checked={form.departments.includes(dep)}
                  onChange={() => {
                    const updated = form.departments.includes(dep)
                      ? form.departments.filter((d) => d !== dep)
                      : [...form.departments, dep];
                    setForm((prev) => ({ ...prev, departments: updated, designation: '' }));
                  }}
                  className="form-checkbox text-[#d19000]"
                />
                <span>{dep}</span>
              </label>
            ))}
          </div>
        </div>

        {/* ✅ DESIGNATION SELECTOR FILTERED BASED ON DEPARTMENTS */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Designation <span className="text-red-500">*</span>
          </label>
          <select
            name="designation"
            value={form.designation}
            onChange={handleChange}
            className="mt-1 p-2 border rounded-lg w-full"
            required
            disabled={allowedDesignations.length === 0}
          >
            <option value="">Select Designation</option>
            {allowedDesignations.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-[#d19000] text-white px-6 py-2 rounded-lg flex items-center hover:bg-[#b17000] disabled:opacity-50"
        >
          <Save className="mr-2" size={18} /> {isSubmitting ? 'Saving...' : 'Add User'}
        </button>
      </div>
    </div>
  );
};

export default AddUserPage;
