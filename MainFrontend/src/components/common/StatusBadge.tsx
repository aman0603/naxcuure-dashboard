import React from 'react';

interface StatusBadgeProps {
  status: 'Pending' | 'Approved' | 'Issued' | 'Claimed' | 'Rejected';
  size?: 'sm' | 'md';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Approved':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Issued':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Claimed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${getStatusColor(
        status
      )} ${sizeClasses}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
