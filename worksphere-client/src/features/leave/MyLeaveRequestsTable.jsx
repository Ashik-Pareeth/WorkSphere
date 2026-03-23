import React from 'react';
import { Check, Clock, X as XIcon } from 'lucide-react';

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
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const LeaveStatusTimeline = ({ status = 'APPROVED' }) => {
    // In a ledger, items are usually implicitly APPROVED because they hit the books.
    // If you pass a real status later, it adapts.
    const isApproved = status === 'APPROVED';
    const isRejected = status === 'REJECTED';
    const isPending = status === 'PENDING';

    return (
      <div className="flex items-center gap-1.5 w-max">
        {/* Step 1: Submitted (always done) */}
        <div className="flex flex-col items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 ring-2 ring-white">
          <Check size={10} strokeWidth={3} />
        </div>
        
        <div className="w-4 h-[2px] bg-gray-200" />
        
        {/* Step 2: Pending/Reviewed */}
        <div className={`flex flex-col items-center justify-center w-5 h-5 rounded-full ring-2 ring-white ${isPending ? 'bg-amber-100 text-amber-600' : 'bg-gray-200 text-gray-400'}`}>
          {isPending ? <Clock size={10} strokeWidth={2.5} /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />}
        </div>
        
        <div className="w-4 h-[2px] bg-gray-200" />
        
        {/* Step 3: Final Status */}
        <div className={`flex flex-col items-center justify-center w-5 h-5 rounded-full ring-2 ring-white ${
          isApproved ? 'bg-emerald-100 text-emerald-600' : 
          isRejected ? 'bg-red-100 text-red-600' : 
          'bg-gray-100 text-gray-300'
        }`}>
          {isApproved ? <Check size={10} strokeWidth={3} /> : 
           isRejected ? <XIcon size={10} strokeWidth={3} /> : 
           <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />}
        </div>
      </div>
    );
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
              <th className="p-4">Status</th>
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
                <td className="p-4">
                  <LeaveStatusTimeline status={item.status || 'APPROVED'} />
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
