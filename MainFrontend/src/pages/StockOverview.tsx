import React, { useState, useEffect, useRef } from 'react';
import { Plus, Boxes, Download, Printer } from 'lucide-react';
import { inventoryAPI } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';

const StockOverview: React.FC = () => {
  const printRef = useRef<HTMLDivElement>(null);
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [issuedHistory, setIssuedHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [searchStock, setSearchStock] = useState('');
  const [searchIssued, setSearchIssued] = useState('');

  const [stockPageSize, setStockPageSize] = useState(5);
  const [issuedPageSize, setIssuedPageSize] = useState(5);
  const [stockPage, setStockPage] = useState(1);
  const [issuedPage, setIssuedPage] = useState(1);

  const [issuedFrom, setIssuedFrom] = useState('');
  const [issuedTo, setIssuedTo] = useState('');
  const [filterDept, setFilterDept] = useState('all');

  const [formData, setFormData] = useState({
    itemName: '',
    batchId: '',
    quantity: '',
    unit: '',
    costPerUnit: '',
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const stockRes = await inventoryAPI.getStock();
      const flatStock = stockRes.data.flatMap((item: any) =>
        item.batches.map((batch: any) => ({
          itemName: item.itemName,
          unit: item.unit,
          batchId: batch.batchId,
          quantity: batch.quantity - batch.issued,
          costPerUnit: batch.rate,
        }))
      );
      setStockItems(flatStock);

      const issuedRes = await inventoryAPI.getIssuedHistory();
      setIssuedHistory(issuedRes.data.issued || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = async () => {
    try {
      const payload = {
        itemName: formData.itemName,
        batchId: formData.batchId,
        quantity: parseInt(formData.quantity),
        unit: formData.unit,
        rate: parseFloat(formData.costPerUnit),
      };
      await inventoryAPI.addStock(payload);
      setShowModal(false);
      setFormData({ itemName: '', batchId: '', quantity: '', unit: '', costPerUnit: '' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error adding stock');
    }
  };

  const exportCSV = (data: any[], fileName: string) => {
    const csv = Papa.unparse(data);
    saveAs(new Blob([csv]), fileName);
  };

  const filteredStock = stockItems.filter(item =>
    item.itemName.toLowerCase().includes(searchStock.toLowerCase()) ||
    item.batchId.toLowerCase().includes(searchStock.toLowerCase())
  );

  const filteredIssued = issuedHistory.filter(item => {
    if (filterDept !== 'all' && item.department !== filterDept) return false;
    const issuedDate = new Date(item.issuedAt);
    if (issuedFrom && issuedDate < new Date(issuedFrom)) return false;
    if (issuedTo && issuedDate > new Date(issuedTo)) return false;
    return (
      item.item.toLowerCase().includes(searchIssued.toLowerCase()) ||
      item.reason.toLowerCase().includes(searchIssued.toLowerCase()) ||
      item.requestedBy?.name.toLowerCase().includes(searchIssued.toLowerCase())
    );
  });

  const totalValue = filteredStock.reduce((sum, item) => sum + item.quantity * item.costPerUnit, 0);

  const paginatedStock = filteredStock.slice((stockPage - 1) * stockPageSize, stockPage * stockPageSize);
  const paginatedIssued = filteredIssued.slice((issuedPage - 1) * issuedPageSize, issuedPage * issuedPageSize);

  const printPage = () => {
    if (printRef.current) {
      const original = document.body.innerHTML;
      document.body.innerHTML = printRef.current.innerHTML;
      window.print();
      document.body.innerHTML = original;
      window.location.reload();
    }
  };

  return (
    <div className="p-6 space-y-6" ref={printRef}>
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Boxes /> Stock Overview</h1>
        <div className="flex gap-2">
          <button onClick={printPage} className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600">
            <Printer className="inline w-4 mr-1" /> Print / PDF
          </button>
          <button onClick={() => exportCSV(filteredStock, 'stock.csv')} className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">
            <Download className="inline w-4 mr-1" /> Export Stock CSV
          </button>
          <button onClick={() => exportCSV(filteredIssued, 'issued-history.csv')} className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">
            <Download className="inline w-4 mr-1" /> Export Issued CSV
          </button>
          <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            <Plus className="inline w-4 mr-1" /> Add Stock
          </button>
        </div>
      </header>

      {/* Stock Table */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Current Stock</h2>
        <div className="flex justify-between mb-2 items-center">
          <input value={searchStock} onChange={e => setSearchStock(e.target.value)} placeholder="Search item or batch" className="border px-3 py-2 rounded w-full sm:w-1/2" />
          <select value={stockPageSize} onChange={e => setStockPageSize(Number(e.target.value))} className="border ml-4 p-1 rounded">
            {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n}/page</option>)}
          </select>
        </div>
        <div className="text-sm text-gray-600 mb-1">Showing <strong>{filteredStock.length}</strong> entries | Total Value: ₹<strong>{totalValue.toFixed(2)}</strong></div>
        <table className="min-w-full bg-white border mb-2">
          <thead className="bg-gray-100"><tr>
            <th className="border px-4 py-2">Item</th><th className="border px-4 py-2">Batch ID</th>
            <th className="border px-4 py-2">Qty</th><th className="border px-4 py-2">Unit</th>
            <th className="border px-4 py-2">Cost/Unit</th>
          </tr></thead>
          <tbody>
            {paginatedStock.map((i, idx) => <tr key={idx}>
              <td className="border px-4 py-2">{i.itemName}</td>
              <td className="border px-4 py-2">{i.batchId}</td>
              <td className="border px-4 py-2">{i.quantity}</td>
              <td className="border px-4 py-2">{i.unit}</td>
              <td className="border px-4 py-2">₹{i.costPerUnit}</td>
            </tr>)}
          </tbody>
        </table>
        <nav className="text-sm">
          {[...Array(Math.ceil(filteredStock.length / stockPageSize)).keys()].map(n =>
            <button key={n} onClick={() => setStockPage(n + 1)} className={"px-2 " + (stockPage === n + 1 ? "font-bold" : "")}>{n + 1}</button>)}
        </nav>
      </section>

      {/* Issued History */}
      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Issued Stock History</h2>
        <div className="flex gap-4 mb-2 items-center">
          <input value={searchIssued} onChange={e => setSearchIssued(e.target.value)} placeholder="Search" className="border px-3 py-2 rounded w-1/3" />
          <input type="date" value={issuedFrom} onChange={e => setIssuedFrom(e.target.value)} className="border px-2 py-1 rounded" />
          <input type="date" value={issuedTo} onChange={e => setIssuedTo(e.target.value)} className="border px-2 py-1 rounded" />
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="border p-1 rounded">
            <option value="all">All Depts</option>
            {[...new Set(issuedHistory.map(i => i.department))].map(dep => <option key={dep} value={dep}>{dep}</option>)}
          </select>
          <select value={issuedPageSize} onChange={e => setIssuedPageSize(Number(e.target.value))} className="border p-1 rounded ml-auto">
            {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n}/page</option>)}
          </select>
        </div>
        <table className="min-w-full bg-white border mb-2">
          <thead className="bg-gray-100"><tr>
            <th className="border px-4 py-2">Item</th><th className="border px-4 py-2">Qty</th>
            <th className="border px-4 py-2">Issued To</th><th className="border px-4 py-2">Dept</th>
            <th className="border px-4 py-2">Reason</th><th className="border px-4 py-2">Description</th>
            <th className="border px-4 py-2">Issued At</th><th className="border px-4 py-2">Approved By</th>
          </tr></thead>
          <tbody>
            {paginatedIssued.map((i, idx) => <tr key={idx}>
              <td className="border px-4 py-2">{i.item}</td>
              <td className="border px-4 py-2">{i.quantityIssued}</td>
              <td className="border px-4 py-2">{i.requestedBy?.name}</td>
              <td className="border px-4 py-2">{i.department}</td>
              <td className="border px-4 py-2">{i.reason}</td>
              <td className="border px-4 py-2">{i.description || '-'}</td>
              <td className="border px-4 py-2">{new Date(i.issuedAt).toLocaleString()}</td>
              <td className="border px-4 py-2">{i.approvedBy?.name || '-'}</td>
            </tr>)}
          </tbody>
        </table>
        <nav className="text-sm">
          {[...Array(Math.ceil(filteredIssued.length / issuedPageSize)).keys()].map(n =>
            <button key={n} onClick={() => setIssuedPage(n + 1)} className={"px-2 " + (issuedPage === n + 1 ? "font-bold" : "")}>{n + 1}</button>)}
        </nav>
      </section>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg space-y-4 shadow-lg">
            <h2 className="text-xl font-bold">Add New Stock</h2>
            <div className="grid grid-cols-2 gap-3">
              {['itemName', 'batchId', 'quantity', 'unit', 'costPerUnit'].map((key, i) => {
                const labelMap: any = {
                  itemName: 'Item Name',
                  batchId: 'Batch ID',
                  quantity: 'Quantity',
                  unit: 'Unit',
                  costPerUnit: 'Cost Per Unit'
                };
                return key === 'unit' ? (
                  <select
                    key={key}
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="border p-2 rounded"
                  >
                    <option value="">Select Unit</option>
                    <option value="pcs">pcs</option>
                    <option value="mtr">mtr</option>
                    <option value="box">box</option>
                    <option value="kg">kg</option>
                    <option value="litre">litre</option>
                    <option value="strip">strip</option>
                  </select>
                ) : (
                  <input
                    key={key}
                    placeholder={labelMap[key]}
                    value={(formData as any)[key]}
                    onChange={(e) => setFormData(fs => ({ ...fs, [key]: e.target.value }))}
                    className="border p-2 rounded"
                  />
                );
              })}
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="text-gray-600">Cancel</button>
              <button onClick={handleAddStock} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockOverview;
