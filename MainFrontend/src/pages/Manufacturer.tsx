import React, { useEffect, useState } from 'react';
import { manufacturerAPI } from '../utils/api';
import { Plus, X } from 'lucide-react';

interface Manufacturer {
  _id?: string;
  name: string;
  email: string;
  address: string;
}

const ManufacturerPage: React.FC = () => {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Manufacturer>({ name: '', email: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchManufacturers = async () => {
    try {
      const res = await manufacturerAPI.getAll();
      setManufacturers(res.data.manufacturers || []);
    } catch (err) {
      console.error('❌ Error fetching manufacturers', err);
    }
  };

  useEffect(() => {
    fetchManufacturers();
  }, []);

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.address) {
      setError('All fields are required');
      return;
    }

    setLoading(true);
    try {
      await manufacturerAPI.add(form);
      setForm({ name: '', email: '', address: '' });
      setError('');
      setShowModal(false);
      fetchManufacturers();
    } catch (err) {
      setError('Failed to add manufacturer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manufacturers</h1>
        <button
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
          onClick={() => setShowModal(true)}
        >
          <Plus size={18} /> Add Manufacturer
        </button>
      </div>

      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Address</th>
            </tr>
          </thead>
          <tbody>
            {manufacturers.map((mfr) => (
              <tr key={mfr._id} className="border-t">
                <td className="px-4 py-2">{mfr.name}</td>
                <td className="px-4 py-2">{mfr.email}</td>
                <td className="px-4 py-2">{mfr.address}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
            >
              <X />
            </button>
            <h2 className="text-xl font-semibold mb-4">Add Manufacturer</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                disabled={loading}
                onClick={handleSubmit}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                {loading ? 'Saving...' : 'Add Manufacturer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManufacturerPage;
