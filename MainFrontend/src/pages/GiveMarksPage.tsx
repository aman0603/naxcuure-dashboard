import React, { useEffect, useState } from 'react';
import { performanceAPI, userAPI } from '../utils/api'; // Adjust path as needed

const GiveMarksPage: React.FC = () => {
  const [evaluatees, setEvaluatees] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [criteriaMarks, setCriteriaMarks] = useState({
    punctuality: 0,
    discipline: 0,
    productivity: 0,
    teamwork: 0,
    innovation: 0
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ Fetch eligible evaluatees
  useEffect(() => {
    const fetchEvaluatees = async () => {
      try {
        const res = await userAPI.getAllUsersRaw(); // Use a safer API if needed
        if (Array.isArray(res.data)) {
          setEvaluatees(res.data);
        } else {
          console.warn('Evaluatees response is not an array:', res.data);
          setEvaluatees([]);
        }
      } catch (err) {
        console.error('Error fetching evaluatees:', err);
        setEvaluatees([]);
      }
    };
    fetchEvaluatees();
  }, []);

  const handleChange = (key: string, value: number) => {
    setCriteriaMarks(prev => ({
      ...prev,
      [key]: Math.min(100, Math.max(0, value)) // Clamp between 0–100
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const total = Object.values(criteriaMarks).reduce((sum, val) => sum + val, 0);
    if (total > 100) {
      setMessage('❌ Total marks must not exceed 100.');
      return;
    }

    if (!selectedUser) {
      setMessage('❌ Please select an employee to evaluate.');
      return;
    }

    try {
      setLoading(true);
      await performanceAPI.giveMarks({
        evaluateeId: selectedUser,
        criteriaMarks
      });
      setMessage('✅ Marks submitted successfully.');
      setCriteriaMarks({
        punctuality: 0,
        discipline: 0,
        productivity: 0,
        teamwork: 0,
        innovation: 0
      });
      setSelectedUser('');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || '❌ Failed to submit marks.';
      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">📝 Give Performance Marks</h2>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white shadow-md p-6 rounded-lg">
        {/* Select Evaluatee */}
        <div>
          <label className="block font-medium mb-1">Select Employee</label>
          <select
            className="w-full border p-2 rounded"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            <option value="">-- Select --</option>
            {Array.isArray(evaluatees) &&
              evaluatees.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name} — {user.designation}
                </option>
              ))}
          </select>
        </div>

        {/* Criteria Inputs */}
        {Object.entries(criteriaMarks).map(([key, value]) => (
          <div key={key}>
            <label className="block capitalize font-medium mb-1">{key}</label>
            <input
              type="number"
              value={value}
              onChange={(e) => handleChange(key, Number(e.target.value))}
              className="w-full border p-2 rounded"
              min={0}
              max={100}
            />
          </div>
        ))}

        {/* Total Display */}
        <div className="text-right text-sm text-gray-600">
          Total: <strong>{Object.values(criteriaMarks).reduce((a, b) => a + b, 0)}</strong> / 100
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Marks'}
        </button>

        {/* Message Display */}
        {message && (
          <div
            className={`mt-2 text-sm ${message.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}
          >
            {message}
          </div>
        )}
      </form>
    </div>
  );
};

export default GiveMarksPage;
