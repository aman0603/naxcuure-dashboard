import React, { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { Plus, AlertCircle, CheckCircle } from 'lucide-react';
import { inventoryAPI } from '../utils/api';
import { InventoryItem } from '../types';

const RequestInventory: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stockWarning, setStockWarning] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const defaultUnits = ['PCS', 'Kg', 'Gram', 'Litre', 'ml', 'Meter', 'Feet', 'Packet', 'Box', 'Set', 'Can', 'Bottle'];

  const [formData, setFormData] = useState({
    itemId: '',
    itemName: '',
    quantity: 1,
    reason: '',
    urgency: 'Medium' as 'Low' | 'Medium' | 'High' | 'Critical',
    unit: '',
    description: '',
  });

  const navigate = useNavigate();

  useEffect(() => {
    const loadItems = async () => {
      try {
        const response = await inventoryAPI.getItems();
        setItems(response.data);
      } catch {
        setError('Failed to load inventory items');
      } finally {
        setLoading(false);
      }
    };
    loadItems();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 1 : value,
    }));
  };

  const handleItemSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedName = e.target.value.trim();
    const matchedItem = items.find(item => item.itemName === selectedName);
    setFormData(prev => ({
      ...prev,
      itemId: matchedItem ? matchedItem._id : '',
      itemName: selectedName,
      unit: matchedItem ? matchedItem.unit : '',
      description: matchedItem ? matchedItem.description : '',
    }));
  };

  const openConfirmModal = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setStockWarning('');

    if (!formData.itemName) {
      setError('Item is required');
      return;
    }
    if (!formData.unit) {
      setError('Unit is required');
      return;
    }
    if (!formData.reason) {
      setError('Reason is required');
      return;
    }

    setConfirmOpen(true);
  };

  const submitConfirmedRequest = async () => {
    setSubmitting(true);
    try {
      const response = await inventoryAPI.createRequest({
        item: formData.itemName,
        unit: formData.unit,
        quantity: formData.quantity,
        reason: formData.reason,
        urgency: formData.urgency,
      });

      const { stockWarning } = response.data;
      setSuccess('Request submitted successfully!');
      if (stockWarning) setStockWarning(stockWarning);
      setConfirmOpen(false);
      setTimeout(() => navigate('/my-requests'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <Plus className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Request Inventory</h1>
              <p className="text-sm text-gray-600">Submit a new material request</p>
            </div>
          </div>
        </div>

        <form onSubmit={openConfirmModal} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              {success}
            </div>
          )}

          {stockWarning && (
            <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 px-4 py-3 rounded-md">
              {stockWarning}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="itemInput" className="block text-sm font-medium text-gray-700 mb-2">
                Item *
              </label>
              <input
                id="itemInput"
                list="itemList"
                onChange={handleItemSelect}
                placeholder="Type or select an item"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <datalist id="itemList">
                {items.map((item) => (
                  <option key={item._id} value={item.itemName} />
                ))}
              </datalist>
              {formData.description && (
                <p className="mt-1 text-sm text-gray-500">
                  Unit: {formData.unit} | {formData.description}
                </p>
              )}
            </div>

            {!formData.unit && (
              <div>
                <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Unit *
                </label>
                <select
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Select --</option>
                  {defaultUnits.map((unit, idx) => (
                    <option key={idx} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                Quantity *
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                required
                min="1"
                value={formData.quantity}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-2">
                Urgency Level
              </label>
              <select
                id="urgency"
                name="urgency"
                value={formData.urgency}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Request *
              </label>
              <textarea
                id="reason"
                name="reason"
                required
                rows={4}
                value={formData.reason}
                onChange={handleInputChange}
                placeholder="Please provide a detailed reason..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal */}
      <Transition appear show={confirmOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setConfirmOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-30" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-full p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                    Confirm Inventory Request
                  </Dialog.Title>
                  <div className="mt-4 text-sm text-gray-700 space-y-2">
                    <p><strong>Item:</strong> {formData.itemName}</p>
                    <p><strong>Unit:</strong> {formData.unit}</p>
                    <p><strong>Quantity:</strong> {formData.quantity}</p>
                    <p><strong>Urgency:</strong> {formData.urgency}</p>
                    <p><strong>Reason:</strong> {formData.reason}</p>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="px-4 py-2 bg-gray-200 rounded-md"
                      onClick={() => setConfirmOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md"
                      onClick={submitConfirmedRequest}
                    >
                      Confirm & Submit
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default RequestInventory;
