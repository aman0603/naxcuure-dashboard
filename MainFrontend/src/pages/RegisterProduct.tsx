import React, { useEffect, useState } from 'react';
import { productAPI, manufacturerAPI } from '../utils/api';
import { toast } from 'react-hot-toast';

interface Option {
  _id: string;
  label: string;
}

const RegisterProduct: React.FC = () => {
  const [products, setProducts] = useState<Option[]>([]);
  const [manufacturers, setManufacturers] = useState<Option[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Option[]>([]);
  const [filteredManufacturers, setFilteredManufacturers] = useState<Option[]>([]);

  const [productInput, setProductInput] = useState('');
  const [manufacturerInput, setManufacturerInput] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedManufacturer, setSelectedManufacturer] = useState('');

  const [country, setCountry] = useState('');
  const [registrationDate, setRegistrationDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [reminderDays, setReminderDays] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);

  const departments = [
    'Quality Assurance', 'Quality Control', 'Microbiology', 'Engineering', 'Production', 'Warehouse',
    'Packing', 'Information Technology', 'Human Resource and Administration',
    'Formulation and Development', 'Regulatory Affairs', 'Housekeeping',
    'Environment Health and Safety', 'General Management'
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const prodRes = await productAPI.getAll(1);
        const manuRes = await manufacturerAPI.getAll();

        const prods = (prodRes.data.products || []).map(p => ({
          _id: p._id,
          label: `${p.name} (${p.composition})`
        }));

        const manus = (manuRes.data.manufacturers || []).map(m => ({
          _id: m._id,
          label: `${m.name} (${m.email})`
        }));

        setProducts(prods);
        setManufacturers(manus);
        setFilteredProducts(prods);
        setFilteredManufacturers(manus);
      } catch {
        toast.error('❌ Failed to load data');
      }
    };
    fetchData();
  }, []);

  // Handlers for dropdown filtering
  const handleProductSearch = (value: string) => {
    setProductInput(value);
    setFilteredProducts(products.filter(p => p.label.toLowerCase().includes(value.toLowerCase())));
  };

  const handleManufacturerSearch = (value: string) => {
    setManufacturerInput(value);
    setFilteredManufacturers(manufacturers.filter(m => m.label.toLowerCase().includes(value.toLowerCase())));
  };

  const handleSubmit = async () => {
    if (!selectedProduct || !selectedManufacturer || !country || !registrationDate || !expiryDate || !reminderDays || !department) {
      toast.error('Please fill all fields');
      return;
    }

    const manufacturer = manufacturers.find(m => m._id === selectedManufacturer);
    if (!manufacturer) return toast.error('Invalid manufacturer');

    setLoading(true);
    try {
      await productAPI.addManufacturerAndRegistration(selectedProduct, {
        manufacturerName: manufacturer.label.split(' (')[0],
        manufacturerEmail: manufacturer.label.split('(')[1]?.replace(')', '') || '',
        manufacturerAddress: 'N/A', // or load it dynamically if needed
        registration: {
          country,
          registrationNumber: `REG-${Date.now()}`,
          issueDate: registrationDate,
          expiryDate,
          reminderDays: Number(reminderDays),
          department
        }
      });

      toast.success('✅ Registration added');
      setProductInput('');
      setManufacturerInput('');
      setSelectedProduct('');
      setSelectedManufacturer('');
      setCountry('');
      setRegistrationDate('');
      setExpiryDate('');
      setReminderDays('');
      setDepartment('');
    } catch (err) {
      toast.error('❌ Failed to register product');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-semibold text-orange-600 mb-6">Register Product in Country</h2>

      <div className="space-y-4">
        {/* 🔍 Search + Select Product */}
        <div>
          <input
            type="text"
            placeholder="Search and select product..."
            className="w-full border px-3 py-2 rounded"
            value={productInput}
            onChange={(e) => handleProductSearch(e.target.value)}
          />
          {productInput && (
            <ul className="bg-white border rounded max-h-40 overflow-auto mt-1">
              {filteredProducts.map(p => (
                <li
                  key={p._id}
                  onClick={() => {
                    setSelectedProduct(p._id);
                    setProductInput(p.label);
                    setFilteredProducts([]);
                  }}
                  className="px-3 py-2 hover:bg-orange-100 cursor-pointer"
                >
                  {p.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 🔍 Search + Select Manufacturer */}
        <div>
          <input
            type="text"
            placeholder="Search and select manufacturer..."
            className="w-full border px-3 py-2 rounded"
            value={manufacturerInput}
            onChange={(e) => handleManufacturerSearch(e.target.value)}
          />
          {manufacturerInput && (
            <ul className="bg-white border rounded max-h-40 overflow-auto mt-1">
              {filteredManufacturers.map(m => (
                <li
                  key={m._id}
                  onClick={() => {
                    setSelectedManufacturer(m._id);
                    setManufacturerInput(m.label);
                    setFilteredManufacturers([]);
                  }}
                  className="px-3 py-2 hover:bg-orange-100 cursor-pointer"
                >
                  {m.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        <input
          type="text"
          className="w-full border px-3 py-2 rounded"
          placeholder="Country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <input
            type="date"
            className="w-full border px-3 py-2 rounded"
            value={registrationDate}
            onChange={(e) => setRegistrationDate(e.target.value)}
          />
          <input
            type="date"
            className="w-full border px-3 py-2 rounded"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
          />
        </div>

        <input
          type="number"
          className="w-full border px-3 py-2 rounded"
          placeholder="Reminder Days (e.g., 30)"
          value={reminderDays}
          onChange={(e) => setReminderDays(e.target.value)}
        />

        <select
          className="w-full border px-3 py-2 rounded"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        >
          <option value="">Select Department</option>
          {departments.map(dep => (
            <option key={dep} value={dep}>{dep}</option>
          ))}
        </select>

        <button
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded font-semibold"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Register Product'}
        </button>
      </div>
    </div>
  );
};

export default RegisterProduct;
