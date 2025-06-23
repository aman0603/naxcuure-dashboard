import React, { useEffect, useState } from 'react';
import { productAPI } from '../utils/api';
import * as XLSX from 'xlsx';
import { Save } from 'lucide-react';
import Modal from '../components/common/Modal';

interface Manufacturer {
  name: string;
  email: string;
  address: string;
}

interface Registration {
  _id: string;
  country: string;
  registrationNumber: string;
  issueDate: string;
  expiryDate: string;
  documentUrl: string;
  department: string;
  reminderDays: number;
}

interface Product {
  _id: string;
  name: string;
  type: string;
  composition: string;
  strength: string;
  shelfLife: string;
  countries: string[];
  manufacturers: Manufacturer[];
  registrations: Registration[];
}

interface ProductCountryView {
  _id: string;
  name: string;
  type: string;
  composition: string;
  strength: string;
  shelfLife: string;
  country: string;
  manufacturers: Manufacturer[];
  registrations: Registration[];
  parent: Product;
}

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [viewData, setViewData] = useState<ProductCountryView[]>([]);
  const [search, setSearch] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterManufacturer, setFilterManufacturer] = useState('');
  const [expiryFilter, setExpiryFilter] = useState('');
  const [selected, setSelected] = useState<ProductCountryView | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    productAPI.getAll().then(res => {
      setProducts(res.data.products);
    });
  }, []);

  useEffect(() => {
    const now = new Date();
    const rows: ProductCountryView[] = [];

    for (const p of products) {
      const matchedRegs = p.registrations.filter(r => {
        const matchCountry = filterCountry
          ? r.country.toLowerCase().includes(filterCountry.toLowerCase())
          : true;
        const matchExpiry =
          expiryFilter === 'soon'
            ? Math.floor((new Date(r.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) <= r.reminderDays
            : expiryFilter === 'far'
              ? Math.floor((new Date(r.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) > r.reminderDays
              : true;
        return matchCountry && matchExpiry;
      });

      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchManufacturer = filterManufacturer
        ? p.manufacturers.some(m =>
            m.name.toLowerCase().includes(filterManufacturer.toLowerCase())
          )
        : true;

      if (matchSearch && matchManufacturer) {
        for (const reg of matchedRegs) {
          rows.push({
            _id: p._id,
            name: p.name,
            type: p.type,
            composition: p.composition,
            strength: p.strength,
            shelfLife: p.shelfLife,
            country: reg.country,
            manufacturers: p.manufacturers,
            registrations: [reg],
            parent: p
          });
        }
      }
    }

    setViewData(rows);
  }, [products, search, filterCountry, filterManufacturer, expiryFilter]);

  const exportToExcel = () => {
    const data = viewData.map(p => ({
      Name: p.name,
      Type: p.type,
      Composition: p.composition,
      Strength: p.strength,
      ShelfLife: p.shelfLife,
      Country: p.country,
      Manufacturers: p.manufacturers.map(m => m.name).join(', '),
      Registration: p.registrations[0]?.registrationNumber,
      Expiry: new Date(p.registrations[0]?.expiryDate).toLocaleDateString(),
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, 'ProductList.xlsx');
  };

  return (
    <div className="p-6">
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <input
          type="text"
          placeholder="🔍 Search by name"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border px-3 py-2 rounded w-60"
        />
        <input
          type="text"
          placeholder="🌍 Filter by country"
          value={filterCountry}
          onChange={e => setFilterCountry(e.target.value)}
          className="border px-3 py-2 rounded w-60"
        />
        <input
          type="text"
          placeholder="🏭 Filter by manufacturer"
          value={filterManufacturer}
          onChange={e => setFilterManufacturer(e.target.value)}
          className="border px-3 py-2 rounded w-60"
        />
        <select
          value={expiryFilter}
          onChange={e => setExpiryFilter(e.target.value)}
          className="border px-3 py-2 rounded w-48"
        >
          <option value="">⏳ Expiry Filter</option>
          <option value="soon">Expiring Soon</option>
          <option value="far">Valid</option>
        </select>
        <button
          onClick={exportToExcel}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Export Excel
        </button>
      </div>

      <div className="overflow-auto max-h-[70vh] border rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200 bg-white">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Name</th>
              <th className="px-4 py-2 text-sm">Country</th>
              <th className="px-4 py-2 text-sm">Type</th>
              <th className="px-4 py-2 text-sm">Manufacturer</th>
              <th className="px-4 py-2 text-sm">Expiry</th>
              <th className="px-4 py-2 text-sm">Action</th>
            </tr>
          </thead>
          <tbody>
            {viewData.map((p, idx) => (
              <tr key={idx} className="hover:bg-gray-50 border-b">
                <td className="px-4 py-2">{p.name}</td>
                <td className="px-4 py-2">{p.country}</td>
                <td className="px-4 py-2">{p.type}</td>
                <td className="px-4 py-2">{p.manufacturers.map(m => m.name).join(', ')}</td>
                <td className="px-4 py-2">{new Date(p.registrations[0].expiryDate).toLocaleDateString()}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => {
                      setSelected(p);
                      setModalOpen(true);
                    }}
                    className="text-blue-600 hover:underline"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
            {viewData.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-6">
                  No products match the filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && selected && (
        <Modal title={`${selected.name} (${selected.country})`} onClose={() => setModalOpen(false)}>
          <div className="space-y-2 text-sm">
            <p><strong>Type:</strong> {selected.type}</p>
            <p><strong>Composition:</strong> {selected.composition}</p>
            <p><strong>Strength:</strong> {selected.strength}</p>
            <p><strong>Shelf Life:</strong> {selected.shelfLife}</p>

            <p><strong>Manufacturer(s):</strong></p>
            <ul className="list-disc ml-6">
              {selected.manufacturers.map((m, i) => (
                <li key={i}>{m.name} ({m.email})</li>
              ))}
            </ul>

            <p><strong>Registration:</strong></p>
            {selected.registrations.map((r, i) => (
              <div key={i} className="ml-4">
                <p><strong>Country:</strong> {r.country}</p>
                <p><strong>Registration Number:</strong> {r.registrationNumber}</p>
                <p><strong>Department:</strong> {r.department}</p>
                <p><strong>Expiry:</strong> {new Date(r.expiryDate).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ProductList;
