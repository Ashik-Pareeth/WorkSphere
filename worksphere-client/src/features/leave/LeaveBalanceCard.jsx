import React from 'react';

const LeaveBalanceCard = ({ balances }) => {
  if (!balances || balances.length === 0) {
    return (
      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-500">
        No leave balances found for this year.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {balances.map((balance) => (
        <div
          key={balance.id}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">
              {balance.leavePolicy.name}
            </span>
            {/* A tiny visual indicator if they are running low */}
            {balance.daysAvailable <= 2 && balance.daysAvailable > 0 && (
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-gray-900">
              {balance.daysAvailable}
            </span>
            <span className="text-gray-500 font-medium">days available</span>
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between text-sm">
            <span className="text-gray-500 font-medium">
              Total: {balance.daysAllocated}
            </span>
            <span className="text-gray-500 font-medium">
              Used: {balance.daysUsed}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LeaveBalanceCard;
