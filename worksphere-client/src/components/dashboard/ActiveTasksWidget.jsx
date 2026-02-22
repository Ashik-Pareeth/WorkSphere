import React from 'react';
import { useNavigate } from 'react-router-dom';

const ArrowRightIcon = () => (
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
      d="M14 5l7 7m0 0l-7 7m7-7H3"
    />
  </svg>
);
const ClockIcon = () => (
  <svg
    className="w-3.5 h-3.5"
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

// Accept `tasks` and `loading` as props directly from the Dashboard
const ActiveTasksWidget = ({ tasks = [], loading }) => {
  const navigate = useNavigate();

  // Filter only the IN_PROGRESS tasks
  const activeTasks = tasks.filter((task) => task.status === 'IN_PROGRESS');

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div>
          <h2 className="text-lg font-bold text-gray-900 leading-none">
            Current Focus
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Tasks you are actively working on
          </p>
        </div>
        <div className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">
          {activeTasks.length} {activeTasks.length === 1 ? 'Task' : 'Tasks'}
        </div>
      </div>

      <div className="p-5 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-full text-sm text-gray-400 animate-pulse">
            Loading tasks...
          </div>
        ) : activeTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-6">
            <span className="text-4xl mb-2">🎉</span>
            <p className="text-sm font-medium text-gray-900">
              You're all caught up!
            </p>
            <p className="text-xs text-gray-500 mt-1">
              No tasks currently in progress.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {activeTasks.map((task) => (
              <li
                key={task.id}
                className="group border border-gray-200 rounded-lg p-3 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer"
                onClick={() => navigate('/tasks')}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <span className="font-mono text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                    {task.taskCode}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                      task.priority === 'URGENT'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : task.priority === 'HIGH'
                          ? 'bg-red-50 text-red-600 border-red-100'
                          : task.priority === 'MEDIUM'
                            ? 'bg-amber-50 text-amber-600 border-amber-100'
                            : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 truncate mb-2">
                  {task.title}
                </h4>
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                  <ClockIcon />
                  <span
                    className={task.isOverdue ? 'text-red-600 font-bold' : ''}
                  >
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'No Due Date'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="p-4 border-t border-gray-100 bg-gray-50/50 mt-auto">
        <button
          onClick={() => navigate('/tasks')}
          className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 hover:text-blue-600 hover:border-blue-300 transition-all active:scale-[0.98]"
        >
          <span>Open Full Task Board</span>
          <ArrowRightIcon />
        </button>
      </div>
    </div>
  );
};

export default ActiveTasksWidget;
