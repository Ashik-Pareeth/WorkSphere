import React from 'react';

const PendingLeaveTable = ({ requests, onActionClick }) => {
  if (!requests || requests.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-200 shadow-sm">
        No pending leave requests to review! 🎉
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600 uppercase tracking-wider">
              <th className="p-4">Employee</th>
              <th className="p-4">Policy</th>
              <th className="p-4">Dates</th>
              <th className="p-4">Days</th>
              <th className="p-4">Reason</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 text-sm font-medium text-gray-900">
                  {req.employee.firstName} {req.employee.lastName}
                </td>
                <td className="p-4 text-sm text-gray-600">
                  {req.leavePolicy.name}
                </td>
                <td className="p-4 text-sm text-gray-900">
                  {new Date(req.startDate).toLocaleDateString()} -{' '}
                  {new Date(req.endDate).toLocaleDateString()}
                </td>
                <td className="p-4 text-sm font-semibold text-gray-900">
                  {req.requestedDays}
                </td>
                <td
                  className="p-4 text-sm text-gray-500 max-w-xs truncate"
                  title={req.reason}
                >
                  {req.reason}
                </td>
                <td className="p-4 flex justify-end gap-2">
                  <button
                    onClick={() => onActionClick(req, 'approve')}
                    className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded font-medium text-sm transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => onActionClick(req, 'reject')}
                    className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded font-medium text-sm transition-colors"
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PendingLeaveTable;
