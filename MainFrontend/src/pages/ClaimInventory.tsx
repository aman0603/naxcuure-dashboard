import React, { useState, useEffect } from 'react';
import { CheckCircle, Package, Clock, AlertTriangle } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import { inventoryAPI } from '../utils/api';
import { InventoryRequest } from '../types';
import StatusBadge from '../components/common/StatusBadge';
import UrgencyBadge from '../components/common/UrgencyBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ClaimInventory: React.FC = () => {
  const [issuedRequests, setIssuedRequests] = useState<InventoryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => {
    loadIssuedRequests();
    const interval = setInterval(loadIssuedRequests, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadIssuedRequests = async () => {
    try {
      const response = await inventoryAPI.getIssuedRequests();
      setIssuedRequests(response.data);
    } catch (error) {
      console.error('Failed to load issued requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (requestId: string) => {
    setClaimingId(requestId);
    try {
      await inventoryAPI.claimRequest(requestId);
      loadIssuedRequests();
    } catch (error) {
      console.error('Failed to claim request:', error);
    } finally {
      setClaimingId(null);
    }
  };

  const getTimeRemaining = (issuedDate: string) => {
    const issued = new Date(issuedDate);
    const now = new Date();
    const minutesElapsed = differenceInMinutes(now, issued);
    const minutesRemaining = 30 - minutesElapsed;

    return {
      minutesRemaining,
      isOverdue: minutesRemaining <= 0,
      isUrgent: minutesRemaining <= 5 && minutesRemaining > 0,
    };
  };

  const totalIssued = issuedRequests.length;
  const overdueCount = issuedRequests.filter(
    (req) => req.issuedDate && getTimeRemaining(req.issuedDate).isOverdue
  ).length;
  const urgentCount = issuedRequests.filter(
    (req) => req.issuedDate && getTimeRemaining(req.issuedDate).isUrgent
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading issued items..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-orange-600">Claim Inventory</h1>
            <p className="text-sm text-blue-600">Items ready for pickup – claim within 30 minutes</p>
          </div>
        </div>
        <div className="text-sm text-blue-500">{totalIssued} items ready for claim</div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Ready to Claim',
            count: totalIssued,
            icon: Package,
            iconBg: 'bg-orange-100',
            iconColor: 'text-orange-600',
          },
          {
            label: 'Urgent (≤5 min)',
            count: urgentCount,
            icon: Clock,
            iconBg: 'bg-yellow-100',
            iconColor: 'text-yellow-700',
          },
          {
            label: 'Overdue',
            count: overdueCount,
            icon: AlertTriangle,
            iconBg: 'bg-red-100',
            iconColor: 'text-red-600',
          },
          {
            label: 'On Time',
            count: totalIssued - overdueCount - urgentCount,
            icon: CheckCircle,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
          },
        ].map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center">
              <div className={`${stat.iconBg} p-2 rounded-lg`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Items List */}
      {issuedRequests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No items to claim</h3>
          <p className="text-gray-600">You don't have any issued items waiting to be claimed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {issuedRequests.map((request) => {
            const timeInfo = request.issuedDate ? getTimeRemaining(request.issuedDate) : null;
            const timeColor = timeInfo?.isOverdue
              ? 'text-red-600'
              : timeInfo?.isUrgent
              ? 'text-orange-600'
              : 'text-green-600';

            const cardStyle = timeInfo?.isOverdue
              ? 'border-red-200 bg-red-50'
              : timeInfo?.isUrgent
              ? 'border-orange-200 bg-orange-50'
              : 'border-blue-100 hover:border-blue-300';

            return (
              <div
                key={request.id}
                className={`bg-white rounded-lg shadow-sm border-2 p-6 transition-all ${cardStyle}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-blue-900">{request.itemName}</h3>
                        <p className="text-sm text-gray-600">
                          Quantity:{' '}
                          <span className="font-medium">
                            {request.issuedQuantity || request.quantity}
                          </span>
                          {request.issuedBatch && (
                            <span className="ml-4">
                              Batch:{' '}
                              <span className="font-medium">{request.issuedBatch}</span>
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <UrgencyBadge urgency={request.urgency} />
                        <p className="text-xs text-gray-500 mt-1">
                          Request ID: {request.id.substring(0, 8)}...
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Issued By</p>
                        <p className="font-medium text-gray-900">{request.issuedBy}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Issued Date</p>
                        <p className="font-medium text-gray-900">
                          {request.issuedDate &&
                            format(new Date(request.issuedDate), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Time Remaining</p>
                        <p className={`font-medium ${timeColor}`}>
                          {timeInfo?.isOverdue
                            ? `Overdue by ${Math.abs(timeInfo.minutesRemaining)} min`
                            : `${timeInfo?.minutesRemaining} minutes left`}
                        </p>
                      </div>
                    </div>

                    {timeInfo?.isOverdue && (
                      <div className="bg-red-100 border border-red-200 rounded-md p-3 mb-4">
                        <div className="flex items-start">
                          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-2" />
                          <div className="text-sm text-red-800">
                            <p className="font-medium">Item Overdue</p>
                            <p>
                              This item was not claimed within 30 minutes. Please claim it now or
                              contact warehouse.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {timeInfo?.isUrgent && !timeInfo.isOverdue && (
                      <div className="bg-orange-100 border border-orange-200 rounded-md p-3 mb-4">
                        <div className="flex items-start">
                          <Clock className="w-5 h-5 text-orange-600 mt-0.5 mr-2" />
                          <div className="text-sm text-orange-800">
                            <p className="font-medium">Urgent - Claim Soon</p>
                            <p>You have less than 5 minutes to claim this item.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="ml-6">
                    <button
                      onClick={() => handleClaim(request.id)}
                      disabled={claimingId === request.id}
                      className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white transition-colors ${
                        timeInfo?.isOverdue
                          ? 'bg-red-600 hover:bg-red-700'
                          : timeInfo?.isUrgent
                          ? 'bg-orange-600 hover:bg-orange-700'
                          : 'bg-blue-600 hover:bg-blue-700'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {claimingId === request.id ? (
                        <>
                          <LoadingSpinner size="sm" />
                          <span className="ml-2">Claiming...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Claim Item
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Package className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
          <div className="text-sm text-blue-800">
            <h4 className="font-medium mb-2">Claiming Instructions:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Items must be claimed within 30 minutes of being issued.</li>
              <li>Click “Claim Item” to confirm you’ve received the material.</li>
              <li>Overdue items will trigger alerts for managerial review.</li>
              <li>Contact warehouse immediately if you can’t find your item.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaimInventory;
