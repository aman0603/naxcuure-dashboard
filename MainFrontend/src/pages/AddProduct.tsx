import React, { useState } from 'react';
import { productAPI } from '../utils/api';

const AddProduct: React.FC = () => {
  const [form, setForm] = useState({
    name: '',
    type: '',
    composition: '',
    strength: '',
    shelfLife: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const res = await productAPI.add({
        ...form,
        countries: [] // initially empty, we'll add later
      });
      setSuccess(`✅ Product created: ${res.data.product.name}`);
    } catch (err: any) {
      console.error('❌ Add Product Error:', err);
      alert(err.response?.data?.message || 'Error adding product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white shadow rounded">
      <h2 className="text-xl font-semibold mb-4">Add New Product</h2>

      <div className="space-y-4">
        {['name', 'type', 'composition', 'strength', 'shelfLife'].map((field) => (
          <input
            key={field}
            type="text"
            name={field}
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
            value={(form as any)[field]}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        ))}

        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Add Product'}
        </button>

        {success && <p className="text-green-600 mt-2">{success}</p>}
      </div>
    </div>
  );
};

export default AddProduct;
