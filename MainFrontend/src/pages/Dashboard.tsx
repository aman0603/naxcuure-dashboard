import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-bold text-orange-600">Dashboard</h1>
      {user ? (
        <p className="text-gray-600">
          Welcome back, <span className="font-semibold">{user.name}</span> (
          <span className="italic text-blue-600">{user.designation}</span>)
        </p>
      ) : (
        <p className="text-gray-500">Loading user information...</p>
      )}
    </div>
  );
};

export default Dashboard;
