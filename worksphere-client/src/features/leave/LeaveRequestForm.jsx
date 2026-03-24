import React, { useState } from 'react';
import { submitLeaveRequest } from '../../api/leaveApi';

const LeaveRequestForm = ({ balances, onSuccess, onCancel }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    policyId: balances.length > 0 ? balances[0].leavePolicy.id : '',
    startDate: '',
    endDate: '',
    requestedDays: 1,
    reason: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await submitLeaveRequest(formData);
      onSuccess(); // Tell the parent to close the modal and refresh data
    } catch (error) {
      console.error('Failed to submit leave request:', error);
      alert('Error submitting request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-white rounded-xl">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Leave Policy
        </label>
        <select
          name="policyId"
          value={formData.policyId}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg p-2.5 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          required
        >
          {balances.map((b) => (
            <option key={b.leavePolicy.id} value={b.leavePolicy.id}>
              {b.leavePolicy.name} ({b.daysAvailable} days left)
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            name="startDate"
            min={new Date().toISOString().split('T')[0]}
            value={formData.startDate}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            min={formData.startDate} // Basic validation
            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Total Days Deducted
        </label>
        <input
          type="number"
          step="0.5"
          min="0.5"
          name="requestedDays"
          value={formData.requestedDays}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg p-2.5 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Reason
        </label>
        <textarea
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg p-2.5 h-24 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Briefly describe your request..."
          required
        />
      </div>

      <div className="pt-2 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:bg-blue-400"
        >
          {isLoading ? 'Submitting...' : 'Submit Request'}
        </button>
      </div>
    </form>
  );
};

export default LeaveRequestForm;
