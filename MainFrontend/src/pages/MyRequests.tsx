import React, { useState, useEffect } from 'react';
import { FileText, Eye, Package } from 'lucide-react';
import { format } from 'date-fns';
import { inventoryAPI } from '../utils/api';
import { InventoryRequest } from '../types';
import StatusBadge from '../components/common/StatusBadge';
import UrgencyBadge from '../components/common/UrgencyBadge';

const MyRequests: React.FC = () => {
  const [requests, setRequests] = useState<InventoryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<InventoryRequest | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const response = await inventoryAPI.getMyRequests();
      console.log('🧾 Response:', response.data);
      if (Array.isArray(response.data)) {
        setRequests(response.data);
      } else if (Array.isArray(response.data.requests)) {
        setRequests(response.data.requests);
      } else {
        setRequests([]);
        console.error('❌ Invalid data format:', response.data);
      }
    } catch (error) {
      console.error('❌ Failed to load requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (requestId: string) => {
    try {
      await inventoryAPI.claimRequest(requestId);
      loadRequests();
    } catch (error) {
      console.error('Failed to claim request:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <FileText className="w-6 h-6 text-blue-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Requests</h1>
            <p className="text-gray-600">View and manage your inventory requests</p>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Total: {requests.length} requests
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
          <p className="text-gray-600 mb-4">You haven't made any inventory requests yet.</p>
          <a
            href="/request-inventory"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Create Request
          </a>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Urgency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request._id || request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {request.itemName || request.item}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {(request._id || request.id).toString().substring(0, 8)}...
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <UrgencyBadge urgency={request.urgency} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(request.requestDate || request.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {request.status === 'Issued' && (
                        <button
                          onClick={() => handleClaim(request._id || request.id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-full text-white bg-green-600 hover:bg-green-700"
                        >
                          <Package className="w-3 h-3 mr-1" />
                          Claim
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Request Details</h3>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Request ID</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRequest._id || selectedRequest.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1">
                      <StatusBadge status={selectedRequest.status} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Item</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRequest.itemName || selectedRequest.item}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Quantity</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRequest.quantity}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Urgency</label>
                    <div className="mt-1">
                      <UrgencyBadge urgency={selectedRequest.urgency} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Request Date</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {format(new Date(selectedRequest.requestDate || selectedRequest.createdAt), 'PPP')}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reason</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.reason}</p>
                </div>
                {selectedRequest.comments && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Comments</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRequest.comments}</p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                {selectedRequest.status === 'Issued' && (
                  <button
                    onClick={() => handleClaim(selectedRequest._id || selectedRequest.id)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Claim Item
                  </button>
                )}
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRequests;