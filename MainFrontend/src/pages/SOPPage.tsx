import React, { useState, useEffect } from 'react';
import { sopAPI } from '../utils/api';
import useAuth from '../contexts/AuthContext';
import { 
  FileText, 
  Download, 
  Calendar,
  User,
  Building,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  Filter,
  Edit,
  Upload
} from 'lucide-react';

interface SOP {
  _id: string;
  title: string;
  version: string;
  department: string;
  fileUrl: string;
  uploadedBy: {
    _id: string;
    name: string;
    email: string;
    designation: string;
  };
  approvedBy?: {
    _id: string;
    name: string;
    email: string;
    designation: string;
  };
  status: string;
  createdAt: string;
  approvedAt?: string;
}

const SOPPage: React.FC = () => {
  const { user } = useAuth();
  const [sops, setSOPs] = useState<SOP[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [version, setVersion] = useState('');
  const [department, setDepartment] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchSOPs();
  }, []);

  const fetchSOPs = async () => {
    setLoading(true);
    try {
      const response = await sopAPI.getAllSOPs();
      setSOPs(response.data);
    } catch (error) {
      console.error('Error fetching SOPs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (sopId: string) => {
    try {
      const response = await sopAPI.downloadSOP(sopId);
      if (response.request.responseURL) {
        window.open(response.request.responseURL, '_blank');
      } else {
        alert('Failed to download SOP: URL not found');
      }
    } catch (error) {
      console.error('Error downloading SOP:', error);
      alert('Failed to download SOP');
    }
  };

  const [showViewModal, setShowViewModal] = useState<string | null>(null);
  const [viewUrl, setViewUrl] = useState<string | null>(null);

  const handleView = async (sopId: string) => {
    try {
      const response = await sopAPI.downloadSOP(sopId);
      if (response.request.responseURL) {
        setViewUrl(response.request.responseURL);
        setShowViewModal(sopId);
      } else {
        alert('Failed to view SOP: URL not found');
      }
    } catch (error) {
      console.error('Error viewing SOP:', error);
      alert('Failed to view SOP');
    }
  };

  const handleDelete = async (sopId: string) => {
    if (window.confirm('Are you sure you want to archive this SOP? Note: This action will move the SOP to Archived status and it will not be permanently deleted.')) {
      try {
        const response = await sopAPI.deleteSOP(sopId);
        fetchSOPs(); // Refresh the list
        if (user?.designation === 'QA Head') {
          alert('SOP deletion request sent for Director approval. The SOP status is now Pending Deletion.');
        } else {
          alert('SOP archived successfully. You can still view it by filtering for Archived status.');
        }
      } catch (error) {
        console.error('Error archiving SOP:', error);
        alert('Failed to archive SOP');
      }
    }
  };

  const handlePermanentDelete = async (sopId: string) => {
    if (window.confirm('Are you sure you want to PERMANENTLY DELETE this archived SOP? This action cannot be undone.')) {
      try {
        await sopAPI.permanentDeleteSOP(sopId);
        fetchSOPs(); // Refresh the list
        alert('SOP permanently deleted from the database.');
      } catch (error) {
        console.error('Error permanently deleting SOP:', error);
        alert('Failed to permanently delete SOP');
      }
    }
  };

  const handleUpload = async () => {
    if (!title || !version || !department || !file) {
      alert('Please fill in all fields and select a file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('version', version);
      formData.append('department', department);
      formData.append('file', file);

      await sopAPI.uploadSOP(formData);
      setShowUploadModal(false);
      setTitle('');
      setVersion('');
      setDepartment('');
      setFile(null);
      fetchSOPs(); // Refresh the list
      if (user?.designation === 'QA Head') {
        alert('SOP uploaded successfully with status "Reviewing". A request for approval has been sent to Director and President Operations. The SOP will be active only after approval.');
      } else {
        alert('SOP uploaded successfully with status "Active".');
      }
    } catch (error) {
      console.error('Error uploading SOP:', error);
      alert('Failed to upload SOP');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = async (sopId: string) => {
    if (!title || !version || !department) {
      alert('Please fill in all fields');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('version', version);
      formData.append('department', department);
      if (file) {
        formData.append('file', file);
      }

      await sopAPI.updateSOP(sopId, formData);
      setShowEditModal(null);
      setTitle('');
      setVersion('');
      setDepartment('');
      setFile(null);
      fetchSOPs(); // Refresh the list
      if (user?.designation === 'QA Head') {
        alert('SOP updated successfully. A request for approval has been sent to Director and President Operations.');
      } else {
        alert('SOP updated successfully.');
      }
    } catch (error) {
      console.error('Error updating SOP:', error);
      alert('Failed to update SOP');
    } finally {
      setUploading(false);
    }
  };

  const openEditModal = (sopId: string) => {
    const sop = sops.find(s => s._id === sopId);
    if (sop) {
      setTitle(sop.title);
      setVersion(sop.version);
      setDepartment(sop.department);
      setShowEditModal(sopId);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Reviewing': { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      'Active': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'Draft': { color: 'bg-gray-100 text-gray-800', icon: FileText },
      'PendingDeletion': { color: 'bg-red-100 text-red-800', icon: XCircle },
      'Archived': { color: 'bg-gray-100 text-gray-600', icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Draft;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </span>
    );
  };

  const filteredSOPs = sops.filter(sop => {
    const matchesSearch = sop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sop.version.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || sop.status === statusFilter;
    const matchesDepartment = departmentFilter === 'All' || sop.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const departments = [...new Set(sops.map(sop => sop.department))];
  const statuses = [...new Set(sops.map(sop => sop.status))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Standard Operating Procedures</h1>
            <p className="text-gray-600">Manage and view all SOPs in the system</p>
          </div>
          {(user?.designation === 'QA Head' || user?.designation === 'Director' || user?.designation === 'President Operations') && (
            <button 
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload SOP
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search SOPs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="All">All Status</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="All">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredSOPs.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No SOPs found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== 'All' || departmentFilter !== 'All' 
              ? 'Try adjusting your search or filters.'
              : 'No SOPs have been uploaded yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredSOPs.map((sop) => (
              <li key={sop._id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="flex-shrink-0 h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {sop.title}
                          </p>
                          <p className="text-sm text-gray-500">Version: {sop.version}</p>
                        </div>
                      </div>
                      {getStatusBadge(sop.status)}
                    </div>
                    
                    <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                      <div className="flex items-center">
                        <Building className="flex-shrink-0 h-4 w-4 mr-1" />
                        <span>{sop.department}</span>
                      </div>
                      <div className="flex items-center">
                        <User className="flex-shrink-0 h-4 w-4 mr-1" />
                        <span>
                          {sop.uploadedBy && sop.uploadedBy.name 
                            ? `${sop.uploadedBy.name} (${sop.uploadedBy.designation || 'N/A'})` 
                            : 'Unknown User'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="flex-shrink-0 h-4 w-4 mr-1" />
                        <span>{new Date(sop.createdAt).toLocaleDateString()}</span>
                      </div>
                      {sop.approvedBy && sop.approvedAt && sop.approvedBy.name && (
                        <div className="flex items-center">
                          <CheckCircle className="flex-shrink-0 h-4 w-4 mr-1 text-green-500" />
                          <span>Approved by {sop.approvedBy.name} on {new Date(sop.approvedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleView(sop._id)}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      View
                    </button>
                    <button
                      onClick={() => handleDownload(sop._id)}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </button>
                    {(user?.designation === 'QA Head' || user?.designation === 'Director' || user?.designation === 'President Operations') && (
                      <button
                        onClick={() => openEditModal(sop._id)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </button>
                    )}
                    {(user?.designation === 'Director' || user?.designation === 'President Operations') && (
                      <>
                        {sop.status !== 'Archived' ? (
                          <button
                            onClick={() => handleDelete(sop._id)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Archive
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePermanentDelete(sop._id)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-800 hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Permanent Delete
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-2/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center">
                <Upload className="h-6 w-6 text-orange-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Upload New SOP</h3>
              </div>
              <div className="mt-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter SOP title"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Version</label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter SOP version"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Select Department</option>
                    <option value="Quality Assurance">Quality Assurance</option>
                    <option value="Quality Control">Quality Control</option>
                    <option value="Microbiology">Microbiology</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Production">Production</option>
                    <option value="Warehouse">Warehouse</option>
                    <option value="Packing">Packing</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Human Resource and Administration">Human Resource and Administration</option>
                    <option value="Formulation and Development">Formulation and Development</option>
                    <option value="Regulatory Affairs">Regulatory Affairs</option>
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Environment Health and Safety">Environment Health and Safety</option>
                    <option value="General Management">General Management</option>
                    <option value="Security">Security</option>
                    <option value="Purchase and Procurement">Purchase and Procurement</option>
                    <option value="Finance and Accounts">Finance and Accounts</option>
                    <option value="Research and Development">Research and Development</option>
                    <option value="Sales and Marketing">Sales and Marketing</option>
                    <option value="Business Development">Business Development</option>
                    <option value="Training and Development">Training and Development</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Legal and Compliance">Legal and Compliance</option>
                    <option value="Logistics and Dispatch">Logistics and Dispatch</option>
                    <option value="Sterility Assurance">Sterility Assurance</option>
                    <option value="Calibration and Validation">Calibration and Validation</option>
                    <option value="Labelling and Artwork">Labelling and Artwork</option>
                    <option value="Vendor Development">Vendor Development</option>
                    <option value="Customer Support">Customer Support</option>
                    <option value="Audit and Inspection">Audit and Inspection</option>
                    <option value="IT Infrastructure">IT Infrastructure</option>
                    <option value="Admin and Facilities">Admin and Facilities</option>
                    <option value="CSR and Public Affairs">CSR and Public Affairs</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">File (PDF)</label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading || !title || !version || !department || !file}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                >
                  {uploading ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                  ) : (
                    user?.designation === 'QA Head' ? 'Upload and Request Approval' : 'Upload SOP'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-2/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center">
                <Edit className="h-6 w-6 text-orange-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Edit SOP</h3>
              </div>
              <div className="mt-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter SOP title"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Version</label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter SOP version"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Select Department</option>
                    <option value="Quality Assurance">Quality Assurance</option>
                    <option value="Quality Control">Quality Control</option>
                    <option value="Microbiology">Microbiology</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Production">Production</option>
                    <option value="Warehouse">Warehouse</option>
                    <option value="Packing">Packing</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Human Resource and Administration">Human Resource and Administration</option>
                    <option value="Formulation and Development">Formulation and Development</option>
                    <option value="Regulatory Affairs">Regulatory Affairs</option>
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Environment Health and Safety">Environment Health and Safety</option>
                    <option value="General Management">General Management</option>
                    <option value="Security">Security</option>
                    <option value="Purchase and Procurement">Purchase and Procurement</option>
                    <option value="Finance and Accounts">Finance and Accounts</option>
                    <option value="Research and Development">Research and Development</option>
                    <option value="Sales and Marketing">Sales and Marketing</option>
                    <option value="Business Development">Business Development</option>
                    <option value="Training and Development">Training and Development</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Legal and Compliance">Legal and Compliance</option>
                    <option value="Logistics and Dispatch">Logistics and Dispatch</option>
                    <option value="Sterility Assurance">Sterility Assurance</option>
                    <option value="Calibration and Validation">Calibration and Validation</option>
                    <option value="Labelling and Artwork">Labelling and Artwork</option>
                    <option value="Vendor Development">Vendor Development</option>
                    <option value="Customer Support">Customer Support</option>
                    <option value="Audit and Inspection">Audit and Inspection</option>
                    <option value="IT Infrastructure">IT Infrastructure</option>
                    <option value="Admin and Facilities">Admin and Facilities</option>
                    <option value="CSR and Public Affairs">CSR and Public Affairs</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">File (PDF, optional)</label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleEdit(showEditModal)}
                  disabled={uploading || !title || !version || !department}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                >
                  {uploading ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                  ) : (
                    user?.designation === 'QA Head' ? 'Update and Request Approval' : 'Update SOP'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewUrl && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto border w-5/6 h-5/6 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">View SOP</h3>
              <button
                onClick={() => {
                  setShowViewModal(null);
                  setViewUrl(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-3 h-[calc(100%-5rem)]">
              <iframe
                src={viewUrl}
                title="SOP Viewer"
                className="w-full h-full border-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SOPPage;
