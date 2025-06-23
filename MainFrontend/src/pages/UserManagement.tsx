import React, { useEffect, useState } from 'react';
import { userAPI } from '../utils/api';
import * as XLSX from 'xlsx';
import { ArrowDown, ArrowUp } from 'lucide-react';

const allDesignations = [/* ...same as before... */];
const allDepartments = [/* ...same as before... */];

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [designationSearch, setDesignationSearch] = useState('');
  const [departmentSuggestions, setDepartmentSuggestions] = useState<string[]>([]);
  const [designationSuggestions, setDesignationSuggestions] = useState<string[]>([]);
  const [showDeptSuggestions, setShowDeptSuggestions] = useState(false);
  const [showDesigSuggestions, setShowDesigSuggestions] = useState(false);
  const [exportDepartment, setExportDepartment] = useState('All');
  const [exportDepartmentSearch, setExportDepartmentSearch] = useState('');
  const [exportSuggestions, setExportSuggestions] = useState<string[]>([]);
  const [showExportSuggestions, setShowExportSuggestions] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = async () => {
    try {
      const res = await userAPI.getAllUsers({ department, designation, page, limit, sortBy, sortOrder });
      setUsers(res.data.users);
      setTotalPages(res.data.pages);
    } catch (err) {
      console.error('❌ Failed to fetch users', err);
    }
  };

  useEffect(() => { fetchUsers(); }, [department, designation, page, sortBy, sortOrder]);

  useEffect(() => {
    if (departmentSearch) {
      const matches = allDepartments.filter(d => d.toLowerCase().includes(departmentSearch.toLowerCase()));
      setDepartmentSuggestions(matches);
      setShowDeptSuggestions(true);
    } else {
      setDepartmentSuggestions([]);
      setShowDeptSuggestions(false);
      setDepartment('');
    }
  }, [departmentSearch]);

  useEffect(() => {
    if (designationSearch) {
      const matches = allDesignations.filter(d => d.toLowerCase().includes(designationSearch.toLowerCase()));
      setDesignationSuggestions(matches);
      setShowDesigSuggestions(true);
    } else {
      setDesignationSuggestions([]);
      setShowDesigSuggestions(false);
      setDesignation('');
    }
  }, [designationSearch]);

  useEffect(() => {
    if (exportDepartmentSearch && exportDepartmentSearch !== 'All') {
      const matches = allDepartments.filter(d => d.toLowerCase().includes(exportDepartmentSearch.toLowerCase()));
      setExportSuggestions(matches);
      setShowExportSuggestions(true);
    } else {
      setExportSuggestions([]);
      setShowExportSuggestions(false);
      setExportDepartment('All');
    }
  }, [exportDepartmentSearch]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // ✅ Updated Export with Full Data Fetch
  const handleExport = async () => {
    try {
      const res = await userAPI.getAllUsersRaw({
        department: exportDepartment !== 'All' ? exportDepartment : undefined,
        sortBy,
        sortOrder
      });

      const dataToExport = res.data.users;

      const filtered = dataToExport.map(u => ({
        Name: u.name,
        Email: u.email,
        "Emp Code": u.empCode,
        Designation: u.designation,
        Departments: u.departments?.join(', '),
        "Total Leaves Taken": u.totalLeaves || 0
      }));

      const worksheet = XLSX.utils.json_to_sheet(filtered);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
      XLSX.writeFile(workbook, `UserData_${exportDepartment === 'All' ? 'All' : exportDepartment.replace(/ /g, '_')}.xlsx`);
    } catch (err) {
      console.error('❌ Export failed', err);
      alert('Failed to export users. Try again.');
    }
  };

  const getBadgeColor = (designation: string) => {
    if (designation.includes('Director')) return 'bg-red-100 text-red-700';
    if (designation.includes('Head')) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">👥 User Management</h2>

      <div className="flex flex-wrap gap-4 mb-4">
        {/* Searchable Department Filter */}
        <div className="relative">
          <input
            type="text"
            className="border px-3 py-2 rounded w-64"
            placeholder="Search Department"
            value={departmentSearch}
            onChange={(e) => setDepartmentSearch(e.target.value)}
            onFocus={() => setShowDeptSuggestions(true)}
            onBlur={() => setTimeout(() => setShowDeptSuggestions(false), 150)}
          />
          {showDeptSuggestions && departmentSuggestions.length > 0 && (
            <ul className="absolute bg-white border mt-1 w-64 max-h-48 overflow-y-auto z-10 rounded shadow">
              {departmentSuggestions.map((s, i) => (
                <li key={i} className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
                    onClick={() => { setDepartmentSearch(s); setDepartment(s); setShowDeptSuggestions(false); }}>
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Searchable Designation Filter */}
        <div className="relative">
          <input
            type="text"
            className="border px-3 py-2 rounded w-64"
            placeholder="Search Designation"
            value={designationSearch}
            onChange={(e) => setDesignationSearch(e.target.value)}
            onFocus={() => setShowDesigSuggestions(true)}
            onBlur={() => setTimeout(() => setShowDesigSuggestions(false), 150)}
          />
          {showDesigSuggestions && designationSuggestions.length > 0 && (
            <ul className="absolute bg-white border mt-1 w-64 max-h-48 overflow-y-auto z-10 rounded shadow">
              {designationSuggestions.map((s, i) => (
                <li key={i} className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
                    onClick={() => { setDesignationSearch(s); setDesignation(s); setShowDesigSuggestions(false); }}>
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Searchable Export Filter */}
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            className="border px-3 py-2 rounded w-64"
            placeholder="Export Department (or leave blank)"
            value={exportDepartmentSearch}
            onChange={(e) => setExportDepartmentSearch(e.target.value)}
            onFocus={() => setShowExportSuggestions(true)}
            onBlur={() => setTimeout(() => setShowExportSuggestions(false), 150)}
          />
          {showExportSuggestions && exportSuggestions.length > 0 && (
            <ul className="absolute bg-white border mt-1 w-64 max-h-48 overflow-y-auto z-10 rounded shadow">
              {exportSuggestions.map((s, i) => (
                <li key={i} className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
                    onClick={() => { setExportDepartmentSearch(s); setExportDepartment(s); setShowExportSuggestions(false); }}>
                  {s}
                </li>
              ))}
            </ul>
          )}
          <button
            onClick={handleExport}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Export to Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100 text-gray-700 font-semibold">
            <tr>
              {['name', 'email', 'empCode', 'designation', 'departments'].map(col => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="px-4 py-2 cursor-pointer text-left"
                >
                  {col.charAt(0).toUpperCase() + col.slice(1)}
                  {sortBy === col && (
                    sortOrder === 'asc'
                      ? <ArrowUp className="inline ml-1" />
                      : <ArrowDown className="inline ml-1" />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-2">{user.name}</td>
                <td className="px-4 py-2">{user.email}</td>
                <td className="px-4 py-2">{user.empCode}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 text-xs rounded ${getBadgeColor(user.designation)}`}>
                    {user.designation}
                  </span>
                </td>
                <td className="px-4 py-2">{user.departments?.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-4 gap-2">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50" disabled={page === 1}>Prev</button>
        <span className="px-2 py-1">{page} / {totalPages}</span>
        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50" disabled={page === totalPages}>Next</button>
      </div>
    </div>
  );
};

export default UserManagement;
