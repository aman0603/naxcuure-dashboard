import React from 'react';

interface UrgencyBadgeProps {
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  size?: 'sm' | 'md';
}

const UrgencyBadge: React.FC<UrgencyBadgeProps> = ({ urgency, size = 'md' }) => {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${getUrgencyColor(
        urgency
      )} ${sizeClasses}`}
    >
      {urgency}
    </span>
  );
};

export default UrgencyBadge;