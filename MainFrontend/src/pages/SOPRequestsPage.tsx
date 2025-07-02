import React, { useState, useEffect } from 'react';
import { sopAPI } from '../utils/api';
import useAuth from '../contexts/AuthContext';
import { 
  FileText, 
  Download, 
  CheckCircle, 
  XCircle, 
  Calendar,
  User,
  Building,
  AlertCircle
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
  status: string;
  createdAt: string;
}

const SOPRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const [sopRequests, setSOPRequests] = useState<SOP[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  useEffect(() => {
    fetchSOPRequests();
  }, []);

  const fetchSOPRequests = async () => {
    setLoading(true);
    try {
      const response = await sopAPI.getSOPRequests();
      setSOPRequests(response.data);
    } catch (error) {
      console.error('Error fetching SOP requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (sopId: string) => {
    setActionLoading(sopId);
    try {
      await sopAPI.approveSOP(sopId);
      await fetchSOPRequests(); // Refresh the list
      alert('SOP approved successfully!');
    } catch (error) {
      console.error('Error approving SOP:', error);
      alert('Failed to approve SOP');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (sopId: string) => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setActionLoading(sopId);
    try {
      await sopAPI.rejectSOP(sopId, rejectReason);
      await fetchSOPRequests(); // Refresh the list
      setShowRejectModal(null);
      setRejectReason('');
      alert('SOP rejected successfully!');
    } catch (error) {
      console.error('Error rejecting SOP:', error);
      alert('Failed to reject SOP');
    } finally {
      setActionLoading(null);
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

  const handleView = async (sopId: string) => {
    try {
      const response = await sopAPI.downloadSOP(sopId);
      if (response.request.responseURL) {
        window.open(response.request.responseURL, '_blank');
      } else {
        alert('Failed to view SOP: URL not found');
      }
    } catch (error) {
      console.error('Error viewing SOP:', error);
      alert('Failed to view SOP');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Reviewing': { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      'Active': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'Draft': { color: 'bg-gray-100 text-gray-800', icon: FileText },
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">SOP Approval Requests</h1>
        <p className="text-gray-600">Review and approve SOPs submitted by QA Head</p>
      </div>

      {sopRequests.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No pending requests</h3>
          <p className="mt-1 text-sm text-gray-500">
            All SOPs have been reviewed or no new requests have been submitted.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {sopRequests.map((sop) => (
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
                        <span>{sop.uploadedBy.name} ({sop.uploadedBy.designation})</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="flex-shrink-0 h-4 w-4 mr-1" />
                        <span>{new Date(sop.createdAt).toLocaleDateString()}</span>
                      </div>
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
                    
                    <button
                      onClick={() => handleApprove(sop._id)}
                      disabled={actionLoading === sop._id}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      {actionLoading === sop._id ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                      ) : (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      )}
                      Approve
                    </button>
                    
                    <button
                      onClick={() => setShowRejectModal(sop._id)}
                      disabled={actionLoading === sop._id}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      <XCircle className="w-3 h-3 mr-1" />
                      Reject
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center">
                <XCircle className="h-6 w-6 text-red-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Reject SOP</h3>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for rejection:
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Please provide a detailed reason for rejecting this SOP..."
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowRejectModal(null);
                    setRejectReason('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(showRejectModal)}
                  disabled={!rejectReason.trim() || actionLoading === showRejectModal}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {actionLoading === showRejectModal ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                  ) : (
                    'Reject'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SOPRequestsPage;
