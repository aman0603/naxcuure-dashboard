// ✅ Alert.tsx with Requester Info, Unit, Department & Filter Dropdowns
import React, { useEffect, useState } from 'react';
import { AlertTriangle, SearchSlash, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { inventoryAPI } from '../utils/api';
import { utils, writeFile } from 'xlsx';

interface AlertItem {
  itemName: string;
  unit: string;
  totalAvailable: number;
  status: string;
  requestedBy: {
    name: string;
    empCode: string;
    department: string;
  };
}

const Alert: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('All');
  const [searchDept, setSearchDept] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchEmpCode, setSearchEmpCode] = useState('');
  const [searchItem, setSearchItem] = useState('');
  const itemsPerPage = 10;

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const response = await inventoryAPI.getAlerts();
      setAlerts(response.data.alerts || []);
    } catch (err) {
      setError('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const getBadge = (status: string) => {
    if (status.includes('🔴')) return 'bg-red-100 text-red-700';
    if (status.includes('🟠')) return 'bg-yellow-100 text-yellow-800';
    if (status.includes('🆕')) return 'bg-blue-100 text-blue-700';
    return 'bg-green-100 text-green-700';
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesStatus = filter === 'All' || alert.status.includes(filter);
    const matchesDept = !searchDept || alert.requestedBy?.department?.toLowerCase().includes(searchDept.toLowerCase());
    const matchesName = !searchName || alert.requestedBy?.name?.toLowerCase().includes(searchName.toLowerCase());
    const matchesEmpCode = !searchEmpCode || alert.requestedBy?.empCode?.toLowerCase().includes(searchEmpCode.toLowerCase());
    const matchesItem = !searchItem || alert.itemName.toLowerCase().includes(searchItem.toLowerCase());
    return matchesStatus && matchesDept && matchesName && matchesEmpCode && matchesItem;
  });

  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage);
  const paginatedAlerts = filteredAlerts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExport = () => {
    const worksheet = utils.json_to_sheet(filteredAlerts);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Alerts');
    writeFile(workbook, 'inventory-alerts.xlsx');
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center">
          <AlertTriangle className="w-6 h-6 mr-2 text-red-600" /> Inventory Alerts
        </h1>
        <button
          onClick={handleExport}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
        >
          Export to Excel
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <select
          value={filter}
          onChange={e => { setFilter(e.target.value); setCurrentPage(1); }}
          className="border px-2 py-1 rounded text-sm w-full"
        >
          <option value="All">🔍 Filter by Status</option>
          <option value="🔴">🔴 Out of Stock</option>
          <option value="🟠">🟠 Low Stock</option>
          <option value="🆕">🆕 Requested</option>
        </select>

        <input
          type="text"
          placeholder="Search Item Name"
          value={searchItem}
          onChange={e => { setSearchItem(e.target.value); setCurrentPage(1); }}
          className="border px-3 py-1 rounded text-sm w-full"
        />

        <input
          type="text"
          placeholder="Search Requester Name"
          value={searchName}
          onChange={e => { setSearchName(e.target.value); setCurrentPage(1); }}
          className="border px-3 py-1 rounded text-sm w-full"
        />

        <input
          type="text"
          placeholder="Search Emp Code / Dept"
          value={searchEmpCode}
          onChange={e => { setSearchEmpCode(e.target.value); setCurrentPage(1); }}
          className="border px-3 py-1 rounded text-sm w-full"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-gray-600">Loading alerts...</div>
      ) : filteredAlerts.length === 0 ? (
        <div className="flex items-center text-gray-500">
          <SearchSlash className="w-5 h-5 mr-2" /> No alerts found.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border rounded-md shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Item Name</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Unit</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Available</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Requested By</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Department</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedAlerts.map((alert, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 text-sm text-gray-800">{alert.itemName}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{alert.unit}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{alert.totalAvailable}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getBadge(alert.status)}`}>
                        {alert.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {alert.requestedBy?.name} ({alert.requestedBy?.empCode})
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {alert.requestedBy?.department || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex space-x-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Alert;