import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home, Plus, FileText, Users, Package, AlertTriangle, BarChart3, Folder,
  ChevronDown, ChevronRight, FileBadge, Factory, ListOrdered, Building2,
  ClipboardList, PlusCircle, Menu, X, Calendar as CalendarIcon
} from 'lucide-react';
import useAuth from '../../contexts/AuthContext';

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sopOpen, setSopOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [certsOpen, setCertsOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);

  const isDirectorOrPresident =
    user?.role === 'Director' || user?.role === 'President Operations';
  const dashboardPath = isDirectorOrPresident ? '/director-dashboard' : '/dashboard';

  const inventoryItems = [
    { path: '/request-inventory', icon: Plus, label: 'Request Inventory' },
    { path: '/my-requests', icon: FileText, label: 'My Requests' },
    ...(user?.role === 'Head' || user?.role === 'Manager'
      ? [{ path: '/department-requests', icon: Users, label: 'Department Requests' }]
      : []),
    ...(user?.role === 'Head' && user.department?.includes('Warehouse')
      ? [
          { path: '/issue-inventory', icon: Package, label: 'Issue Inventory' },
          { path: '/stock', icon: BarChart3, label: 'Stock Overview' }
        ]
      : []),
    ...(user?.role === 'Director'
      ? [{ path: '/director-dashboard', icon: BarChart3, label: 'Director Dashboard' }]
      : [])
  ];

  const showAlerts =
    ['Director', 'President Operations', 'Head'].includes(user?.role || '') ||
    (user?.role === 'Head' &&
    ['Warehouse', 'QA', 'Quality Assurance', 'Production', 'Plant'].some(dep =>
        user.department?.includes(dep)
      ));

  const productLinks = [
    { path: '/product-list', icon: ListOrdered, label: 'All Products' },
    { path: '/add-product', icon: PlusCircle, label: 'Add Product' },
    { path: '/register-product', icon: ClipboardList, label: 'Register Product' },
    { path: '/manufacturers', icon: Factory, label: 'Manufacturers' }
  ];

  const staffLinks =
    ['Director', 'President Operations'].includes(user?.role || '') ||
    ['HR Manager', 'Quality Head', 'Plant Head'].includes(user?.designation || '') ||
    user?.role === 'Head'
      ? [
          { path: '/add-user', icon: Building2, label: 'Add New User' },
          { path: '/user-management', icon: Users, label: 'User Management' },
        ]
      : [];

  // ✅ Only show if eligible for giving marks
  const canGiveMarks = ['Staff', 'Head', 'Plant Head', 'Quality Head'].includes(user?.role || '');

  const renderLinks = (links: any[]) => (
    <div className="ml-6 space-y-1">
      {links.map(item => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex items-center space-x-2 px-2 py-1 rounded-md text-sm transition ${
              isActive
                ? 'bg-orange-100 text-orange-700'
                : 'text-gray-600 hover:bg-blue-100 hover:text-blue-800'
            }`
          }
        >
          <item.icon className="w-4 h-4" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-orange-500 text-white rounded-lg shadow-lg"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'block' : 'hidden'
        } md:block fixed md:static top-0 left-0 h-full min-h-screen w-64 z-40 bg-white border-r border-orange-200 shadow-lg md:shadow-none flex flex-col`}
      >
        {/* Header */}
        <div className="p-6 border-b border-orange-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-orange-600">NAXCUURE HEALTHCARE</h2>
              <p className="text-xs text-blue-600">Inventory System</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-180px)]">
          {/* Dashboard */}
          <NavLink
            to={dashboardPath}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-orange-50 text-orange-700 border-r-4 border-orange-500'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
              }`
            }
          >
            <Home className="w-5 h-5" />
            <span>Dashboard</span>
          </NavLink>

          {/* Inventory */}
          <button
            onClick={() => setInventoryOpen(!inventoryOpen)}
            className="w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors"
          >
            {inventoryOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <Folder className="w-5 h-5" />
            <span>Inventory</span>
          </button>
          {inventoryOpen && renderLinks(inventoryItems)}

          {/* Alerts */}
          {showAlerts && (
            <>
              <button
                onClick={() => setAlertsOpen(!alertsOpen)}
                className="w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors"
              >
                {alertsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <AlertTriangle className="w-5 h-5" />
                <span>Alerts</span>
              </button>
              {alertsOpen &&
                renderLinks([{ path: '/alerts', icon: AlertTriangle, label: 'Inventory Alerts' }])}
            </>
          )}

          {/* Certificates */}
          {(user?.role === 'Director' || user?.role === 'President Operations') && (
            <>
              <button
                onClick={() => setCertsOpen(!certsOpen)}
                className="w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors"
              >
                {certsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <FileBadge className="w-5 h-5" />
                <span>Certificates</span>
              </button>
              {certsOpen &&
                renderLinks([{ path: '/certification-vault', icon: FileBadge, label: 'Certification Vault' }])}
            </>
          )}

          {/* SOP */}
          <button
            onClick={() => setSopOpen(!sopOpen)}
            className="w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors"
          >
            {sopOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <FileText className="w-5 h-5" />
            <span>SOPs</span>
          </button>
          {sopOpen && renderLinks([
            { path: '/sops', icon: FileText, label: 'View SOPs' },
            ...(user?.designation === 'Director' || user?.designation === 'President Operations'
              ? [{ path: '/sop-requests', icon: ClipboardList, label: 'View Requests' }]
              : [])
          ])}

          {/* Products */}
          <button
            onClick={() => setProductsOpen(!productsOpen)}
            className="w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors"
          >
            {productsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <Package className="w-5 h-5" />
            <span>Products</span>
          </button>
          {productsOpen && renderLinks(productLinks)}

          {/* Staff */}
          {staffLinks.length > 0 && (
            <>
              <button
                onClick={() => setStaffOpen(!staffOpen)}
                className="w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors"
              >
                {staffOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <Building2 className="w-5 h-5" />
                <span>Staff</span>
              </button>
              {staffOpen && renderLinks(staffLinks)}
            </>
          )}

          {/* Performance */}
          {canGiveMarks && (
            <>
              <h2 className="text-xs uppercase tracking-wide text-gray-500 px-3 mt-4 mb-1">Performance</h2>
              <div className="ml-3">
                {renderLinks([
                  { path: '/give-marks', icon: ClipboardList, label: 'Give Performance Marks' }
                ])}
              </div>
            </>
          )}

          {/* Holiday Calendar */}
          <h2 className="text-xs uppercase tracking-wide text-gray-500 px-3 mt-4 mb-1">Others</h2>
          <div className="ml-3">
            {renderLinks([{ path: '/holidays', icon: CalendarIcon, label: 'Holiday Calendar' }])}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-orange-200">
          <div className="bg-orange-50 rounded-lg p-3">
            <p className="text-xs text-orange-700 mb-1">Logged in as</p>
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-blue-600">{user?.role}</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
