import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  FileText,
  Download,
  Calendar,
  AlertTriangle,
  Save,
  X,
} from 'lucide-react';
import { certificateAPI } from '../utils/api';

interface Certificate {
  _id: string;
  type: string;
  name: string;
  issuedBy: string;
  certificateNumber: string;
  issueDate: string;
  expiryDate: string;
  status: string;
  daysLeft: number;
  certificateFile: string;
}

const CERTIFICATE_META: {
  [key: string]: { name: string; issuedBy: string };
} = {
  'WHO-GMP': {
    name: 'Good Manufacturing Practice Certificate',
    issuedBy: 'World Health Organization',
  },
  'ISO 9001:2015': {
    name: 'ISO Quality Management System',
    issuedBy: 'International Organization for Standardization',
  },
  'Drug Manufacturing License': {
    name: 'Drug Manufacturing License',
    issuedBy: 'State Drug Licensing Authority',
  },
  'Fire Safety Certificate': {
    name: 'Fire & Safety Compliance',
    issuedBy: 'Local Fire Department',
  },
  'Pollution Control Board (PCB)': {
    name: 'Environmental Compliance Certificate',
    issuedBy: 'Pollution Control Board',
  },
  'Other': {
    name: '',
    issuedBy: '',
  },
};

const DEPARTMENTS = ['Quality Assurance', 'Production', 'Warehouse', 'R&D', 'All Departments'];

