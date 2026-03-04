import React, { useState } from 'react';
import { approveLeaveRequest, rejectLeaveRequest } from '../../api/leaveApi';

const LeaveActionModal = ({ request, action, onClose, onSuccess }) => {
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isApprove = action === 'approve';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isApprove) {
        await approveLeaveRequest(request.id, comment);
      } else {
        await rejectLeaveRequest(request.id, comment);
      }
      onSuccess(); // Refresh the table and close modal
    } catch (error) {
      console.error(`Failed to ${action} request:`, error);
      alert(error.response?.data?.message || `Failed to ${action} request.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
        <div
          className={`px-6 py-4 border-b flex justify-between items-center ${isApprove ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}
        >
          <h3
            className={`text-lg font-bold ${isApprove ? 'text-green-800' : 'text-red-800'}`}
          >
            {isApprove ? 'Approve' : 'Reject'} Leave Request
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 font-bold text-xl"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 mb-4">
            <p>
              <strong>Employee:</strong> {request.employee.firstName}{' '}
              {request.employee.lastName}
            </p>
            <p>
              <strong>Dates:</strong>{' '}
              {new Date(request.startDate).toLocaleDateString()} to{' '}
              {new Date(request.endDate).toLocaleDateString()}
            </p>
            <p>
              <strong>Days:</strong> {request.requestedDays}
            </p>
            <p>
              <strong>Type:</strong> {request.leavePolicy.name}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Manager Comment{' '}
              {isApprove ? (
                '(Optional)'
              ) : (
                <span className="text-red-500">* (Required)</span>
              )}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 h-24 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder={
                isApprove
                  ? 'Add an optional note...'
                  : 'Reason for rejection is required.'
              }
              required={!isApprove}
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-5 py-2 text-white font-medium rounded-lg transition-colors disabled:opacity-50 ${isApprove ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {isLoading
                ? 'Processing...'
                : `Confirm ${isApprove ? 'Approval' : 'Rejection'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveActionModal;
