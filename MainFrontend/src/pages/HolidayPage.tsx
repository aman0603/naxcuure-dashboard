import React, { useEffect, useState } from 'react';
import { holidayAPI, authAPI } from '../utils/api';

interface Holiday {
  _id: string;
  name: string;
  date: string;
  addedBy?: {
    name: string;
    designation: string;
  };
  createdAt: string;
}

const allowedRoles = ['President Operations', 'Director', 'HR Manager'];

const HolidayPage: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', date: '', id: '' });
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchUserAndData = async () => {
    try {
      const { data: user } = await authAPI.getProfile();
      setUserRole(user.designation);
      const { data } = await holidayAPI.getAll();
      setHolidays(data.holidays);
    } catch (err) {
      console.error('❌ Initialization failed:', err);
    }
  };

  useEffect(() => {
    fetchUserAndData();
  }, []);

  const isAllowed = allowedRoles.includes(userRole);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (form.id) {
        await holidayAPI.update(form.id, { name: form.name, date: form.date });
      } else {
        await holidayAPI.add({ name: form.name, date: form.date });
      }
      setForm({ name: '', date: '', id: '' });
      setShowModal(false);
      await fetchUserAndData();
    } catch (err) {
      console.error('❌ Holiday save error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (holiday: Holiday) => {
    setForm({
      name: holiday.name,
      date: holiday.date.slice(0, 10),
      id: holiday._id,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this holiday?')) return;
    try {
      await holidayAPI.delete(id);
      await fetchUserAndData();
    } catch (err) {
      console.error('❌ Holiday delete error:', err);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-orange-600">📅 Holiday Calendar</h1>
        {isAllowed && (
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2 bg-orange-600 text-white font-semibold rounded-md shadow hover:bg-orange-700 transition"
          >
            ➕ Add Holiday
          </button>
        )}
      </div>

      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full table-auto text-sm">
          <thead className="bg-gray-100 text-gray-700 font-semibold">
            <tr>
              <th className="px-4 py-3 text-left">Holiday</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Added By</th>
              <th className="px-4 py-3 text-left">Created On</th>
              {isAllowed && <th className="px-4 py-3 text-center">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {holidays.map((holiday) => (
              <tr key={holiday._id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3">{holiday.name}</td>
                <td className="px-4 py-3">{new Date(holiday.date).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-gray-700">
                  {holiday.addedBy?.name} <span className="text-xs text-gray-500">({holiday.addedBy?.designation})</span>
                </td>
                <td className="px-4 py-3">{new Date(holiday.createdAt).toLocaleDateString()}</td>
                {isAllowed && (
                  <td className="px-4 py-3 text-center space-x-2">
                    <button
                      onClick={() => handleEdit(holiday)}
                      className="text-blue-600 hover:underline"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(holiday._id)}
                      className="text-red-600 hover:underline"
                    >
                      🗑️ Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md animate-fadeIn">
            <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
              {form.id ? 'Edit Holiday' : 'Add Holiday'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Holiday Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g. Diwali"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HolidayPage;
