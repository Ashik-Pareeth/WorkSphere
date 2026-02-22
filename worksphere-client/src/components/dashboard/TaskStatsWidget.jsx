import React from 'react';

// A reusable mini-component just for the stat blocks
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

const TaskStatsWidget = ({ tasks = [] }) => {
  // 1. Instantly calculate our metrics from the passed-in array
  const activeCount = tasks.filter((t) =>
    ['TODO', 'IN_PROGRESS'].includes(t.status)
  ).length;
  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const overdueCount = tasks.filter((t) => t.isOverdue).length;

  // 2. SVG Icons
  const ClipboardIcon = (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    </svg>
  );
  const CheckCircleIcon = (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
  const AlertIcon = (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 h-full">
      <StatCard
        title="Active Tasks"
        value={activeCount}
        colorClass="text-blue-600"
        bgColorClass="bg-blue-50/40"
        icon={ClipboardIcon}
      />
      <StatCard
        title="Completed"
        value={completedCount}
        colorClass="text-emerald-600"
        bgColorClass="bg-emerald-50/40"
        icon={CheckCircleIcon}
      />
      <StatCard
        title="Overdue"
        value={overdueCount}
        colorClass="text-red-600"
        bgColorClass="bg-red-50/40"
        icon={AlertIcon}
      />
    </div>
  );
};

export default TaskStatsWidget;
