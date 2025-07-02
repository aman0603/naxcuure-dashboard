import axios from 'axios';

// 🔧 Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'development' ? 'http://localhost:5001/api' : '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🔐 Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🚫 Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ================================
// ✅ Auth API
// ================================
export const authAPI = {
  login: (empCode: string, password: string) =>
    api.post('/auth/login', { empCode, password }),

  updatePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/update-password', { currentPassword, newPassword }),

  getProfile: () => api.get('/auth/profile'),
};

// ================================
// 📦 Inventory API
// ================================
export const inventoryAPI = {
  // 🔽 Requests
  createRequest: (data) => api.post('/inventory/request', data),
  getMyRequests: () => api.get('/inventory/requests?me=true'),
  getDepartmentRequests: (params) => api.get('/inventory/requests/department', { params }),
  getIssuedRequests: () => api.get('/inventory/requests?status=issued&me=true'),
  getAllRequests: (params) => api.get('/inventory/requests', { params: { all: true, ...params } }),
  getApprovedRequests: () => api.get('/inventory/requests/pending-issuance'),
  getPastUsage: (userId, item) => api.get('/inventory/requests/usage', { params: { userId, item } }),

  // ⚙️ Actions
  approveRequest: (id, comments) => api.put(`/inventory/approve/${id}`, { comments }),
  rejectRequest: (id, reason) => api.put(`/inventory/reject/${id}`, { reason }),
  issueRequest: (id, data) => api.put(`/inventory/issue/${id}`, data),
  claimRequest: (id) => api.put(`/inventory/claim/${id}`),

  // 📦 Stock Management
  getStock: () => api.get('/inventory/status'), // all batches
  addStock: (data) => api.post('/inventory/stock', data),
  updateStock: (batchId, data) => api.put(`/inventory/stock/${batchId}`, data),
  deleteStock: (batchId) => api.delete(`/inventory/stock/${batchId}`),
  getStockByItem: (itemName) => api.get('/inventory/stock/by-item', { params: { item: itemName } }),

  // 🔍 Items & Batches
  getItems: () => api.get('/inventory/items'),
  getBatches: (itemId) => api.get(`/inventory/items/${itemId}/batches`),
  getIssuedHistory: () => api.get('/inventory/history/issued'),

  // 🚨 Alerts
  getAlerts: () => api.get('/inventory/alerts'),
};

// ================================
// 📄 Certificate API
// ================================
export const certificateAPI = {
  getAll: () => api.get('/certificates'),

  add: (formData: FormData) =>
    api.post('/certificates/add', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  preview: (id: string) => api.get(`/certificates/${id}/preview`),
  download: (id: string) => api.get(`/certificates/${id}/download`),

  // ✅ Check if GMP Compliant
  checkGMP: () => api.get('/certificates/gmp-compliance'),

  // 🔔 Get Renewal Alerts
  getRenewalAlerts: () => api.get('/certificates/renewal-alerts'),
  getCurrent: () => api.get('/certificates/current'),
  getExpired: () => api.get('/certificates/expired'),
};

// ================================
// 💊 Product API
// ================================
export const productAPI = {
  getAll: (page: number = 1) => api.get(`/products?page=${page}`),

  add: (data) => api.post('/products/add', data), // ✅ FIXED

  addManufacturerAndRegistration: (productId: string, data: any) =>
    api.post(`/products/${productId}/add-manufacturer`, data), // ✅ FIXED to match route

  getExpiring: () => api.get('/products/expiring'),

  updateRegistration: (productId: string, registrationId: string, data: any) =>
    api.put(`/products/${productId}/registration/${registrationId}`, data),

  getFiltered: (params: any) => api.get('/products/filtered', { params }) // ✅ Optional if used
};

// ================================
// 🏭 Manufacturer API
// ================================
// ✅ In api.ts
export const manufacturerAPI = {
  add: (data: any) => api.post('/manufacturers/add', data),
  getAll: () => api.get('/manufacturers'),
};


export const userAPI = {
  // 👤 User Operations
  addUser: (data) => api.post('/users/add-user', data),
  getAllUsers: (params = {}) => api.get('/users/all-users', { params }),

  // 📊 Leave Summary (role-checked by backend)
  getLeaveSummary: (userId: string, year?: string) =>
    api.get(`/users/${userId}/leave-summary`, {
      params: year ? { year } : {}
    }),
getAllUsersRaw: (params = {}) => api.get('/users/all-users-raw', { params }), // ✅ added

  // 📝 Leave Requests
  applyLeave: (data) => api.post('/users/apply-leave', data),
  approveOrRejectLeave: (leaveId: string, payload: { decision: string; remarks?: string }) =>
    api.put(`/users/leave/${leaveId}/decision`, payload),
};

// ================================
// 📅 Holiday Management API
// ================================
export const holidayAPI = {
  // 📅 Get all holidays (public or authenticated)
  getAll: () => api.get('/holidays'),

  // ➕ Add a holiday (requires role: President Operations, Director, or HR Manager)
  add: (data: { name: string; date: string }) => api.post('/holidays', data),

  // ✏️ Update a holiday (same role restriction)
  update: (id: string, data: { name: string; date: string }) =>
    api.put(`/holidays/${id}`, data),

  // ❌ Delete a holiday (same role restriction)
  delete: (id: string) => api.delete(`/holidays/${id}`),
};

// ================================
// 📈 Performance Evaluation API
// ================================
export const performanceAPI = {
  // 📝 Submit marks (monthly or quarterly)
  giveMarks: (data: {
    evaluateeId: string;
    criteriaMarks: { [key: string]: number };
  }) => api.post('/performance/give', data),

  // 👁️ View your own marks
  getMyMarks: () => api.get('/performance/my-marks'),

  // 📊 Admin view all performance records
  getAllSummary: () => api.get('/performance/summary'),
};

// ================================
// 📜 SOP API
// ================================
export const sopAPI = {
  getAllSOPs: () => api.get('/sops'),
  getSOPById: (id: string) => api.get(`/sops/${id}`),
  uploadSOP: (data: any) => api.post('/sops', data),
  updateSOP: (id: string, data: any) => api.put(`/sops/${id}`, data),
  deleteSOP: (id: string) => api.delete(`/sops/${id}`),
  downloadSOP: (id: string) => api.get(`/sops/${id}/download`),
} 