const CertificationVault: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    type: '',
    name: '',
    issuedBy: '',
    certificateNumber: '',
    issueDate: '',
    expiryDate: '',
    reminderDays: '',
    department: '',
    notes: '',
    plantName: 'Naxcuure Healthcare Pvt Ltd',
  });

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;

      if (name === 'type') {
        const meta = CERTIFICATE_META[value] || { name: '', issuedBy: '' };

        setForm((prev) => ({
          ...prev,
          type: value,
          name: prev.name?.trim() ? prev.name : meta.name,
          issuedBy: prev.issuedBy?.trim() ? prev.issuedBy : meta.issuedBy,
        }));
      } else {
        setForm((prev) => ({ ...prev, [name]: value }));
      }
    },
    []
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.append(key, value));
    if (file) formData.append('certificateFile', file);

    try {
      await certificateAPI.add(formData);
      setShowAddModal(false);
      setForm({
        type: '', name: '', issuedBy: '', certificateNumber: '', issueDate: '',
        expiryDate: '', reminderDays: '', department: '', notes: '', plantName: 'Naxcuure Healthcare Pvt Ltd'
      });
      setFile(null);
      fetchCertificates();
    } catch (err) {
      console.error('❌ Error adding certificate:', err);
    }
  };

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const res = await certificateAPI.getAll();
      const rawData = res.data.certificates || [];
      const transformed = rawData.map((cert: any) => {
        const issueDate = new Date(cert.issueDate);
        const expiryDate = new Date(cert.expiryDate);
        const today = new Date();
        const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        let status = 'Expired';
        if (daysLeft > 90) status = 'Valid';
        else if (daysLeft > 0) status = 'Expiring Soon';

        return {
          _id: cert._id,
          type: cert.certificateType || 'Other',
          name: cert.certificateName || '',
          issuedBy: cert.addedBy?.name || cert.issuedBy || 'Unknown',
          certificateNumber: cert.certificateNumber,
          issueDate: cert.issueDate.split('T')[0],
          expiryDate: cert.expiryDate.split('T')[0],
          status,
          daysLeft,
          certificateFile: cert.certificateFile
        };
      });
      setCertificates(transformed);
    } catch (err) {
      console.error('❌ Error loading certificates:', err);
      setCertificates([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCertificates(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Certification Vault</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#d19000] text-white rounded-lg hover:bg-[#b17000] flex items-center"
        >
          <Plus size={20} className="mr-2" /> Add Certificate
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="relative">
          <input
            type="text"
            placeholder="Search certificates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#d19000] focus:border-transparent"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
        </div>
      </div>

      {!loading && certificates.length === 0 && (
        <p className="text-center text-gray-500">No certificates found.</p>
      )}

      {loading ? (
        <p className="text-center text-gray-500">Loading certificates...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates
            .filter(cert =>
              [cert.name, cert.type, cert.certificateNumber, cert.issuedBy]
                .some(field => field.toLowerCase().includes(searchQuery.toLowerCase()))
            )
            .map(cert => (
              <div key={cert._id} className="bg-white rounded-xl shadow p-5 relative">
                <span
                  className={`absolute top-3 left-3 text-xs font-semibold px-3 py-1 rounded-full ${
                    cert.status === 'Valid'
                      ? 'bg-green-100 text-green-800'
                      : cert.status === 'Expiring Soon'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {cert.status}
                </span>

                <div className="absolute top-3 right-3 flex space-x-2">
                  <button
                    type="button"
                    title="Preview"
                    onClick={() => window.open(cert.certificateFile, '_blank')}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FileText size={18} />
                  </button>
                </div>

                <h3 className="mt-8 font-semibold text-lg text-black">{cert.type}</h3>
                <div className="mt-2 space-y-1 text-sm text-gray-700">
                  <div>
                    <span className="text-gray-500">Certificate No:</span> {cert.certificateNumber}
                  </div>
                  <div>
                    <span className="text-gray-500">Issued By:</span> {cert.issuedBy}
                  </div>
                  <div className="flex items-center">
                    <Calendar size={14} className="text-gray-400 mr-1" />
                    <span className="text-gray-500">Valid:</span>
                    <span className="ml-1">{cert.issueDate} to {cert.expiryDate}</span>
                  </div>
                </div>

                {cert.daysLeft < 90 && cert.daysLeft > 0 && (
                  <div className="mt-4 bg-yellow-50 text-yellow-800 text-sm p-2 rounded flex items-center space-x-2">
                    <AlertTriangle size={16} />
                    <span>Expires in {cert.daysLeft} days</span>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {showAddModal && (
        <AddCertificateModal
          form={form}
          file={file}
          onChange={handleChange}
          onFileChange={handleFileChange}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};

export default CertificationVault;

const AddCertificateModal = ({ form, file, onChange, onFileChange, onClose, onSubmit }: any) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-xl w-full max-w-3xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Add New Certificate</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X size={24} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <select name="type" value={form.type} onChange={onChange} className="w-full p-2 border rounded-lg">
          <option value="">Select Certificate Type</option>
          {Object.keys(CERTIFICATE_META).map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <input name="name" value={form.name} onChange={onChange} placeholder="Certificate Name" className="w-full p-2 border rounded-lg" />
        <input name="issuedBy" value={form.issuedBy} onChange={onChange} placeholder="Issued By" className="w-full p-2 border rounded-lg" />
        <input name="certificateNumber" value={form.certificateNumber} onChange={onChange} placeholder="Certificate Number" className="w-full p-2 border rounded-lg" />
        <input type="date" name="issueDate" value={form.issueDate} onChange={onChange} className="w-full p-2 border rounded-lg" />
        <input type="date" name="expiryDate" value={form.expiryDate} onChange={onChange} className="w-full p-2 border rounded-lg" />
        <input name="reminderDays" value={form.reminderDays} onChange={onChange} placeholder="Reminder Days" className="w-full p-2 border rounded-lg" />
        <select name="department" value={form.department} onChange={onChange} className="w-full p-2 border rounded-lg">
          <option value="">Select Department</option>
          {DEPARTMENTS.map(dep => (
            <option key={dep} value={dep}>{dep}</option>
          ))}
        </select>
        <input name="plantName" value={form.plantName} readOnly disabled className="w-full p-2 border rounded-lg bg-gray-100 text-gray-600" />
        <textarea name="notes" value={form.notes} onChange={onChange} rows={2} placeholder="Additional Notes" className="w-full p-2 border rounded-lg col-span-2" />
        <input type="file" accept=".pdf,image/*" onChange={onFileChange} className="w-full col-span-2" />
      </div>
      <div className="flex justify-end mt-6 space-x-2">
        <button onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
        <button onClick={onSubmit} className="px-4 py-2 bg-[#d19000] text-white rounded-lg hover:bg-[#b17000] flex items-center">
          <Save size={20} className="mr-2" /> Add Certificate
        </button>
      </div>
    </div>
  </div>
);
