import React from 'react';

const StatCard = ({ title, value, icon, colorClass, bgColorClass }) => (
  <div
    className={`p-5 rounded-xl border flex flex-col justify-center gap-3 ${bgColorClass} border-gray-100 shadow-sm h-full`}
  >
    <div className="flex items-center gap-3">
      <div className={`p-2.5 rounded-lg ${colorClass} bg-white shadow-sm`}>
        {icon}
      </div>
      <p className="text-sm font-semibold text-gray-600">{title}</p>
    </div>
    <h3 className="text-3xl font-bold text-gray-900 ml-1">{value}</h3>
  </div>
);

export default StatCard;
