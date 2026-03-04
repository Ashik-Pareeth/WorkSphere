import React from 'react';

const MyLeaveRequestsTable = ({ ledger }) => {
  if (!ledger || ledger.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-200 shadow-sm">
        You have no leave history.
      </div>
    );
  }

  const getBadgeColor = (type) => {
    switch (type) {
      case 'ACCRUAL':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'DEDUCTION':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ADJUSTMENT':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600 uppercase tracking-wider">
              <th className="p-4">Date</th>
              <th className="p-4">Policy</th>
              <th className="p-4">Transaction</th>
              <th className="p-4">Days</th>
              <th className="p-4">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {ledger.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 text-sm text-gray-900 whitespace-nowrap">
                  {new Date(item.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4 text-sm text-gray-900 font-medium">
                  {item.leavePolicy.name}
                </td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 text-xs font-bold border rounded-full ${getBadgeColor(item.transactionType)}`}
                  >
                    {item.transactionType}
                  </span>
                </td>
                <td className="p-4 text-sm font-semibold text-gray-900">
                  {item.daysChanged > 0
                    ? `+${item.daysChanged}`
                    : item.daysChanged}
                </td>
                <td className="p-4 text-sm text-gray-500 max-w-xs truncate">
                  {item.reason}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MyLeaveRequestsTable;
