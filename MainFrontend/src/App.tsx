import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/common/Layout';
import ProductList from './pages/ProductList';
import Manufacturer from './pages/Manufacturer';

// Pages
import AddProduct from './pages/AddProduct';
import RegisterProduct from './pages/RegisterProduct';
import GiveMarksPage from './pages/GiveMarksPage';
import HolidayPage from './pages/HolidayPage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RequestInventory from './pages/RequestInventory';
import MyRequests from './pages/MyRequests';
import CertificateVault from './pages/CertificateVault';
import UserManagement from './pages/UserManagement';
import UpdatePassword from './pages/UpdatePassword';
import DepartmentRequests from './pages/DepartmentRequests';
import AddUserPage from './pages/AddUserPage';
import DirectorDashboard from './pages/DirectorDashboard';
import IssueInventory from './pages/IssueInventory';
import StockOverview from './pages/StockOverview';
import ClaimInventory from './pages/ClaimInventory';
import Alert from './pages/Alert';
import SOPPage from './pages/SOPPage';
import SOPRequestsPage from './pages/SOPRequestsPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="request-inventory" element={<RequestInventory />} />
            <Route path="my-requests" element={<MyRequests />} />
            <Route path="update-password" element={<UpdatePassword />} />
            <Route path="claim-inventory" element={<ClaimInventory />} />
            
            {/* Role-specific routes */}
            <Route 
              path="department-requests" 
              element={
                <ProtectedRoute allowedRoles={['Head', 'Manager']}>
                  <DepartmentRequests />
                </ProtectedRoute>
              } 
            />
          <Route
  path="issue-inventory"
  element={
    <ProtectedRoute
      allowedRoles={['Head']}
      customCheck={(user) => user.departments.includes("Warehouse")}
    >
      <IssueInventory />
    </ProtectedRoute>
  }
/>

<Route
  path="director-dashboard"
  element={
    <ProtectedRoute allowedRoles={['Director']}>
      <DirectorDashboard />
    </ProtectedRoute>
  }
/>


            
            {/* Placeholder routes for future implementation */}
         <Route
  path="stock"
  element={
    <ProtectedRoute
      allowedRoles={['President Operations', 'Director', 'Head']}
      customCheck={(user) =>
        user.role === 'President Operations' ||
        user.role === 'Director' ||
        (user.role === 'Head' && user.departments?.includes('Warehouse'))
      }
    >
      <StockOverview />
    </ProtectedRoute>
  }
/>
<Route
  path="certification-vault"
  element={
    <ProtectedRoute allowedRoles={['Director', 'President Operations']}>
      <CertificateVault />
    </ProtectedRoute>
  }
/>

<Route
  path="holidays"
  element={
    <ProtectedRoute
    >
      <HolidayPage />
    </ProtectedRoute>
  }
/>


<Route
  path="add-product"
  element={
    <ProtectedRoute>
      <AddProduct />
    </ProtectedRoute>
  }
/>

<Route
  path="add-user"
  element={
    <ProtectedRoute allowedRoles={['Director', 'HR']}>
      <AddUserPage />
    </ProtectedRoute>
  }
/>
<Route
  path="user-management"
  element={
    <ProtectedRoute
      allowedRoles={['Director', 'President Operations', 'Head']}
      customCheck={(user) =>
        ['HR Manager', 'Quality Head', 'Plant Head'].includes(user.designation) ||
        user.role === 'Head'
      }
    >
      <UserManagement />
    </ProtectedRoute>
  }
/>


<Route
  path="register-product"
  element={
    <ProtectedRoute>
      <RegisterProduct />
    </ProtectedRoute>
  }
/>

<Route
  path="product-list"
  element={
    <ProtectedRoute>
      <ProductList />
    </ProtectedRoute>
  }
/>

<Route
  path="give-marks"
  element={
    <ProtectedRoute allowedRoles={['Staff', 'Head', 'Plant Head', 'Quality Head']}>
      <GiveMarksPage />
    </ProtectedRoute>
  }
/>

<Route
  path="manufacturers"
  element={
    <ProtectedRoute>
      <Manufacturer />
    </ProtectedRoute>
  }
/>

<Route
  path="alerts"
  element={
    <ProtectedRoute
      allowedRoles={['Director', 'President Operations', 'Head']}
      customCheck={(user) =>
        user.role === 'Director' ||
        user.role === 'President Operations' ||
        (user.role === 'Head' &&
          ['Warehouse', 'QA', 'Quality Assurance', 'Production', 'Plant'].some(dep =>
            user.departments?.includes(dep)
          ))
      }
    >
      <Alert />
    </ProtectedRoute>
  }
/>

<Route
  path="sops"
  element={
    <ProtectedRoute>
      <SOPPage />
    </ProtectedRoute>
  }
/>
<Route
  path="sop-requests"
  element={
    <ProtectedRoute allowedRoles={['Director', 'President Operations']}>
      <SOPRequestsPage />
    </ProtectedRoute>
  }
/>

            <Route path="all-requests" element={<div className="p-8 text-center text-gray-500">All Requests - Coming Soon</div>} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
