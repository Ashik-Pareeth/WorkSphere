import React from 'react';

const ClockIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TaskCard = React.forwardRef(({ task, onClick, isDragging, ...dragProps }, ref) => {
  const isCancelled = task.status === 'CANCELLED';
  const isCompleted = task.status === 'COMPLETED';

  // Check if overdue
  let isOverdue = false;
  if (task.dueDate && !isCancelled && !isCompleted) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate);
    isOverdue = dueDate < today;
  }

  // Determine priority classes
  let priorityClass = '';
  if (isCancelled) {
    priorityClass = 'bg-gray-50 text-gray-400 border-gray-200';
  } else if (task.priority === 'URGENT') {
    priorityClass = 'bg-purple-50 text-purple-700 border-purple-200';
  } else if (task.priority === 'HIGH') {
    priorityClass = 'bg-red-50 text-red-600 border-red-100';
  } else if (task.priority === 'MEDIUM') {
    priorityClass = 'bg-amber-50 text-amber-600 border-amber-100';
  } else {
    priorityClass = 'bg-emerald-50 text-emerald-600 border-emerald-100';
  }

  return (
    <div
      ref={ref}
      onClick={() => onClick(task)}
      {...dragProps}
      className={`group relative mb-3 p-4 bg-white rounded-xl border shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
        isCancelled
          ? 'border-red-100 opacity-80 hover:opacity-100 hover:border-red-300'
          : 'border-gray-200 hover:border-blue-400'
      } ${isDragging ? 'rotate-1 scale-105 ring-2 ring-blue-500/20 z-50' : ''}`}
    >
      {/* Top Row: Priority & ID */}
      <div className="flex justify-between items-start mb-2">
        <span className={`font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded ${isCancelled ? 'text-red-400 bg-red-50' : 'text-gray-500 bg-gray-100'}`}>
          {task.taskCode}
        </span>
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${priorityClass}`}>
          {task.priority}
        </span>
      </div>

      {/* Title */}
      <h4 className={`text-sm font-semibold leading-snug mb-3 ${isCancelled ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
        {task.title}
      </h4>

      {/* Assigner & Assignee */}
      <div className={`flex flex-col gap-2 mb-3 p-2 rounded-lg border ${isCancelled ? 'bg-white border-red-50' : 'bg-gray-50/50 border-gray-100'}`}>
        <div className="flex items-center gap-2">
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(task.assignedToName || task.assigneeName || 'U')}&background=${isCancelled ? 'fee2e2' : 'eff6ff'}&color=${isCancelled ? 'ef4444' : '2563eb'}&size=20`}
            alt="Assignee"
            className={`w-5 h-5 rounded-full shadow-sm ${isCancelled ? 'grayscale' : ''}`}
          />
          <div className="flex flex-col">
            <span className="text-[9px] text-gray-400 font-semibold leading-none uppercase tracking-wider">
              {isCancelled ? 'Was Doing' : 'Doing'}
            </span>
            <span className={`text-[11px] font-medium leading-tight truncate max-w-30 ${isCancelled ? 'text-gray-500' : 'text-gray-700'}`}>
              {task.assignedToName || task.assigneeName || 'Unassigned'}
            </span>
          </div>
        </div>

        {task.assignerName && (
          <div className="flex items-center gap-2">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(task.assignerName)}&background=f8fafc&color=64748b&size=20`}
              alt="Assigner"
              className="w-5 h-5 rounded-full shadow-sm"
            />
            <div className="flex flex-col">
              <span className="text-[9px] text-gray-400 font-semibold leading-none uppercase tracking-wider">Given By</span>
              <span className={`text-[11px] font-medium leading-tight truncate max-w-30 ${isCancelled ? 'text-gray-500' : 'text-gray-700'}`}>
                {task.assignerName}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Row: Date */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className={`flex items-center gap-1.5 text-[11px] font-medium ${isOverdue ? 'text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md border border-red-100' : 'text-gray-500'}`}>
          <ClockIcon />
          <span className={isCancelled ? 'line-through' : ''}>
            {task.dueDate
              ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
              : 'No Due Date'}
            {isOverdue && ' (Overdue)'}
          </span>
        </div>
      </div>
    </div>
  );
});

export default TaskCard;
