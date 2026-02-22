import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth'; // Adjust path if needed!

// Icons
const ClockIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
const CheckBadgeIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
    />
  </svg>
);
const ArrowRightIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 5l7 7-7 7"
    />
  </svg>
);

const ActionItemsWidget = ({ tasks = [] }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Determine which view to show based on roles
  const isManagerOrAdmin = user?.isManager || user?.isGlobalAdmin;

  // --- MANAGER LOGIC: Find tasks waiting for review ---
  const reviewTasks = tasks.filter((t) => t.status === 'IN_REVIEW');

  // --- EMPLOYEE LOGIC: Find upcoming deadlines ---
  const upcomingTasks = tasks
    .filter((t) => t.dueDate && ['TODO', 'IN_PROGRESS'].includes(t.status))
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)) // Sort nearest date first
    .slice(0, 4); // Only show top 4

  // --- HELPER RENDERING FUNCTIONS ---
  const renderManagerList = () => {
    if (reviewTasks.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center py-6 text-gray-400">
          <CheckBadgeIcon />
          <p className="text-sm font-medium text-gray-900 mt-2">Inbox Zero!</p>
          <p className="text-xs mt-1">
            No tasks currently require your review.
          </p>
        </div>
      );
    }

    return (
      <ul className="flex flex-col gap-3">
        {reviewTasks.map((task) => (
          <li
            key={task.id}
            onClick={() => navigate('/tasks')}
            className="group flex items-center justify-between p-3 rounded-lg border border-orange-100 bg-orange-50/30 hover:bg-orange-50 hover:border-orange-200 cursor-pointer transition-all"
          >
            <div>
              <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">
                {task.taskCode}
              </span>
              <h4 className="text-sm font-semibold text-gray-900 mt-1">
                {task.title}
              </h4>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Assigned to:{' '}
                <span className="font-medium text-gray-700">
                  {task.assignedToName || task.assigneeName || 'Unknown'}
                </span>
              </p>
            </div>
            <div className="text-orange-500 group-hover:text-orange-600 opacity-50 group-hover:opacity-100 transition-opacity">
              <ArrowRightIcon />
            </div>
          </li>
        ))}
      </ul>
    );
  };

  const renderEmployeeList = () => {
    if (upcomingTasks.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center py-6 text-gray-400">
          <ClockIcon />
          <p className="text-sm font-medium text-gray-900 mt-2">
            No upcoming deadlines
          </p>
          <p className="text-xs mt-1">You don't have any scheduled tasks.</p>
        </div>
      );
    }

    return (
      <ul className="flex flex-col gap-3">
        {upcomingTasks.map((task) => (
          <li
            key={task.id}
            onClick={() => navigate('/tasks')}
            className={`group flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${task.isOverdue ? 'border-red-100 bg-red-50/30 hover:bg-red-50 hover:border-red-200' : 'border-gray-100 hover:border-blue-200 hover:bg-blue-50/30'}`}
          >
            <div>
              <h4 className="text-sm font-semibold text-gray-900">
                {task.title}
              </h4>
              <div className="flex items-center gap-1 mt-1">
                <ClockIcon />
                <span
                  className={`text-[11px] font-medium ${task.isOverdue ? 'text-red-600 font-bold' : 'text-gray-500'}`}
                >
                  {new Date(task.dueDate).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                  {task.isOverdue ? ' (Overdue!)' : ''}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden">
      {/* DYNAMIC HEADER */}
      <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div>
          <h2 className="text-lg font-bold text-gray-900 leading-none">
            {isManagerOrAdmin ? 'Needs Your Review' : 'Upcoming Deadlines'}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {isManagerOrAdmin
              ? 'Tasks submitted by your team'
              : 'Active tasks sorted by due date'}
          </p>
        </div>
        <div
          className={`text-xs font-bold px-2.5 py-1 rounded-full ${isManagerOrAdmin ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}
        >
          {isManagerOrAdmin ? reviewTasks.length : upcomingTasks.length} Items
        </div>
      </div>

      {/* DYNAMIC LIST */}
      <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
        {isManagerOrAdmin ? renderManagerList() : renderEmployeeList()}
      </div>
    </div>
  );
};

export default ActionItemsWidget;
