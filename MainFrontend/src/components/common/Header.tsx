import React from 'react';
import { LogOut, Settings } from 'lucide-react';
import  useAuth  from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-blue-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-end">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/update-password')}
            className="p-2 text-blue-500 hover:text-orange-500 transition-colors"
            title="Update Password"
          >
            <Settings className="w-5 h-5" />
          </button>

          <button
            onClick={handleLogout}
            className="p-2 text-blue-500 hover:text-red-600 transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
