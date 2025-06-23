import React, { useState, useEffect } from 'react';
import { Eye, Search } from 'lucide-react';
import { format } from 'date-fns';
import { inventoryAPI } from '../utils/api';
import { InventoryRequest, BatchInfo } from '../types';
import StatusBadge from '../components/common/StatusBadge';
import UrgencyBadge from '../components/common/UrgencyBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';

const IssueInventory: React.FC = () => {
  const [requests, setRequests] = useState<InventoryRequest[]>([]);
  const [batches, setBatches] = useState<BatchInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<InventoryRequest | null>(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [issueQty, setIssueQty] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await inventoryAPI.getApprovedRequests();
        if (Array.isArray(res.data.requests)) {
          setRequests(res.data.requests);
        } else {
          console.error("❌ Invalid format, expected { requests: [...] }");
          setRequests([]);
        }
      } catch (err) {
        console.error("❌ Error fetching inventory requests", err);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const openIssueModal = async (request: InventoryRequest) => {
    try {
      setSelectedRequest(request);
      setShowIssueModal(true);
      setActionLoading(true);
      setError('');
      setIssueQty(0);
      setSelectedBatch('');

      const res = await inventoryAPI.getStock();
      const normalizedItem = request.item.replace(/\s+/g, '').toLowerCase();
      const matchingItem = res.data.find((item: any) =>
        item.itemName.replace(/\s+/g, '').toLowerCase() === normalizedItem
      );

      if (matchingItem && Array.isArray(matchingItem.batches)) {
        setBatches(matchingItem.batches);
      } else {
        setBatches([]);
        setError(`⚠️ No matching batch found for item "${request.item}".`);
      }
    } catch (err) {
      console.error('❌ Error fetching batches:', err);
      setBatches([]);
      setError("❌ Could not load batches.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleIssue = async () => {
    if (!selectedRequest || !selectedBatch || issueQty <= 0) return;

    const selected = batches.find(b => b.batchId === selectedBatch);
    const available = selected ? selected.quantity - selected.issued : 0;

    if (!selected || available < issueQty) {
      setError(`❌ Cannot issue ${issueQty}. Only ${available} units available in batch ${selected?.batchId || ''}.`);
      return;
    }

    try {
      setActionLoading(true);
      await inventoryAPI.issueRequest(selectedRequest._id, {
        batchId: selectedBatch,
        quantity: issueQty,
      });

      setRequests(prev => prev.filter(r => r._id !== selectedRequest._id));
      setShowIssueModal(false);
      setSelectedBatch('');
      setIssueQty(0);
      setSelectedRequest(null);
      setError('');
    } catch (err) {
      console.error('❌ Failed to issue item:', err);
      setError('Failed to issue item. Try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = requests.filter(req =>
    req.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.requestedBy?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-orange-600">Requests Pending Issuance</h2>
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by item or requester..."
            className="pl-8 pr-4 py-2 rounded-md border border-blue-300 focus:ring focus:border-blue-500 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      {filteredRequests.length === 0 ? (
        <p className="text-gray-600">No pending requests found.</p>
      ) : (
        <div className="overflow-x-auto border rounded-md">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-blue-50 text-blue-800 text-left">
                <th className="p-3">Item</th>
                <th>Quantity</th>
                <th>Requested By</th>
                <th>Date</th>
                <th>Urgency</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req) => (
                <tr key={req._id} className="border-t hover:bg-orange-50">
                  <td className="p-3">{req.item}</td>
                  <td>{req.quantity}</td>
                  <td>{req.requestedBy?.name || 'N/A'}</td>
                  <td>{format(new Date(req.createdAt), 'dd MMM yyyy')}</td>
                  <td><UrgencyBadge urgency={req.urgency} /></td>
                  <td><StatusBadge status={req.status} /></td>
                  <td>
                    <button
                      onClick={() => openIssueModal(req)}
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Eye size={16} /> Issue
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showIssueModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-lg relative">
            <h3 className="text-lg font-semibold text-blue-700 mb-3">
              Issue Item: {selectedRequest.item}
            </h3>

            {actionLoading ? (
              <LoadingSpinner />
            ) : (
              <>
                {/* Batch Selection */}
                <div className="mb-4">
                  <label className="block mb-1 text-sm font-medium">Select Batch</label>
                  <select
                    className="w-full border border-blue-300 rounded px-3 py-2"
                    value={selectedBatch}
                    onChange={(e) => {
                      setSelectedBatch(e.target.value);
                      setError('');
                      setIssueQty(0);
                    }}
                  >
                    <option value="">-- Select --</option>
                    {batches.map((batch) => (
                      <option key={batch.batchId} value={batch.batchId}>
                        {batch.batchId} — Available: {batch.balance}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity Input */}
                {selectedBatch && (
                  <div className="mb-4">
                    <label className="block mb-1 text-sm font-medium">Quantity to Issue</label>
                    <input
                      type="number"
                      className="w-full border border-blue-300 rounded px-3 py-2"
                      min={1}
                      max={batches.find(b => b.batchId === selectedBatch)?.balance || 0}
                      value={issueQty}
                      onChange={(e) => setIssueQty(Number(e.target.value))}
                    />
                  </div>
                )}

                {/* Error Message */}
                {error && <p className="text-red-600 mb-2">{error}</p>}

                {/* Buttons */}
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setShowIssueModal(false)}
                    className="text-gray-600 hover:text-orange-600 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleIssue}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    disabled={!selectedBatch || issueQty <= 0}
                  >
                    Confirm Issue
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueInventory;
