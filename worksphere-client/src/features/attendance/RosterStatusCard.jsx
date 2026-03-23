import React from 'react';
import { Pencil, History } from 'lucide-react';

const STATUS_BADGE = {
  PRESENT: {
    label: 'Present',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  LATE: {
    label: 'Late',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  ON_LEAVE: {
    label: 'On Leave',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  ABSENT: {
    label: 'Absent',
    className: 'bg-gray-100 text-gray-500 border-gray-200',
  },
};

const formatTime = (isoString) => {
  if (!isoString) return '--:--';
  return new Date(isoString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getInitials = (first, last) =>
  `${(first || '?')[0]}${(last || '?')[0]}`.toUpperCase();

const RosterStatusCard = ({ employee, onEditTime, onViewHistory }) => {
  const badge = STATUS_BADGE[employee.dailyStatus] ?? STATUS_BADGE.ABSENT;

  return (
    <div className="bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-150">
      {/* Row 1: avatar + name + badge + actions */}
      <div className="flex items-center gap-2.5 px-3 pt-2.5 pb-1.5">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-[0.68rem] font-bold text-white flex-shrink-0">
          {getInitials(employee.firstName, employee.lastName)}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate leading-tight">
            {employee.firstName} {employee.lastName}
          </p>
          <p className="text-[0.7rem] text-gray-400 truncate leading-tight">
            {employee.jobTitle || 'Employee'}
          </p>
        </div>

        <span
          className={`text-[0.6rem] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border flex-shrink-0 ${badge.className}`}
        >
          {badge.label}
        </span>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEditTime(employee)}
            disabled={!employee.attendanceId}
            title="Edit Time"
            className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            onClick={() => onViewHistory(employee)}
            disabled={!employee.attendanceId}
            title="View History"
            className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors relative"
          >
            <History className="w-3 h-3" />
            {employee.isManuallyAdjusted && (
              <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-red-400" />
            )}
          </button>
        </div>
      </div>

      {/* Row 2: clock times */}
      <div className="flex items-center gap-3 px-3 pb-2.5 text-xs">
        <span className="flex items-center gap-1">
          <span className="text-gray-400">In:</span>
          <span className="font-medium text-gray-700 tabular-nums">
            {formatTime(employee.clockIn)}
          </span>
        </span>
        <span className="text-gray-300">·</span>
        <span className="flex items-center gap-1">
          <span className="text-gray-400">Out:</span>
          <span className="font-medium text-gray-700 tabular-nums">
            {formatTime(employee.clockOut)}
          </span>
        </span>
      </div>
    </div>
  );
};

export default RosterStatusCard;
