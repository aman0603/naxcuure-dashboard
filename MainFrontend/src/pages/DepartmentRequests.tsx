import React, { useState, useEffect } from 'react';
import { Users, Eye } from 'lucide-react';
import { inventoryAPI } from '../utils/api';
import { InventoryRequest } from '../types';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';

const DepartmentRequests: React.FC = () => {
  const [requests, setRequests] = useState<InventoryRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterStatus, setFilterStatus] = useState('all');
  const [searchItem, setSearchItem] = useState('');
  const [searchRequester, setSearchRequester] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<InventoryRequest | null>(null);
  const [pastUsage, setPastUsage] = useState<InventoryRequest[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      try {
        const response = await inventoryAPI.getDepartmentRequests();
        setRequests(response.data.requests || []);
      } catch (error) {
        console.error('Error fetching requests:', error);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  useEffect(() => {
    if (selectedRequest?.requestedBy?._id && selectedRequest?.item) {
      const fetchPastUsage = async () => {
        try {
          const res = await inventoryAPI.getPastUsage(selectedRequest.requestedBy._id, selectedRequest.item);
          setPastUsage(res.data.usage || []);
        } catch (err) {
          console.error('Failed to load usage history', err);
        }
      };
      fetchPastUsage();
    }
  }, [selectedRequest]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchItem, searchRequester]);

  const handleApprove = async () => {
    if (!selectedRequest) return;
    try {
      await inventoryAPI.approveRequest(selectedRequest._id);
      setRequests(prev =>
        prev.map(req =>
          req._id === selectedRequest._id ? { ...req, status: 'Pending Warehouse Issuance' } : req
        )
      );
      setSelectedRequest(null);
    } catch (error) {
      alert('Failed to approve request');
      console.error(error);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    try {
      await inventoryAPI.rejectRequest(selectedRequest._id);
      setRequests(prev =>
        prev.map(req =>
          req._id === selectedRequest._id ? { ...req, status: 'Rejected' } : req
        )
      );
      setSelectedRequest(null);
    } catch (error) {
      alert('Failed to reject request');
      console.error(error);
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchesItem = searchItem === '' || r.item?.toLowerCase().includes(searchItem.toLowerCase());
    const matchesRequester =
      searchRequester === '' || r.requestedBy?.name?.toLowerCase().includes(searchRequester.toLowerCase());
    return matchesStatus && matchesItem && matchesRequester;
  });

  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-orange-600 flex items-center">
          <Users className="mr-2" /> Department Requests
        </h1>
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search by item"
            className="border border-blue-300 px-3 py-1 rounded-md focus:outline-none focus:ring focus:border-blue-500"
            value={searchItem}
            onChange={(e) => setSearchItem(e.target.value)}
          />
          <input
            type="text"
            placeholder="Search by requester"
            className="border border-blue-300 px-3 py-1 rounded-md focus:outline-none focus:ring focus:border-blue-500"
            value={searchRequester}
            onChange={(e) => setSearchRequester(e.target.value)}
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-blue-300 px-2 py-1 rounded-md focus:outline-none focus:ring focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="Pending Department Head Approval">Pending Approval</option>
            <option value="Pending Warehouse Issuance">Approved</option>
            <option value="Issued">Issued</option>
            <option value="Claimed">Claimed</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" text="Loading department requests..." />
        </div>
      ) : (
        <>
          <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-blue-50 text-blue-800">
              <tr>
                <th className="border px-4 py-2 text-left">Item</th>
                <th className="border px-4 py-2 text-left">Qty</th>
                <th className="border px-4 py-2 text-left">Requester</th>
                <th className="border px-4 py-2 text-left">Status</th>
                <th className="border px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRequests.map((r) => (
                <tr key={r._id}>
                  <td className="border px-4 py-2">{r.item}</td>
                  <td className="border px-4 py-2">{r.quantity}</td>
                  <td className="border px-4 py-2">{r.requestedBy?.name || 'N/A'}</td>
                  <td className="border px-4 py-2">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="border px-4 py-2">
                    <button
                      className="text-blue-600 hover:text-orange-600 transition"
                      onClick={() => setSelectedRequest(r)}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-4 space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 border rounded ${
                    currentPage === page ? 'bg-orange-500 text-white' : ''
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
            <h2 className="text-xl font-bold text-orange-600 mb-2">Request Details</h2>
            <ul className="space-y-1 text-sm text-gray-700">
              <li><strong>Item:</strong> {selectedRequest.item}</li>
              <li><strong>Quantity:</strong> {selectedRequest.quantity}</li>
              <li><strong>Requester:</strong> {selectedRequest.requestedBy?.name || 'N/A'}</li>
              <li><strong>Department:</strong> {selectedRequest.department}</li>
              <li><strong>Status:</strong> {selectedRequest.status}</li>
              <li><strong>Reason:</strong> {selectedRequest.reason}</li>
              <li><strong>Requested At:</strong> {new Date(selectedRequest.createdAt).toLocaleString()}</li>
            </ul>

            <div className="mt-4 border-t pt-3">
              <h3 className="font-semibold text-blue-700">Past Usage of {selectedRequest.item}</h3>
              {pastUsage.length === 0 ? (
                <p className="text-gray-500 text-sm">No previous usage found.</p>
              ) : (
                <ul className="text-sm mt-1 list-disc pl-4 text-gray-700">
                  {pastUsage.map((u) => (
                    <li key={u._id}>
                      Qty: {u.quantity} — {new Date(u.createdAt).toLocaleDateString()} ({u.status})
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-6 flex justify-between items-center">
              {selectedRequest.status === 'Pending Department Head Approval' && (
                <>
                  <button
                    onClick={handleApprove}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={handleReject}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                  >
                    Reject
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedRequest(null)}
                className="ml-auto text-orange-600 font-medium hover:underline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentRequests;
